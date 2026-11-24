"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  createdAt: string;
}

export default function BlogPostPage() {
  const params = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/blog/${params.slug}`)
      .then((res) => {
        if (!res.ok) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setPost(data.post);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [params.slug]);

  if (loading) {
    return (
      <div className="pt-32 pb-20 text-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="page-transition pt-32 pb-20 text-center">
        <h1 className="text-3xl mb-4 font-serif">Post Not Found</h1>
        <p className="text-muted mb-8">
          The article you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/blog"
          className="inline-block bg-black text-white px-8 py-3 text-[11px] uppercase tracking-[3px]"
        >
          Back to Journal
        </Link>
      </div>
    );
  }

  const contentParagraphs = post.content.split("\n").filter((p) => p.trim());

  return (
    <div className="page-transition pt-24 lg:pt-28">
      {/* Breadcrumb */}
      <div className="max-w-3xl mx-auto px-6 py-4">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[2px] text-muted">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-black transition-colors">Journal</Link>
          <span>/</span>
          <span className="text-black truncate max-w-[200px]">{post.title}</span>
        </div>
      </div>

      {/* Hero Image */}
      <div className="max-w-4xl mx-auto px-6 mb-10">
        <div className="relative aspect-[16/9] overflow-hidden bg-light-gray">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover"
            priority
            loading="eager"
            sizes="(max-width: 1024px) 100vw, 896px"
          />
        </div>
      </div>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-6 pb-20 lg:pb-28">
        {/* Meta */}
        <div className="text-center mb-10">
          <p className="text-[10px] uppercase tracking-[3px] text-muted mb-4">
            {new Date(post.createdAt).toLocaleDateString("en-NG", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            · {post.author}
          </p>
          <h1 className="text-3xl lg:text-4xl tracking-wide leading-tight mb-6 font-serif">
            {post.title}
          </h1>
          <div className="luxury-divider mx-auto" />
        </div>

        {/* Content */}
        <div className="space-y-6">
          {contentParagraphs.map((paragraph, i) => {
            if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
              return (
                <h3 key={i} className="text-xl font-semibold mt-8 font-serif">
                  {paragraph.replace(/\*\*/g, "")}
                </h3>
              );
            }

            const parts = paragraph.split(/(\*\*.*?\*\*)/g);
            return (
              <p key={i} className="text-charcoal leading-[1.9]">
                {parts.map((part, j) => {
                  if (part.startsWith("**") && part.endsWith("**")) {
                    return <strong key={j}>{part.replace(/\*\*/g, "")}</strong>;
                  }
                  return <span key={j}>{part}</span>;
                })}
              </p>
            );
          })}
        </div>

        {/* Share & Back */}
        <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/blog"
            className="text-[11px] uppercase tracking-[3px] text-muted hover:text-black border-b border-muted hover:border-black pb-1 transition-all"
          >
            ← Back to Journal
          </Link>
          <Link
            href="/shop"
            className="bg-black text-white px-8 py-3 text-[11px] uppercase tracking-[3px] hover:bg-charcoal transition-all"
          >
            Shop Now
          </Link>
        </div>
      </article>
    </div>
  );
}