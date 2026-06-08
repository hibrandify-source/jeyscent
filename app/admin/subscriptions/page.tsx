// app/admin/subscriptions/page.tsx
"use client";

import { useState, useEffect } from "react";
import { formatPrice } from "@/data/products";

interface Subscription {
  id: string;
  productId: string;
  productName: string;
  size: string;
  frequency: string;
  status: string;
  price: number;
  nextDelivery: string;
  createdAt: string;
  user: { name: string; email: string };
}

interface Stats {
  total: number;
  active: number;
  cancelled: number;
  monthlyRecurring: number;
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats]                 = useState<Stats>({ total: 0, active: 0, cancelled: 0, monthlyRecurring: 0 });
  const [filter, setFilter]               = useState("all");
  const [loading, setLoading]             = useState(true);

  const fetchSubscriptions = async () => {
    try {
      const res  = await fetch(`/api/admin/subscriptions?filter=${filter}`);
      const data = await res.json();
      if (res.ok) {
        setSubscriptions(data.subscriptions);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Error fetching subscriptions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubscriptions(); }, [filter]);

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this subscription?")) return;
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id, status: "cancelled" }),
      });
      if (res.ok) fetchSubscriptions();
    } catch (err) { console.error(err); }
  };

  const handleReactivate = async (id: string) => {
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id, status: "active" }),
      });
      if (res.ok) fetchSubscriptions();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this subscription? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id }),
      });
      if (res.ok) fetchSubscriptions();
    } catch (err) { console.error(err); }
  };

  const statusColor = (status: string) =>
    status === "active"
      ? "bg-green-100 text-green-700"
      : status === "cancelled"
      ? "bg-red-100 text-red-700"
      : "bg-gray-100 text-gray-600";

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1a1a2e]">Product Subscriptions</h1>
        <p className="text-gray-500 mt-1">
          Manage bi-monthly reed diffuser subscriptions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total",      value: stats.total,                          color: "text-[#1a1a2e]" },
          { label: "Active",     value: stats.active,                         color: "text-green-600" },
          { label: "Cancelled",  value: stats.cancelled,                      color: "text-red-500"   },
          { label: "Bi-Monthly Revenue", value: formatPrice(stats.monthlyRecurring), color: "text-[#d4af37]" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border p-6">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {["all", "active", "cancelled"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === f
                ? "bg-[#1a1a2e] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading subscriptions...</div>
        ) : subscriptions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No subscriptions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {["#", "Customer", "Product", "Size", "Price/Delivery", "Next Delivery", "Status", "Subscribed On", "Actions"].map((h) => (
                    <th key={h} className="text-left px-6 py-4 text-sm font-semibold text-gray-700 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscriptions.map((sub, idx) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{sub.user.name}</p>
                      <p className="text-xs text-gray-500">{sub.user.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {sub.productName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{sub.size}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#1a1a2e]">
                      {formatPrice(sub.price)}
                      <span className="text-xs font-normal text-gray-400 ml-1">/ bi-monthly</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(sub.nextDelivery).toLocaleDateString("en-NG", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(sub.status)}`}>
                        {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(sub.createdAt).toLocaleDateString("en-NG", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {sub.status === "active" ? (
                          <button
                            onClick={() => handleCancel(sub.id)}
                            className="text-xs px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                          >
                            Cancel
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivate(sub.id)}
                            className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                          >
                            Reactivate
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(sub.id)}
                          className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}