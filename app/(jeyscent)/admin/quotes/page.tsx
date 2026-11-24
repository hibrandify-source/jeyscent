"use client";

import { useState, useEffect, useCallback } from "react";
import { formatPrice } from "@/data/products";

interface QuoteRequest {
  id: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  occasion: string;
  quantity: number;
  budgetPerGift: number | null;
  deliveryDate: string | null;
  brandingRequired: boolean;
  message: string;
  status: string;
  createdAt: string;
}

const STATUSES = ["new", "contacted", "quoted", "won", "lost"];

const statusColor: Record<string, string> = {
  new: "bg-yellow-50 text-yellow-700 border-yellow-200",
  contacted: "bg-blue-50 text-blue-700 border-blue-200",
  quoted: "bg-purple-50 text-purple-700 border-purple-200",
  won: "bg-green-50 text-green-700 border-green-200",
  lost: "bg-gray-50 text-gray-600 border-gray-200",
};

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchQuotes = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/quotes${filter === "all" ? "" : `?status=${filter}`}`);
      if (res.ok) {
        const data = await res.json();
        setQuotes(data.quotes || []);
        setCounts(data.counts || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/quotes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchQuotes();
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl tracking-wide mb-1 font-serif">Gift Quotes</h1>
        <p className="text-muted text-sm">Corporate and bulk enquiries from gift.jeyscent.com</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {["all", ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`flex-shrink-0 px-4 py-2 text-[10px] uppercase tracking-[2px] border transition-all ${
              filter === s
                ? "bg-black text-white border-black"
                : "bg-white text-muted border-gray-200 hover:border-black hover:text-black"
            }`}
          >
            {s} ({counts[s] ?? 0})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : quotes.length === 0 ? (
        <div className="py-20 text-center bg-white border border-gray-100">
          <p className="text-muted text-sm">No quote requests yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => (
            <div key={q.id} className="bg-white border border-gray-100 p-5 lg:p-6">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                <div>
                  <p className="font-semibold">{q.company}</p>
                  <p className="text-sm text-muted">
                    {q.contactName} ·{" "}
                    <a href={`mailto:${q.email}`} className="underline underline-offset-2 hover:text-black">{q.email}</a> ·{" "}
                    <a href={`tel:${q.phone}`} className="hover:text-black">{q.phone}</a>
                  </p>
                  <p className="text-[10px] uppercase tracking-[2px] text-muted mt-1">
                    #{q.id.slice(-8).toUpperCase()} · {new Date(q.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <select
                  value={q.status}
                  onChange={(e) => updateStatus(q.id, e.target.value)}
                  className={`text-[10px] uppercase tracking-[2px] border px-3 py-2 ${statusColor[q.status] ?? ""}`}
                  aria-label={`Status for ${q.company}`}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <dl className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                <div>
                  <dt className="text-[9px] uppercase tracking-[2px] text-muted">Occasion</dt>
                  <dd>{q.occasion}</dd>
                </div>
                <div>
                  <dt className="text-[9px] uppercase tracking-[2px] text-muted">Gifts</dt>
                  <dd>{q.quantity.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-[9px] uppercase tracking-[2px] text-muted">Budget / gift</dt>
                  <dd>{q.budgetPerGift ? formatPrice(q.budgetPerGift) : "—"}</dd>
                </div>
                <div>
                  <dt className="text-[9px] uppercase tracking-[2px] text-muted">Needed by</dt>
                  <dd>{q.deliveryDate || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[9px] uppercase tracking-[2px] text-muted">Branding</dt>
                  <dd>{q.brandingRequired ? "Yes" : "No"}</dd>
                </div>
              </dl>
              {q.message && (
                <p className="text-sm text-muted mt-4 pt-4 border-t border-gray-50 whitespace-pre-line">{q.message}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
