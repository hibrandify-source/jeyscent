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
  published: boolean;
  createdAt: string;
}

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  image: "",
  author: "Jey Scent",
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [imageUploading, setImageUploading] = useState(false);

  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchPosts(); }, []);

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
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "title" && !editingPost) {
        next.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      }
      return next;
    });
  };

  const openCreate = () => {
    setEditingPost(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const openEdit = (post: BlogPost) => {
    setEditingPost(post);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      image: post.image,
      author: post.author,
    });
    setShowForm(true);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingPost(null);
    setForm(emptyForm);
    setError("");
  };

  // Cloudinary unsigned upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    setError("");

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "jeyscent_blog";

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", "jeyscent/blog");

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      handleUpdate("image", data.secure_url);
    } catch (err) {
      console.error(err);
      setError("Image upload failed. You can paste a direct URL instead.");
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess("");
    setError("");

    try {
      const isEdit = !!editingPost;
      const res = await fetch(
        isEdit ? `/api/admin/blog/${editingPost.id}` : "/api/admin/blog",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      if (res.ok) {
        setSuccess(isEdit ? "Post updated!" : "Post published!");
        setShowForm(false);
        setEditingPost(null);
        setForm(emptyForm);
        fetchPosts();
        setTimeout(() => setSuccess(""), 4000);
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (postId: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(postId);
    try {
      const res = await fetch(`/api/admin/blog/${postId}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        setSuccess("Post deleted.");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to delete post.");
      }
    } catch {
      setError("Failed to delete post.");
    } finally {
      setDeleting(null);
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
        {!showForm && (
          <button
            onClick={openCreate}
            className="bg-black text-white px-6 py-2.5 text-[11px] uppercase tracking-[2px] hover:bg-charcoal transition-all"
          >
            + New Post
          </button>
        )}
      </div>

      {/* Feedback */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 text-sm animate-slide-down">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-white border border-gray-100 p-6 lg:p-8 mb-8 animate-slide-down">
          <div className="flex items-center justify-between mb-6">
            <h3
              className="text-lg tracking-wide"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {editingPost ? `Editing: ${editingPost.title}` : "Create New Post"}
            </h3>
            <button
              onClick={cancelForm}
              className="text-muted text-sm hover:text-black transition-colors"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title + Slug */}
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

            {/* Image — upload or URL */}
            <div>
              <label className="block text-[10px] uppercase tracking-[3px] text-muted mb-2">
                Cover Image
              </label>

              {/* Preview */}
              {form.image && (
                <div className="relative w-full h-48 mb-3 overflow-hidden bg-gray-50 border border-gray-100">
                  <Image
                    src={form.image}
                    alt="Preview"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 600px"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdate("image", "")}
                    className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 text-[10px] uppercase tracking-[1px] hover:bg-black transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Upload button */}
              <div className="flex gap-3 items-center mb-2">
                <label className="cursor-pointer">
                  <span
                    className={`inline-block px-4 py-2.5 border text-[11px] uppercase tracking-[2px] transition-all ${
                      imageUploading
                        ? "border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed"
                        : "border-black hover:bg-black hover:text-white bg-white"
                    }`}
                  >
                    {imageUploading ? "Uploading..." : "Upload Image"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={imageUploading}
                    className="sr-only"
                  />
                </label>
                <span className="text-xs text-muted">or paste a URL below</span>
              </div>

              <input
                type="url"
                value={form.image}
                onChange={(e) => handleUpdate("image", e.target.value)}
                className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                placeholder="https://res.cloudinary.com/..."
              />
            </div>

            {/* Excerpt */}
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

            {/* Content */}
            <div>
              <label className="block text-[10px] uppercase tracking-[3px] text-muted mb-2">
                Content
              </label>
              <textarea
                value={form.content}
                onChange={(e) => handleUpdate("content", e.target.value)}
                className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors resize-none font-mono"
                rows={14}
                placeholder="Write your post here... Separate paragraphs with blank lines."
                required
              />
              <p className="text-[10px] text-muted mt-1">
                Separate paragraphs with empty lines. Use **text** for bold.
              </p>
            </div>

            {/* Author */}
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

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving || imageUploading}
                className="bg-black text-white px-8 py-3 text-[11px] uppercase tracking-[3px] hover:bg-charcoal transition-all disabled:opacity-50"
              >
                {saving
                  ? editingPost ? "Saving..." : "Publishing..."
                  : editingPost ? "Save Changes" : "Publish Post"}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="px-8 py-3 text-[11px] uppercase tracking-[3px] border border-gray-200 hover:border-black transition-all"
              >
                Cancel
              </button>
            </div>
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
          <p className="text-muted text-sm">No blog posts yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white border border-gray-100 p-5 flex flex-col sm:flex-row gap-5"
            >
              {/* Thumbnail */}
              <div className="relative w-full sm:w-32 h-24 overflow-hidden bg-light-gray flex-shrink-0">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3
                  className="text-base font-medium mb-1 truncate"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {post.title}
                </h3>
                <p className="text-xs text-muted line-clamp-2 mb-3">
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

              {/* Actions */}
              <div className="flex sm:flex-col gap-2 flex-shrink-0 justify-end">
                <button
                  onClick={() => openEdit(post)}
                  className="px-4 py-2 border border-black text-[11px] uppercase tracking-[2px] hover:bg-black hover:text-white transition-all"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(post.id, post.title)}
                  disabled={deleting === post.id}
                  className="px-4 py-2 border border-red-200 text-red-600 text-[11px] uppercase tracking-[2px] hover:bg-red-600 hover:text-white hover:border-red-600 transition-all disabled:opacity-40"
                >
                  {deleting === post.id ? "..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}