// POST /api/gift/quote — corporate / bulk gifting enquiry from
// gift.jeyscent.com/quote. Stores a QuoteRequest and emails the team plus an
// acknowledgement to the customer. Corporate gifts are sold by quote, so this
// never touches payments.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rateLimit";
import { sendQuoteRequestEmails } from "@/lib/email";

const str = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export async function POST(request: NextRequest) {
  // 5 enquiries per 10 minutes per IP — enough for a real buyer correcting a
  // typo, low enough to stop the form being used to spam our inbox.
  const ip = clientIp(request);
  const rl = rateLimit(`quote:${ip}`, { limit: 5, windowMs: 10 * 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfterMs, "Too many enquiries. Please try again later.");

  try {
    const body = await request.json();

    const company = str(body.company, 150);
    const contactName = str(body.contactName, 100);
    const email = str(body.email, 200);
    const phone = str(body.phone, 30);
    const occasion = str(body.occasion, 100);
    const message = str(body.message, 2000);
    const deliveryDate = str(body.deliveryDate, 10);
    const quantity = Number(body.quantity);
    const budgetPerGift =
      body.budgetPerGift === "" || body.budgetPerGift == null
        ? null
        : Number(body.budgetPerGift);

    if (!company || !contactName || !email || !phone || !occasion) {
      return NextResponse.json(
        { error: "Please fill in your company, name, email, phone and occasion" },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email" }, { status: 400 });
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) {
      return NextResponse.json({ error: "Please enter how many gifts you need" }, { status: 400 });
    }
    if (budgetPerGift !== null && (!Number.isFinite(budgetPerGift) || budgetPerGift < 0)) {
      return NextResponse.json({ error: "Invalid budget" }, { status: 400 });
    }
    if (deliveryDate && !/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)) {
      return NextResponse.json({ error: "Invalid delivery date" }, { status: 400 });
    }

    const quote = await prisma.quoteRequest.create({
      data: {
        company,
        contactName,
        email,
        phone,
        occasion,
        quantity,
        budgetPerGift,
        deliveryDate: deliveryDate || null,
        brandingRequired: Boolean(body.brandingRequired),
        message,
      },
    });

    // Awaited (capped) — fire-and-forget promises are dropped by the
    // serverless runtime once the response is sent.
    await Promise.race([
      sendQuoteRequestEmails(quote).catch((err) =>
        console.error("[gift/quote] Email failed (non-fatal):", err)
      ),
      new Promise<void>((resolve) => setTimeout(resolve, 6000)),
    ]);

    return NextResponse.json({ id: quote.id });
  } catch (error) {
    console.error("[gift/quote] Unexpected error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
