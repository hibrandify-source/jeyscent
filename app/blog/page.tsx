// app/blog/page.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  image: string;
  author: string;
  createdAt: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/blog")
      .then((res) => res.json())
      .then((data) => {
        setPosts(data.posts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="pt-24 lg:pt-28">
      {/* Header */}
      <section className="bg-black text-white py-16 lg:py-24 text-center">
        <p className="text-[10px] uppercase tracking-[5px] text-white/40 mb-4">
          Stories & Thoughts
        </p>
        <h1
          className="text-3xl sm:text-4xl lg:text-5xl tracking-wide mb-4"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          The Journal
        </h1>
        <p className="text-white/40 text-sm max-w-md mx-auto">
          Fragrance tips, brand stories, and the beautiful things we&apos;re
          learning along the way.
        </p>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : posts.length === 0 ? (
            <div className="py-20 text-center">
              <h3
                className="text-xl mb-3"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Coming Soon
              </h3>
              <p className="text-muted text-sm">
                We&apos;re writing something beautiful. Check back soon.
              </p>
            </div>
          ) : (
            <>
              {/* Featured Post — FIXED: priority + loading eager (this is the LCP image) */}
              {posts[0] && (
                <Link
                  href={`/blog/${posts[0].slug}`}
                  className="group grid lg:grid-cols-2 gap-8 lg:gap-12 mb-16 lg:mb-24"
                >
                  <div className="relative aspect-[4/3] lg:aspect-[4/5] overflow-hidden bg-light-gray">
                    <Image
                      src={posts[0].image}
                      alt={posts[0].title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      priority
                      loading="eager"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                  <div className="flex flex-col justify-center py-4">
                    <p className="text-[10px] uppercase tracking-[3px] text-muted mb-4">
                      {new Date(posts[0].createdAt).toLocaleDateString(
                        "en-NG",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )}
                    </p>
                    <h2
                      className="text-2xl lg:text-3xl tracking-wide mb-4 group-hover:text-muted transition-colors duration-300"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {posts[0].title}
                    </h2>
                    <div className="luxury-divider mb-5" />
                    <p className="text-muted leading-relaxed mb-6">
                      {posts[0].excerpt}
                    </p>
                    <span className="text-[11px] uppercase tracking-[3px] border-b border-charcoal pb-1 self-start group-hover:border-muted group-hover:text-muted transition-colors">
                      Read More
                    </span>
                  </div>
                </Link>
              )}

              {/* Other Posts — lazy load (below fold) */}
              {posts.length > 1 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
                  {posts.slice(1).map((post) => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="group"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-light-gray mb-5">
                        <Image
                          src={post.image}
                          alt={post.title}
                          fill
                          loading="lazy"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                      <p className="text-[10px] uppercase tracking-[3px] text-muted mb-3">
                        {new Date(post.createdAt).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <h3
                        className="text-lg tracking-wide mb-2 group-hover:text-muted transition-colors duration-300"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {post.title}
                      </h3>
                      <p className="text-sm text-muted line-clamp-2">
                        {post.excerpt}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}