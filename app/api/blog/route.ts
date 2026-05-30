import { NextResponse } from "next/server";
import { getPublishedPosts } from "@/lib/db";

export async function GET() {
  try {
    const posts = await getPublishedPosts();
    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Blog error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}