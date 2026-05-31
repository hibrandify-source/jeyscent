// app/api/admin/blog/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

// PUT — update a blog post
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!await requireAdmin()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, slug, excerpt, content, image, author } = body;

    if (!title || !slug || !excerpt || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const post = await prisma.blogPost.update({
      where: { id: params.id },
      data: { title, slug, excerpt, content, image, author },
    });

    return NextResponse.json({ post, message: "Post updated" });
  } catch (error) {
    console.error("Admin blog PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — delete a blog post
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!await requireAdmin()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.blogPost.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Post deleted" });
  } catch (error) {
    console.error("Admin blog DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}