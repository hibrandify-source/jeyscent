"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/data/products";

interface DeviceBinding {
  id: string;
  ipAddress: string;
  userAgent: string;
  registeredAt: string;
}

interface Enrollment {
  id: string;
  name: string;
  email: string;
  phone: string;
  accessPin: string;
  amountPaid: number;
  isEarlyBird: boolean;
  paymentRef: string | null;
  status: string;
  createdAt: string;
  device: DeviceBinding | null;
}

interface PendingEnrollment {
  id: string;
  reference: string;
  name: string;
  email: string;
  amount: number;
  createdAt: string;
}

interface Episode {
  id: string;
  title: string;
  episodeNumber: number;
  videoUrl: string;
  videoPassword: string;
  duration: string | null;
}

interface ClassDetail {
  id: string;
  title: string;
  description: string;
  kind: string;
  singleEpisode: boolean;
  price: number;
  earlyBirdPrice: number;
  earlyBirdMax: number;
  earlyBirdUsed: number;
  pdfUrl: string | null;
  imageUrl: string;
  published: boolean;
  episodes: Episode[];
  enrollments: Enrollment[];
  pendingEnrollments: PendingEnrollment[];
}

type EpisodeDraft = {
  title: string;
  videoUrl: string;
  videoPassword: string;
  duration: string;
};

export default function AdminClassDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [cls, setCls] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    kind: "video" as "video" | "pdf",
    singleEpisode: false,
    price: "40000",
    enableEarlyBird: true,
    earlyBirdPrice: "30000",
    earlyBirdMax: "10",
    pdfUrl: "",
    imageUrl: "",
    published: false,
  });

  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [newEp, setNewEp] = useState<EpisodeDraft>({
    title: "",
    videoUrl: "",
    videoPassword: "",
    duration: "",
  });
  const [episodeOps, setEpisodeOps] = useState<Record<string, boolean>>({});
  const [editingEp, setEditingEp] = useState<Record<string, EpisodeDraft>>({});

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/admin/classes/${id}`);
      if (!res.ok) throw new Error("Failed to load class");
      const data = await res.json();
      const c = data.class as ClassDetail;
      setCls(c);
      setEpisodes(c.episodes || []);
      setForm({
        title: c.title,
        description: c.description,
        kind: (c.kind as "video" | "pdf") || "video",
        singleEpisode: !!c.singleEpisode,
        price: String(c.price),
        enableEarlyBird: c.earlyBirdMax > 0,
        earlyBirdPrice: String(c.earlyBirdPrice),
        earlyBirdMax: String(c.earlyBirdMax),
        pdfUrl: c.pdfUrl || "",
        imageUrl: c.imageUrl || "",
        published: c.published,
      });
    } catch (err) {
      console.error("Fetch class detail error:", err);
      setError("Could not load class.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async () => {
    setError("");
    setSavedMsg("");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/classes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          kind: form.kind,
          singleEpisode: form.kind === "video" ? form.singleEpisode : false,
          price: Number(form.price),
          earlyBirdPrice: form.enableEarlyBird ? Number(form.earlyBirdPrice) : 0,
          earlyBirdMax: form.enableEarlyBird ? Number(form.earlyBirdMax) : 0,
          pdfUrl: form.pdfUrl,
          imageUrl: form.imageUrl,
          published: form.published,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      setSavedMsg("Saved.");
      setTimeout(() => setSavedMsg(""), 2000);
      fetchData();
    } catch (err) {
      console.error("Save class error:", err);
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddEpisode = async () => {
    setError("");
    if (!newEp.title.trim()) {
      setError("Module title is required.");
      return;
    }
    setEpisodeOps((s) => ({ ...s, new: true }));
    try {
      const res = await fetch(`/api/admin/classes/${id}/episodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEp.title.trim(),
          videoUrl: newEp.videoUrl.trim(),
          videoPassword: newEp.videoPassword.trim(),
          duration: newEp.duration.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add module");
      }
      setNewEp({ title: "", videoUrl: "", videoPassword: "", duration: "" });
      await fetchData();
    } catch (err) {
      console.error("Add module error:", err);
      setError(err instanceof Error ? err.message : "Could not add module.");
    } finally {
      setEpisodeOps((s) => ({ ...s, new: false }));
    }
  };

  const handleSaveEpisode = async (epId: string) => {
    const draft = editingEp[epId];
    if (!draft) return;
    setEpisodeOps((s) => ({ ...s, [epId]: true }));
    try {
      const res = await fetch(
        `/api/admin/classes/${id}/episodes/${epId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: draft.title,
            videoUrl: draft.videoUrl,
            videoPassword: draft.videoPassword,
            duration: draft.duration || null,
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update module");
      }
      setEditingEp((s) => {
        const next = { ...s };
        delete next[epId];
        return next;
      });
      await fetchData();
    } catch (err) {
      console.error("Update module error:", err);
      setError(err instanceof Error ? err.message : "Could not update module.");
    } finally {
      setEpisodeOps((s) => ({ ...s, [epId]: false }));
    }
  };

  const handleDeleteEpisode = async (epId: string) => {
    if (!confirm("Delete this module? This cannot be undone.")) return;
    setEpisodeOps((s) => ({ ...s, [epId]: true }));
    try {
      const res = await fetch(`/api/admin/classes/${id}/episodes/${epId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete module");
      await fetchData();
    } catch (err) {
      console.error("Delete module error:", err);
      setError("Could not delete module.");
    } finally {
      setEpisodeOps((s) => ({ ...s, [epId]: false }));
    }
  };

  const startEditEpisode = (ep: Episode) => {
    setEditingEp((s) => ({
      ...s,
      [ep.id]: {
        title: ep.title,
        videoUrl: ep.videoUrl,
        videoPassword: ep.videoPassword,
        duration: ep.duration || "",
      },
    }));
  };

  const cancelEditEpisode = (epId: string) => {
    setEditingEp((s) => {
      const next = { ...s };
      delete next[epId];
      return next;
    });
  };

  const handleResetBinding = async (enrollmentId: string) => {
    if (!confirm("Reset this student's device binding? They'll be able to register a new IP.")) return;
    try {
      await fetch(`/api/admin/classes/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId }),
      });
      fetchData();
    } catch (err) {
      console.error("Reset binding error:", err);
      setError("Could not reset device binding.");
    }
  };

  const handleRotatePin = async (enrollmentId: string) => {
    if (!confirm("Rotate this student's access pin? The current pin will stop working immediately, and their device binding will be reset so they can register a new device.")) return;
    try {
      const res = await fetch(`/api/admin/classes/${id}/rotate-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to rotate pin");
      alert(`New access pin: ${data.pin}\n\nDevice binding reset. The previous pin is now invalid. Share the new pin with the student.`);
      fetchData();
    } catch (err) {
      console.error("Rotate pin error:", err);
      setError(err instanceof Error ? err.message : "Could not rotate access pin.");
    }
  };

  const handleDeleteClass = async () => {
    if (!confirm("Delete this class and all its enrollments? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/classes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/admin/classes");
    } catch (err) {
      console.error("Delete class error:", err);
      setError("Could not delete class.");
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted text-sm">Loading class...</p>
      </div>
    );
  }

  if (!cls) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted text-sm mb-4">Class not found.</p>
        <Link href="/admin/classes" className="text-[11px] uppercase tracking-[2px] border-b border-black pb-0.5">
          Back to Classes
        </Link>
      </div>
    );
  }

  const isVideo = form.kind === "video";

  return (
    <div className="animate-fade-in">
      <Link
        href="/admin/classes"
        className="text-[11px] uppercase tracking-[3px] text-muted hover:text-black border-b border-muted hover:border-black pb-0.5 transition-all inline-block mb-6"
      >
        ← Back to Classes
      </Link>

      <h1
        className="text-2xl lg:text-3xl tracking-wide mb-2"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {cls.title}
      </h1>
      <p className="text-muted text-sm mb-8">
        <span
          className={`inline-block px-2 py-0.5 text-[9px] uppercase tracking-[2px] border mr-2 ${
            cls.kind === "pdf"
              ? "bg-amber-50 text-amber-800 border-amber-200"
              : "bg-blue-50 text-blue-800 border-blue-200"
          }`}
        >
          {cls.kind}
          {cls.kind === "video" && (cls.singleEpisode ? " • 1 module" : ` • ${cls.episodes.length || 0} modules`)}
        </span>
        {cls.enrollments.length} enrollment{cls.enrollments.length !== 1 ? "s" : ""} •{" "}
        {cls.earlyBirdUsed}/{cls.earlyBirdMax} early-bird slots used
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Edit form */}
      <div className="bg-white border border-gray-100 p-6 mb-8">
        <h2
          className="text-lg tracking-wide mb-4"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Class Settings
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-[10px] uppercase tracking-[2px] text-muted mb-2">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-black"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10px] uppercase tracking-[2px] text-muted mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4}
              className="w-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-black"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[2px] text-muted mb-2">Class Fee (₦)</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className="w-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-black"
            />
          </div>

          {/* Early Bird toggle */}
          <div className="sm:col-span-2">
            <label className="flex items-center gap-3 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.enableEarlyBird}
                onChange={(e) =>
                  setForm((f) => ({ ...f, enableEarlyBird: e.target.checked }))
                }
                className="w-4 h-4"
              />
              <span className="text-[11px] uppercase tracking-[2px]">
                Enable Early Bird pricing
              </span>
            </label>
            {form.enableEarlyBird && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[2px] text-muted mb-2">Early Bird Price (₦)</label>
                  <input
                    type="number"
                    value={form.earlyBirdPrice}
                    onChange={(e) => setForm((f) => ({ ...f, earlyBirdPrice: e.target.value }))}
                    className="w-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[2px] text-muted mb-2">Early Bird Seats</label>
                  <input
                    type="number"
                    value={form.earlyBirdMax}
                    onChange={(e) => setForm((f) => ({ ...f, earlyBirdMax: e.target.value }))}
                    className="w-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-black"
                  />
                </div>
              </div>
            )}
            {!form.enableEarlyBird && (
              <p className="text-xs text-muted">
                All students pay the Class Fee. Early Bird pricing will not be shown on the public page.
              </p>
            )}
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[2px] text-muted mb-2">Image URL</label>
            <input
              type="text"
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              className="w-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-black"
              placeholder="https://res.cloudinary.com/..."
            />
          </div>

          {/* Kind-specific content field */}
          <div className="sm:col-span-2">
            <label className="block text-[10px] uppercase tracking-[2px] text-muted mb-2">
              Class Format
            </label>
            <div className="flex gap-3 flex-wrap">
              {(["video", "pdf"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, kind: k }))}
                  className={`px-4 py-2 text-[11px] uppercase tracking-[2px] border transition-colors ${
                    form.kind === k
                      ? "bg-black text-white border-black"
                      : "border-gray-200 hover:border-black"
                  }`}
                >
                  {k === "video" ? "Video" : "PDF"}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted mt-2">
              {form.kind === "video"
                ? "Pre-recorded videos, organized into 1 or more modules. Choose single or multi-module below, and optionally bundle a PDF."
                : "A single downloadable PDF document unlocked by one pin."}
            </p>
          </div>

          {/* Video: single vs multi-module */}
          {form.kind === "video" && (
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
                      setForm((f) => ({ ...f, singleEpisode: opt.v }))
                    }
                    className={`px-4 py-2 text-[11px] uppercase tracking-[2px] border transition-colors ${
                      form.singleEpisode === opt.v
                        ? "bg-black text-white border-black"
                        : "border-gray-200 hover:border-black"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted mt-2">
                {form.singleEpisode
                  ? "One video file, listed as one module. The Add Module form below will allow only one module. If modules already exist, reduce to one before enabling this."
                  : "A series of modules under one title. One pin unlocks every module."}
              </p>
            </div>
          )}

          {/* PDF URL: required for pdf classes, optional companion for video classes */}
          <div className="sm:col-span-2">
            <label className="block text-[10px] uppercase tracking-[2px] text-muted mb-2">
              {form.kind === "pdf" ? (
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
              value={form.pdfUrl}
              onChange={(e) => setForm((f) => ({ ...f, pdfUrl: e.target.value }))}
              className="w-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-black font-mono"
              placeholder="https://res.cloudinary.com/.../class-notes.pdf"
            />
            <p className="text-xs text-muted mt-1">
              {form.kind === "pdf"
                ? "Direct link to the PDF (Cloudinary or any direct URL). Required for a PDF class."
                : "Bundle a downloadable PDF alongside the video(s). Leave blank if this class has no PDF."}
            </p>
          </div>

          <div className="sm:col-span-2 flex items-center gap-3">
            <input
              id="published"
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
              className="w-4 h-4"
            />
            <label htmlFor="published" className="text-sm">
              Published (visible on /classes)
            </label>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 flex-wrap">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-black text-white px-6 py-2 text-[11px] uppercase tracking-[2px] hover:bg-charcoal disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {savedMsg && <span className="text-xs text-green-700">{savedMsg}</span>}
          <button
            onClick={handleDeleteClass}
            className="ml-auto border border-red-500 text-red-500 px-6 py-2 text-[11px] uppercase tracking-[2px] hover:bg-red-500 hover:text-white"
          >
            Delete Class
          </button>
        </div>
      </div>

      {/* Modules management — only for video classes */}
      {isVideo && (
        <div className="bg-white border border-gray-100 p-6 mb-8">
          <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
            <h2
              className="text-lg tracking-wide"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Modules ({episodes.length})
            </h2>
            <p className="text-xs text-muted">
              {form.singleEpisode
                ? "Single-module mode — only one module is allowed."
                : "One pin unlocks all modules of this class."}
            </p>
          </div>

          {episodes.length > 0 && (
            <ul className="divide-y divide-gray-50 mb-6">
              {episodes.map((ep) => {
                const draft = editingEp[ep.id];
                const isEditing = !!draft;
                const isBusy = !!episodeOps[ep.id];
                return (
                  <li key={ep.id} className="py-4">
                    {isEditing ? (
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] uppercase tracking-[2px] text-muted mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            value={draft.title}
                            onChange={(e) =>
                              setEditingEp((s) => ({
                                ...s,
                                [ep.id]: { ...draft, title: e.target.value },
                              }))
                            }
                            className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] uppercase tracking-[2px] text-muted mb-1">
                            Video URL
                          </label>
                          <input
                            type="text"
                            value={draft.videoUrl}
                            onChange={(e) =>
                              setEditingEp((s) => ({
                                ...s,
                                [ep.id]: { ...draft, videoUrl: e.target.value },
                              }))
                            }
                            className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-[2px] text-muted mb-1">
                            Video Password
                          </label>
                          <input
                            type="text"
                            value={draft.videoPassword}
                            onChange={(e) =>
                              setEditingEp((s) => ({
                                ...s,
                                [ep.id]: { ...draft, videoPassword: e.target.value },
                              }))
                            }
                            className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black font-mono"
                            placeholder="(optional)"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-[2px] text-muted mb-1">
                            Duration
                          </label>
                          <input
                            type="text"
                            value={draft.duration}
                            onChange={(e) =>
                              setEditingEp((s) => ({
                                ...s,
                                [ep.id]: { ...draft, duration: e.target.value },
                              }))
                            }
                            className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
                            placeholder="e.g. 12:30"
                          />
                        </div>
                        <div className="sm:col-span-2 flex gap-2">
                          <button
                            onClick={() => handleSaveEpisode(ep.id)}
                            disabled={isBusy}
                            className="bg-black text-white px-4 py-2 text-[10px] uppercase tracking-[2px] hover:bg-charcoal disabled:opacity-50"
                          >
                            {isBusy ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={() => cancelEditEpisode(ep.id)}
                            disabled={isBusy}
                            className="border border-black px-4 py-2 text-[10px] uppercase tracking-[2px] hover:bg-black hover:text-white disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-[2px] text-muted mb-0.5">
                            Module {ep.episodeNumber}
                          </p>
                          <p className="text-sm font-medium truncate">{ep.title}</p>
                          <div className="flex gap-3 text-xs text-muted mt-1 flex-wrap">
                            {ep.duration && <span>Duration: {ep.duration}</span>}
                            <span className={ep.videoUrl ? "text-green-700" : "text-red-600"}>
                              {ep.videoUrl ? "Video set" : "No video URL"}
                            </span>
                            {ep.videoPassword && <span>• Password set</span>}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => startEditEpisode(ep)}
                            disabled={isBusy}
                            className="text-[10px] uppercase tracking-[2px] border border-black px-3 py-1.5 hover:bg-black hover:text-white transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEpisode(ep.id)}
                            disabled={isBusy}
                            className="text-[10px] uppercase tracking-[2px] border border-red-500 text-red-500 px-3 py-1.5 hover:bg-red-500 hover:text-white transition-colors"
                          >
                            {isBusy ? "..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/* Add new module — gated when singleEpisode is true and 1 already exists */}
          {form.singleEpisode && episodes.length >= 1 ? (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-muted">
                This class is set to <strong>single-module</strong> mode, so it
                already has its one module. To replace it, edit or delete the
                existing one above. To allow multiple modules, switch module
                mode in Class Settings.
              </p>
            </div>
          ) : (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-[10px] uppercase tracking-[2px] text-muted mb-3">Add Module</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={newEp.title}
                    onChange={(e) => setNewEp((s) => ({ ...s, title: e.target.value }))}
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
                    placeholder="Module title"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={newEp.videoUrl}
                    onChange={(e) => setNewEp((s) => ({ ...s, videoUrl: e.target.value }))}
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black font-mono"
                    placeholder="Google Drive url (set sharing to 'Anyone with the link')"
                  />
                </div>
                <input
                  type="text"
                  value={newEp.videoPassword}
                  onChange={(e) => setNewEp((s) => ({ ...s, videoPassword: e.target.value }))}
                  className="border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black font-mono"
                  placeholder="Video password (optional)"
                />
                <input
                  type="text"
                  value={newEp.duration}
                  onChange={(e) => setNewEp((s) => ({ ...s, duration: e.target.value }))}
                  className="border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
                  placeholder="Duration (e.g. 12:30)"
                />
              </div>
              <button
                onClick={handleAddEpisode}
                disabled={episodeOps.new}
                className="mt-4 bg-black text-white px-4 py-2 text-[11px] uppercase tracking-[2px] hover:bg-charcoal disabled:opacity-50"
              >
                {episodeOps.new ? "Adding..." : "Add Module"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Enrollments */}
      <div className="bg-white border border-gray-100 mb-8">
        <div className="p-6 border-b border-gray-100">
          <h2
            className="text-lg tracking-wide"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Enrollments ({cls.enrollments.length})
          </h2>
        </div>

        {cls.enrollments.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-muted text-sm">No enrollments yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-[10px] uppercase tracking-[2px] text-muted py-3 px-6 font-normal">Name</th>
                  <th className="text-left text-[10px] uppercase tracking-[2px] text-muted py-3 px-6 font-normal hidden sm:table-cell">Email</th>
                  <th className="text-left text-[10px] uppercase tracking-[2px] text-muted py-3 px-6 font-normal">Pin</th>
                  <th className="text-left text-[10px] uppercase tracking-[2px] text-muted py-3 px-6 font-normal hidden md:table-cell">Paid</th>
                  <th className="text-left text-[10px] uppercase tracking-[2px] text-muted py-3 px-6 font-normal hidden md:table-cell">Device IP</th>
                  <th className="text-left text-[10px] uppercase tracking-[2px] text-muted py-3 px-6 font-normal">Date</th>
                  <th className="text-left text-[10px] uppercase tracking-[2px] text-muted py-3 px-6 font-normal" />
                </tr>
              </thead>
              <tbody>
                {cls.enrollments.map((enr) => (
                  <tr key={enr.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 text-sm">
                      {enr.name}
                      {enr.isEarlyBird && (
                        <span className="block text-[9px] uppercase tracking-[2px] text-yellow-700 mt-0.5">Early Bird</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-xs text-muted hidden sm:table-cell">{enr.email}</td>
                    <td className="py-4 px-6 text-xs font-mono tracking-[1px]">{enr.accessPin}</td>
                    <td className="py-4 px-6 text-sm hidden md:table-cell">{formatPrice(enr.amountPaid)}</td>
                    <td className="py-4 px-6 text-xs hidden md:table-cell">
                      {enr.device ? (
                        <div>
                          <code className="font-mono">{enr.device.ipAddress}</code>
                          <p className="text-[10px] text-muted mt-0.5">
                            {new Date(enr.device.registeredAt).toLocaleString("en-NG", { dateStyle: "short", timeStyle: "short" })}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted">— Not yet used</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-xs text-muted">
                      {new Date(enr.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleRotatePin(enr.id)}
                          className="text-[10px] uppercase tracking-[2px] border border-amber-600 text-amber-700 px-3 py-1.5 hover:bg-amber-600 hover:text-white transition-colors"
                          title="Generate a new access pin and reset device binding. The old pin stops working immediately."
                        >
                          Rotate Pin
                        </button>
                        {enr.device && (
                          <button
                            onClick={() => handleResetBinding(enr.id)}
                            className="text-[10px] uppercase tracking-[2px] border border-black px-3 py-1.5 hover:bg-black hover:text-white transition-colors"
                            title="Reset IP binding so the student can use a new device"
                          >
                            Reset IP
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending enrollments (unconfirmed) */}
      {cls.pendingEnrollments.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-100 p-6 mb-8">
          <h2 className="text-sm uppercase tracking-[2px] mb-4 text-yellow-800">
            Pending Payments ({cls.pendingEnrollments.length})
          </h2>
          <ul className="text-sm space-y-2">
            {cls.pendingEnrollments.map((p) => (
              <li key={p.id} className="text-yellow-800">
                <strong>{p.name}</strong> ({p.email}) — {formatPrice(p.amount)} —{" "}
                <code className="font-mono text-xs">{p.reference}</code>
              </li>
            ))}
          </ul>
          <p className="text-xs text-yellow-700 mt-3">
            These enrollments will be confirmed automatically when their payment succeeds and they land on /classes/success.
          </p>
        </div>
      )}
    </div>
  );
}
