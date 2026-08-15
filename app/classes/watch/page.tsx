"use client";

import { useState } from "react";
import Link from "next/link";

type WatchResponse =
  | {
      authorized: true;
      kind: "video" | "pdf";
      className?: string;
      episodes?: Array<{
        id: string;
        title: string;
        episodeNumber: number;
        videoUrl: string;
        videoPassword: string;
        duration: string | null;
      }>;
      pdfUrl?: string;
    }
  | {
      authorized: false;
      error?: string;
    };

// ── No Drive helpers here ─────────────────────────────────────────────────────
// Drive-hosted URLs are rewritten server-side to the /api/classes/stream/*
// proxy, so this page always renders a native <video> — the Drive iframe (and
// its pop-out escape hatch) is gone entirely.

export default function ClassWatchPage() {
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authorized, setAuthorized] = useState<WatchResponse | null>(null);
  const [activeEpisodeIdx, setActiveEpisodeIdx] = useState(0);
  const [showVideoPassword, setShowVideoPassword] = useState(false);

  const handleAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!pin.trim()) {
      setError("Please enter your access pin.");
      return;
    }
    setLoading(true);
    setAuthorized(null);
    setActiveEpisodeIdx(0);
    try {
      const res = await fetch("/api/classes/watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: pin.trim().toLowerCase(),
          email: email.trim().toLowerCase() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not authorize access.");
        setLoading(false);
        return;
      }
      setAuthorized(data as WatchResponse);
    } catch (err) {
      console.error("Watch auth error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authorized && authorized.authorized) {
    const episodes = authorized.episodes || (authorized.kind === "video" ? [] : []);

    return (
      // Right-click is suppressed on the whole authorized view (Save video as…,
      // Copy video address, Save as… etc). Native player controls (play, seek,
      // volume, fullscreen) are unaffected. The pin form below keeps its
      // context menu so pasting the pin from email keeps working.
      <div
        className="page-transition pt-24 lg:pt-28 min-h-screen select-none"
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="max-w-5xl mx-auto px-6 py-12">
          <Link
            href="/classes"
            className="text-[11px] uppercase tracking-[3px] text-muted hover:text-black border-b border-muted hover:border-black pb-0.5 transition-all inline-block mb-8"
          >
            ← Back to Classes
          </Link>

          <h1
            className="text-3xl lg:text-4xl tracking-wide mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {authorized.className || "Class"}
          </h1>
          <p className="text-muted text-sm mb-8">
            Locked to your device. Please don&rsquo;t share your pin.
          </p>

          {authorized.kind === "pdf" ? (
            <>
              <div className="bg-cream p-6 mb-6">
                <p className="text-[10px] uppercase tracking-[3px] text-muted mb-2">
                  Class Notes (PDF)
                </p>
                <p className="text-sm text-muted mb-4">
                  Your purchase includes a downloadable PDF document. Click below to open it
                  (locked to this device).
                </p>
                <a
                  href={authorized.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block bg-black text-white px-8 py-4 text-[11px] uppercase tracking-[3px] hover:bg-charcoal transition-colors"
                >
                  Open PDF
                </a>
              </div>
            </>
          ) : (
            <>
              <div className="grid lg:grid-cols-[1fr_280px] gap-6">
                {/* Player */}
                <div>
                  <div className="relative aspect-video bg-black overflow-hidden">
                    {episodes[activeEpisodeIdx] ? (
                      // All episodes are served via the native element: Drive
                      // files come through the device-locked streaming proxy,
                      // direct mp4s play straight from their URL.
                      <video
                        key={episodes[activeEpisodeIdx].id}
                        controls
                        controlsList="nodownload noplaybackrate"
                        disablePictureInPicture
                        className="w-full h-full"
                        src={episodes[activeEpisodeIdx].videoUrl}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm">
                        No module available yet.
                      </div>
                    )}
                  </div>

                  {/* Active module title + reveal-hide password */}
                  {episodes[activeEpisodeIdx] && (
                    <>
                      <div className="mt-4">
                        <p className="text-[10px] uppercase tracking-[3px] text-muted mb-1">
                          Module {episodes[activeEpisodeIdx].episodeNumber}
                        </p>
                        <h2 className="text-lg tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>
                          {episodes[activeEpisodeIdx].title}
                        </h2>
                        {episodes[activeEpisodeIdx].duration && (
                          <p className="text-xs text-muted mt-1">
                            {episodes[activeEpisodeIdx].duration}
                          </p>
                        )}
                      </div>

                      {episodes[activeEpisodeIdx].videoPassword && (
                        <div className="mt-6 bg-cream p-4">
                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div>
                              <p className="text-[10px] uppercase tracking-[3px] text-muted mb-1">
                                Video Password
                              </p>
                              <p className="font-mono text-lg tracking-[2px]">
                                {showVideoPassword ? episodes[activeEpisodeIdx].videoPassword : "••••••••"}
                              </p>
                            </div>
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => setShowVideoPassword((s) => !s)}
                                className="text-[10px] uppercase tracking-[2px] border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
                              >
                                {showVideoPassword ? "Hide" : "Reveal"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard?.writeText(episodes[activeEpisodeIdx].videoPassword || "");
                                }}
                                className="text-[10px] uppercase tracking-[2px] border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Modules list sidebar */}
                <div className="lg:border-l lg:border-gray-100 lg:pl-6 lg:order-none order-first">
                  <p className="text-[10px] uppercase tracking-[3px] text-muted mb-3">
                    Modules ({episodes.length})
                  </p>
                  <ul className="space-y-1">
                    {episodes.map((ep, idx) => (
                      <li key={ep.id}>
                        <button
                          type="button"
                          onClick={() => setActiveEpisodeIdx(idx)}
                          className={`w-full text-left px-3 py-2 transition-colors ${
                            idx === activeEpisodeIdx
                              ? "bg-black text-white"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          <span className="block text-[10px] uppercase tracking-[2px] opacity-70 mb-0.5">
                            Module {ep.episodeNumber}
                          </span>
                          <span className="block text-sm">{ep.title}</span>
                          {ep.duration && (
                            <span className={`block text-[10px] mt-0.5 ${idx === activeEpisodeIdx ? "text-white/70" : "text-muted"}`}>
                              {ep.duration}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Companion PDF — only shown on video classes that bundle a PDF */}
              {authorized.pdfUrl && (
                <div className="bg-cream p-6 mt-8">
                  <p className="text-[10px] uppercase tracking-[3px] text-muted mb-2">
                    Class Notes (PDF)
                  </p>
                  <p className="text-sm text-muted mb-4">
                    This class includes a downloadable PDF document. Click below to open it
                    (locked to this device).
                  </p>
                  <a
                    href={authorized.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block bg-black text-white px-8 py-4 text-[11px] uppercase tracking-[3px] hover:bg-charcoal transition-colors"
                  >
                    Open PDF
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition pt-24 lg:pt-28 min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-6 py-12">
        <Link
          href="/classes"
          className="text-[11px] uppercase tracking-[3px] text-muted hover:text-black border-b border-muted hover:border-black pb-0.5 transition-all inline-block mb-8"
        >
          ← Back to Classes
        </Link>

        <h1
          className="text-3xl tracking-wide mb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Watch The Class
        </h1>
        <p className="text-muted text-sm mb-8">
          Enter the access pin sent to your email. The first time you do this, your
          device will be locked to that pin.
        </p>

        <form onSubmit={handleAuthorize} className="space-y-5">
          <div>
            <label className="block text-[10px] uppercase tracking-[2px] text-muted mb-2">
              Access Pin
            </label>
            <input
              type="text"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors font-mono tracking-[2px]"
              placeholder="abc123def456"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[2px] text-muted mb-2">
              Email <span className="normal-case text-muted/70">(optional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
              placeholder="The email you paid with"
            />
            <p className="text-xs text-muted mt-1">
              Helps us match your pin if needed.
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white px-8 py-4 text-[11px] uppercase tracking-[3px] hover:bg-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Authorizing..." : "Unlock"}
          </button>
        </form>

        <p className="text-xs text-muted mt-6">
          Lost your pin? Check your email for &ldquo;Your Class Access Pin&rdquo;
          (it may be in your <strong>spam</strong> folder) or contact support.
        </p>
      </div>
    </div>
  );
}
