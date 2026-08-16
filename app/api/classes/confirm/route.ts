import { NextRequest, NextResponse } from "next/server";
import { confirmClassEnrollment } from "@/lib/classes";

// ── POST /api/classes/confirm ────────────────────────────────────────────────
// Thin wrapper around the shared confirmClassEnrollment() in lib/classes.ts,
// which is also used by the QorePay webhook (/api/payment/webhook). Keeps the
// same response contract as before: { success, confirmed (access pin),
// email, className }.

export async function POST(request: NextRequest) {
  try {
    let body: { reference?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const reference = body.reference?.trim();
    if (!reference) {
      return NextResponse.json(
        { error: "Payment reference is required" },
        { status: 400 }
      );
    }

    const result = await confirmClassEnrollment(reference);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Failed to confirm enrollment" },
        { status: result.status ?? 500 }
      );
    }

    return NextResponse.json({
      success: true,
      confirmed: result.accessPin,
      email: result.email,
      className: result.className,
    });
  } catch (error) {
    console.error("[POST /api/classes/confirm]", error);
    return NextResponse.json(
      { error: "Failed to confirm enrollment" },
      { status: 500 }
    );
  }
}