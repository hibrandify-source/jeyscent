"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatPrice } from "@/data/products";

interface EpisodeRow {
  id: string;
  title: string;
  episodeNumber: number;
}

interface ClassRow {
  id: string;
  title: string;
  kind: string;
  singleEpisode?: boolean;
  price: number;
  earlyBirdPrice: number;
  earlyBirdMax: number;
  earlyBirdUsed: number;
  pdfUrl: string | null;
  episodes: EpisodeRow[];
  published: boolean;
  createdAt: string;
  _count: { enrollments: number };
}

interface Stats {
  totalEnrollments: number;
  totalRevenue: number;
  earlyBirdEnrollments: number;
}

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    kind: "video" as "video" | "pdf",
    singleEpisode: false,
    pdfUrl: "",
    imageUrl: "",
    price: "40000",
    enableEarlyBird: true,
    earlyBirdPrice: "30000",
    earlyBirdMax: "10",
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/classes");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setClasses(data.classes || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error("Admin classes fetch error:", err);
      setError("Could not load classes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    setError("");
    if (!draft.title.trim()) {
      setError("Please enter a title.");
      return;
    }
    if (draft.kind === "pdf" && !draft.pdfUrl.trim()) {
      setError("Please enter the PDF URL for this PDF class.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title.trim(),
          description: draft.description.trim(),
          kind: draft.kind,
          singleEpisode: draft.kind === "video" ? draft.singleEpisode : false,
          pdfUrl: draft.pdfUrl.trim() || null,
          imageUrl: draft.imageUrl.trim() || "",
          price: Number(draft.price) || 40000,
          // When early-bird is disabled, persist earlyBirdMax = 0 — the public
          // classes page already treats `earlyBirdUsed < earlyBirdMax` as
          // "early-bird active", so max = 0 ⇒ never active ⇒ full price shown.
          earlyBirdPrice: draft.enableEarlyBird
            ? Number(draft.earlyBirdPrice) || 30000
            : 0,
          earlyBirdMax: draft.enableEarlyBird
            ? Number(draft.earlyBirdMax) || 10
            : 0,
          published: false,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create class");
      }
      setDraft({
        title: "",
        description: "",
        kind: "video",
        singleEpisode: false,
        pdfUrl: "",
        imageUrl: "",
        price: "40000",
        enableEarlyBird: true,
        earlyBirdPrice: "30000",
        earlyBirdMax: "10",
      });
      setCreateOpen(false);
      await fetchData();
    } catch (err) {
      console.error("Create class error:", err);
      setError(err instanceof Error ? err.message : "Could not create class");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (cls: ClassRow) => {
    try {
      await fetch("/api/admin/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cls.id, published: !cls.published }),
      });
      fetchData();
    } catch (err) {
      console.error("Toggle publish error:", err);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted text-sm">Loading classes...</p>
      </div>
    );
  }

  const contentState = (cls: ClassRow): { label: string; ok: boolean } => {
    if (cls.kind === "pdf") {
      return { label: cls.pdfUrl ? "PDF set" : "No PDF", ok: !!cls.pdfUrl };
    }
    const ep = cls.episodes.length;
    const mode = cls.singleEpisode ? "single" : "multi";
    const epLabel =
      ep === 0
        ? "No modules"
        : `${ep} module${ep !== 1 ? "s" : ""} (${mode})`;
    const hasPdfCompanion = !!cls.pdfUrl;
    const label = hasPdfCompanion ? `${epLabel} + PDF` : epLabel;
    return { label, ok: ep > 0 };
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
        <div>
          <h1
            className="text-2xl lg:text-3xl tracking-wide mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Classes
          </h1>
          <p className="text-muted text-sm">
            Manage your video and PDF classes, prices, and enrollments.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen((v) => !v)}
          className="bg-black text-white px-6 py-3 text-[11px] uppercase tracking-[3px] hover:bg-charcoal transition-colors"
        >
          {createOpen ? "Close" : "New Class"}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-black text-white p-6">
            <p className="text-2xl font-semibold">{stats.totalEnrollments}</p>
            <p className="text-[10px] uppercase tracking-[2px] opacity-70 mt-1">
              Total Enrollments
            </p>
          </div>
          <div className="bg-green-800 text-white p-6">
            <p className="text-2xl font-semibold">{formatPrice(stats.totalRevenue)}</p>
            <p className="text-[10px] uppercase tracking-[2px] opacity-70 mt-1">
              Class Revenue
            </p>
          </div>
          <div className="bg-yellow-600 text-white p-6">
            <p className="text-2xl font-semibold">{stats.earlyBirdEnrollments}</p>
            <p className="text-[10px] uppercase tracking-[2px] opacity-70 mt-1">
              Early Bird Sold
            </p>
          </div>
        </div>
      )}

      {/* Create form */}
      {createOpen && (
        <div className="bg-white border border-gray-100 p-6 mb-8">
          <h2
            className="text-lg tracking-wide mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Create New Class
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase tracking-[2px] text-muted mb-2">
                Title
              </label>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                className="w-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-black"
                placeholder="Mastering Reed Diffusers"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase tracking-[2px] text-muted mb-2">
                Description
              </label>
              <textarea
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                rows={3}
                className="w-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-black"
                placeholder="What students will learn..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase tracking-[2px] text-muted mb-2">
                Class Format
              </label>
              <div className="flex gap-3 flex-wrap">
                {(["video", "pdf"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, kind: k }))}
                    className={`px-4 py-2 text-[11px] uppercase tracking-[2px] border transition-colors ${
                      draft.kind === k
                        ? "bg-black text-white border-black"
                        : "border-gray-200 hover:border-black"
                    }`}
                  >
                    {k === "video" ? "Video" : "PDF"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted mt-2">
                {draft.kind === "video"
                  ? "Pre-recorded videos, organized into 1 or more modules. Choose single or multi-module below, and optionally bundle a PDF."
                  : "A single downloadable PDF document unlocked by one pin."}
              </p>
            </div>

            {/* Video: single vs multi-module */}
            {draft.kind === "video" && (
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase tracking-[2px] text-muted mb-2">
                  Module Mode
                </label>
                <div className="flex gap-3 flex-wrap">
                  {([
                    { v: false, label: "Multi-module" },
                    { v: true, label: "Single module" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() =>
                        setDraft((d) => ({ ...d, singleEpisode: opt.v }))
                      }
                      className={`px-4 py-2 text-[11px] uppercase tracking-[2px] border transition-colors ${
                        draft.singleEpisode === opt.v
                          ? "bg-black text-white border-black"
                          : "border-gray-200 hover:border-black"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted mt-2">
                  {draft.singleEpisode
                    ? "One video file, listed as one module. Students unlock it with a single pin."
                    : "A series of modules under one title. One pin unlocks every module."}
                </p>
              </div>
            )}

            {/* PDF URL: required for pdf classes, optional companion for video classes */}
            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase tracking-[2px] text-muted mb-2">
                {draft.kind === "pdf" ? (
                  "PDF URL"
                ) : (
                  <>
                    Companion PDF URL{" "}
                    <span className="normal-case text-muted/70">(optional)</span>
                  </>
                )}
              </label>
              <input
                type="text"
                value={draft.pdfUrl}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, pdfUrl: e.target.value }))
                }
                className="w-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-black font-mono"
                placeholder="https://res.cloudinary.com/.../notes.pdf"
              />
              <p className="text-xs text-muted mt-1">
                {draft.kind === "pdf"
                  ? "Direct link to the PDF (Cloudinary or any direct URL)."
                  : "Bundle a downloadable PDF alongside the video(s). Leave blank if this class has no PDF."}
              </p>
            </div>

            {/* Cover image */}
            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase tracking-[2px] text-muted mb-2">
                Cover Image URL
              </label>
              <input
                type="text"
                value={draft.imageUrl}
                onChange={(e) => setDraft((d) => ({ ...d, imageUrl: e.target.value }))}
                className="w-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-black font-mono"
                placeholder="https://res.cloudinary.com/.../cover.jpg"
              />
              <p className="text-xs text-muted mt-1">
                Shown on the public /classes page and the class detail page (Cloudinary
                image URL — same as for product covers).
              </p>
            </div>

            {/* Pricing block */}
            <div>
              <label className="block text-[10px] uppercase tracking-[2px] text-muted mb-2">
                Class Fee (₦)
              </label>
              <input
                type="number"
                value={draft.price}
                onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
                className="w-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-black"
              />
            </div>

            {/* Early Bird toggle */}
            <div className="sm:col-span-2">
              <label className="flex items-center gap-3 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.enableEarlyBird}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, enableEarlyBird: e.target.checked }))
                  }
                  className="w-4 h-4"
                />
                <span className="text-[11px] uppercase tracking-[2px]">
                  Enable Early Bird pricing
                </span>
              </label>
              {draft.enableEarlyBird && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[2px] text-muted mb-2">
                      Early Bird Price (₦)
                    </label>
                    <input
                      type="number"
                      value={draft.earlyBirdPrice}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, earlyBirdPrice: e.target.value }))
                      }
                      className="w-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[2px] text-muted mb-2">
                      Early Bird Seats
                    </label>
                    <input
                      type="number"
                      value={draft.earlyBirdMax}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, earlyBirdMax: e.target.value }))
                      }
                      className="w-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-black"
                    />
                  </div>
                </div>
              )}
              {!draft.enableEarlyBird && (
                <p className="text-xs text-muted">
                  All students pay the Class Fee. Early Bird pricing will not be
                  shown on the public page.
                </p>
              )}
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="bg-black text-white px-6 py-2 text-[11px] uppercase tracking-[2px] hover:bg-charcoal disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Class"}
            </button>
            <button
              onClick={() => setCreateOpen(false)}
              className="border border-black px-6 py-2 text-[11px] uppercase tracking-[2px] hover:bg-black hover:text-white"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-muted mt-4">
            {draft.kind === "video"
              ? draft.singleEpisode
                ? "You can add one video module (URL + optional password) after creating it from the class detail page."
                : "You can add modules (video URL + password) after creating it from the class detail page."
              : "The PDF URL is set above. You can also edit it later from the class detail page."}
          </p>
        </div>
      )}

      {/* Class list */}
      {classes.length === 0 ? (
        <div className="bg-white border border-gray-100 p-10 text-center">
          <p className="text-muted text-sm">
            No classes yet. Click <strong>New Class</strong> to create your first one.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-[10px] uppercase tracking-[2px] text-muted py-3 px-6 font-normal">
                  Class
                </th>
                <th className="text-left text-[10px] uppercase tracking-[2px] text-muted py-3 px-6 font-normal">
                  Kind
                </th>
                <th className="text-left text-[10px] uppercase tracking-[2px] text-muted py-3 px-6 font-normal">
                  Price
                </th>
                <th className="text-left text-[10px] uppercase tracking-[2px] text-muted py-3 px-6 font-normal">
                  Early Bird
                </th>
                <th className="text-left text-[10px] uppercase tracking-[2px] text-muted py-3 px-6 font-normal">
                  Content
                </th>
                <th className="text-left text-[10px] uppercase tracking-[2px] text-muted py-3 px-6 font-normal">
                  Enrollments
                </th>
                <th className="text-left text-[10px] uppercase tracking-[2px] text-muted py-3 px-6 font-normal">
                  Status
                </th>
                <th className="text-left text-[10px] uppercase tracking-[2px] text-muted py-3 px-6 font-normal" />
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => {
                const content = contentState(cls);
                return (
                  <tr
                    key={cls.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <Link
                        href={`/admin/classes/${cls.id}`}
                        className="font-medium text-sm hover:text-muted transition-colors"
                      >
                        {cls.title}
                      </Link>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-2 py-0.5 text-[9px] uppercase tracking-[2px] border ${
                          cls.kind === "pdf"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-blue-50 text-blue-800 border-blue-200"
                        }`}
                      >
                        {cls.kind}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm">{formatPrice(cls.price)}</td>
                    <td className="py-4 px-6 text-sm">
                      {formatPrice(cls.earlyBirdPrice)} ({cls.earlyBirdUsed}/{cls.earlyBirdMax})
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <span className={content.ok ? "text-green-700" : "text-red-600"}>
                        {content.label}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm">{cls._count.enrollments}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-2 py-1 text-[9px] uppercase tracking-[2px] border ${
                          cls.published
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                        }`}
                      >
                        {cls.published ? "Live" : "Draft"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => togglePublish(cls)}
                        className="text-[10px] uppercase tracking-[2px] border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors mr-2"
                      >
                        {cls.published ? "Unpublish" : "Publish"}
                      </button>
                      <Link
                        href={`/admin/classes/${cls.id}`}
                        className="text-[10px] uppercase tracking-[2px] border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
