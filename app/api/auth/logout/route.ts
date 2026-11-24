import { NextResponse } from "next/server";
import { authCookieOptions } from "@/lib/auth";

export async function POST() {
  try {
    const response = NextResponse.json({ message: "Logged out" });
    const options = authCookieOptions(0);
    response.cookies.set("token", "", options);
    // Sessions created before AUTH_COOKIE_DOMAIN was set are host-only
    // cookies; clear that variant too so the user is really logged out.
    if (options.domain) {
      response.headers.append(
        "Set-Cookie",
        `token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${options.secure ? "; Secure" : ""}`
      );
    }
    return response;
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
