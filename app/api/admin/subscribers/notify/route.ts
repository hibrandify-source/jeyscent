// app/api/admin/subscribers/notify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

// FIXED: decoded.userId → decoded.id, 'ADMIN' → 'admin'
async function isAdmin(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) return false;

  const decoded = verifyToken(token);
  if (!decoded) return false;

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
  });

  return user?.role === "admin";
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { subject, type, title, message, link } = await request.json();

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      );
    }

    // Get all active subscribers
    const subscribers = await prisma.subscriber.findMany({
      where: { active: true },
      select: { email: true },
    });

    if (subscribers.length === 0) {
      return NextResponse.json(
        { message: "No active subscribers to notify" },
        { status: 200 }
      );
    }

    // FIXED: Use Gmail config (same as all other emails)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const typeLabel =
      type === "new_product"
        ? "🆕 New Product Alert!"
        : type === "new_blog"
        ? "📖 New Blog Post!"
        : "✨ Jey Scent Update";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#faf9f6;font-family:'Inter',sans-serif;">
        <div style="max-width:600px;margin:0 auto;background:#fff;">
          <div style="background:#000;padding:40px;text-align:center;">
            <h1 style="color:#fff;font-family:'Playfair Display',Georgia,serif;font-size:28px;margin:0;letter-spacing:3px;">
              JEY SCENT
            </h1>
            <p style="color:#fff;margin:10px 0 0;font-size:13px;letter-spacing:1px;opacity:0.7;">
              ${typeLabel}
            </p>
          </div>
          
          <div style="padding:40px;">
            <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:22px;margin-bottom:16px;">
              ${title || subject}
            </h2>
            <div style="color:#6b6b6b;font-size:15px;line-height:1.8;">
              ${message.replace(/\n/g, "<br>")}
            </div>
            
            ${
              link
                ? `
              <div style="text-align:center;margin:35px 0;">
                <a href="${link}" 
                   style="display:inline-block;padding:14px 40px;background:#000;color:#fff;text-decoration:none;font-size:13px;text-transform:uppercase;letter-spacing:2px;">
                  ${
                    type === "new_product"
                      ? "Shop Now"
                      : type === "new_blog"
                      ? "Read More"
                      : "Learn More"
                  }
                </a>
              </div>
            `
                : ""
            }
          </div>
          
          <div style="background:#faf9f6;padding:25px;text-align:center;">
            <p style="font-family:'Playfair Display',Georgia,serif;font-size:14px;margin-bottom:8px;">
              With love & intention 🤍
            </p>
            <p style="color:#6b6b6b;font-size:11px;margin:0;">
              You received this because you subscribed to Jey Scent updates.
            </p>
            <p style="color:#999;font-size:11px;margin:4px 0 0;">
              © ${new Date().getFullYear()} Jey Scent. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send emails in batches
    const batchSize = 10;
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map((sub) =>
          transporter.sendMail({
            from: `"Jey Scent" <${process.env.GMAIL_USER}>`,
            to: sub.email,
            subject,
            html: emailHtml,
          })
        )
      );

      results.forEach((result) => {
        if (result.status === "fulfilled") sentCount++;
        else failedCount++;
      });

      if (i + batchSize < subscribers.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({
      message: `Notification sent to ${sentCount} subscriber(s)${
        failedCount > 0 ? `. ${failedCount} failed.` : "."
      }`,
      sentCount,
      failedCount,
    });
  } catch (error) {
    console.error("Notify subscribers error:", error);
    return NextResponse.json(
      { error: "Failed to send notifications" },
      { status: 500 }
    );
  }
}