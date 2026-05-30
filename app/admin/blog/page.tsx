"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  published: number;
  createdAt: string;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    image: "",
    author: "Jey Scent",
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/admin/blog");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "title") {
      setForm((prev) => ({
        ...prev,
        slug: value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess("");

    try {
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setSuccess("Blog post created successfully!");
        setForm({
          title: "",
          slug: "",
          excerpt: "",
          content: "",
          image: "",
          author: "Jey Scent",
        });
        setShowForm(false);
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl lg:text-3xl tracking-wide mb-1"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Blog Posts
          </h1>
          <p className="text-muted text-sm">
            {posts.length} post{posts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`px-6 py-2.5 text-[11px] uppercase tracking-[2px] transition-all ${
            showForm
              ? "bg-gray-200 text-black"
              : "bg-black text-white hover:bg-charcoal"
          }`}
        >
          {showForm ? "Cancel" : "+ New Post"}
        </button>
      </div>

      {/* Success */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 text-sm animate-slide-down">
          {success}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-white border border-gray-100 p-6 lg:p-8 mb-8 animate-slide-down">
          <h3
            className="text-lg tracking-wide mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Create New Post
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid lg:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] uppercase tracking-[3px] text-muted mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleUpdate("title", e.target.value)}
                  className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                  placeholder="Post title"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[3px] text-muted mb-2">
                  Slug
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => handleUpdate("slug", e.target.value)}
                  className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-gray-50"
                  placeholder="auto-generated-slug"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[3px] text-muted mb-2">
                Image URL
              </label>
              <input
                type="url"
                value={form.image}
                onChange={(e) => handleUpdate("image", e.target.value)}
                className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                placeholder="https://res.cloudinary.com/..."
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[3px] text-muted mb-2">
                Excerpt
              </label>
              <textarea
                value={form.excerpt}
                onChange={(e) => handleUpdate("excerpt", e.target.value)}
                className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                rows={2}
                placeholder="Brief summary of the post..."
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[3px] text-muted mb-2">
                Content
              </label>
              <textarea
                value={form.content}
                onChange={(e) => handleUpdate("content", e.target.value)}
                className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors resize-none font-mono"
                rows={12}
                placeholder="Write your post here... Use **bold** for emphasis. Separate paragraphs with blank lines."
                required
              />
              <p className="text-[10px] text-muted mt-1">
                Use **text** for bold. Separate paragraphs with empty lines.
              </p>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[3px] text-muted mb-2">
                Author
              </label>
              <input
                type="text"
                value={form.author}
                onChange={(e) => handleUpdate("author", e.target.value)}
                className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-black text-white px-8 py-3 text-[11px] uppercase tracking-[3px] hover:bg-charcoal transition-all disabled:opacity-50"
            >
              {saving ? "Publishing..." : "Publish Post"}
            </button>
          </form>
        </div>
      )}

      {/* Posts List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center bg-white border border-gray-100">
          <p className="text-muted text-sm">
            No blog posts yet. Create your first one!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white border border-gray-100 p-5 flex flex-col sm:flex-row gap-5"
            >
              <div className="relative w-full sm:w-32 h-24 overflow-hidden bg-light-gray flex-shrink-0">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3
                      className="text-base font-medium mb-1 truncate"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {post.title}
                    </h3>
                    <p className="text-xs text-muted line-clamp-2 mb-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-muted uppercase tracking-[2px]">
                      <span>{post.author}</span>
                      <span>·</span>
                      <span>
                        {new Date(post.createdAt).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span>·</span>
                      <span className={post.published ? "text-green-600" : "text-yellow-600"}>
                        {post.published ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}