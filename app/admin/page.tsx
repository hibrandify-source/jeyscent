"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatPrice } from "@/data/products";

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  deliveredOrders: number;
}

interface RecentOrder {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  user?: { name: string; email: string };
  items: { name: string; size: string; quantity: number }[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
    // Poll for new orders every 30 seconds
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        fetch("/api/orders/stats"),
        fetch("/api/orders"),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setRecentOrders((data.orders || []).slice(0, 10));
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
      confirmed: "bg-blue-50 text-blue-700 border-blue-200",
      processing: "bg-purple-50 text-purple-700 border-purple-200",
      shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
      delivered: "bg-green-50 text-green-700 border-green-200",
      cancelled: "bg-red-50 text-red-700 border-red-200",
    };
    return colors[status] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted text-sm">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="mb-10">
        <h1
          className="text-2xl lg:text-3xl tracking-wide mb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Dashboard
        </h1>
        <p className="text-muted text-sm">
          Overview of your store • Auto-refreshes every 30 seconds
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-10">
        {[
          {
            label: "Total Orders",
            value: stats?.totalOrders || 0,
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            ),
            color: "bg-black text-white",
          },
          {
            label: "Total Revenue",
            value: formatPrice(stats?.totalRevenue || 0),
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            ),
            color: "bg-green-800 text-white",
          },
          {
            label: "Pending Orders",
            value: stats?.pendingOrders || 0,
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            ),
            color: "bg-yellow-600 text-white",
          },
          {
            label: "Delivered",
            value: stats?.deliveredOrders || 0,
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ),
            color: "bg-emerald-700 text-white",
          },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} p-6 lg:p-8`}>
            <div className="flex items-start justify-between mb-4">
              <div className="opacity-60">{stat.icon}</div>
            </div>
            <p className="text-2xl lg:text-3xl font-semibold mb-1">
              {stat.value}
            </p>
            <p className="text-[10px] uppercase tracking-[2px] opacity-70">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* New Order Notifications */}
      {stats && stats.pendingOrders > 0 && (
        <div className="mb-8 p-5 bg-yellow-50 border border-yellow-200 flex items-center justify-between animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-sm text-yellow-800">
              You have{" "}
              <strong>{stats.pendingOrders} pending order{stats.pendingOrders !== 1 ? "s" : ""}</strong>{" "}
              awaiting action
            </span>
          </div>
          <Link
            href="/admin/orders"
            className="text-[11px] uppercase tracking-[2px] text-yellow-800 border-b border-yellow-400 pb-0.5 hover:text-yellow-900 transition-colors"
          >
            View Orders
          </Link>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-white border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2
            className="text-lg tracking-wide"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Recent Orders
          </h2>
          <Link
            href="/admin/orders"
            className="text-[11px] uppercase tracking-[2px] text-muted hover:text-black border-b border-muted hover:border-black pb-0.5 transition-all"
          >
            View All
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-muted text-sm">No orders yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-[10px] uppercase tracking-[2px] text-muted py-3 px-6 font-normal">
                    Order
                  </th>
                  <th className="text-left text-[10px] uppercase tracking-[2px] text-muted py-3 px-6 font-normal hidden sm:table-cell">
                    Customer
                  </th>
                  <th className="text-left text-[10px] uppercase tracking-[2px] text-muted py-3 px-6 font-normal hidden md:table-cell">
                    Items
                  </th>
                  <th className="text-left text-[10px] uppercase tracking-[2px] text-muted py-3 px-6 font-normal">
                    Total
                  </th>
                  <th className="text-left text-[10px] uppercase tracking-[2px] text-muted py-3 px-6 font-normal">
                    Status
                  </th>
                  <th className="text-left text-[10px] uppercase tracking-[2px] text-muted py-3 px-6 font-normal hidden lg:table-cell">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-sm hover:text-muted transition-colors"
                      >
                        #{order.id.slice(-8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="py-4 px-6 hidden sm:table-cell">
                      <p className="text-sm">{order.user?.name || "—"}</p>
                      <p className="text-xs text-muted">{order.user?.email || ""}</p>
                    </td>
                    <td className="py-4 px-6 hidden md:table-cell">
                      <p className="text-sm text-muted">
                        {order.items
                          .map((i) => `${i.name} (${i.size})`)
                          .join(", ")
                          .slice(0, 50)}
                        {order.items.map((i) => `${i.name} (${i.size})`).join(", ").length > 50 ? "..." : ""}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-medium">
                        {formatPrice(order.total)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-2.5 py-1 text-[9px] uppercase tracking-[2px] border ${getStatusColor(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 hidden lg:table-cell">
                      <span className="text-sm text-muted">
                        {new Date(order.createdAt).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid sm:grid-cols-3 gap-4">
        <Link
          href="/admin/orders"
          className="p-6 bg-white border border-gray-100 hover:border-black transition-colors group"
        >
          <h3 className="text-sm font-medium mb-1 group-hover:text-muted transition-colors">
            Manage Orders
          </h3>
          <p className="text-xs text-muted">
            View, update status, and manage all orders
          </p>
        </Link>
        <Link
          href="/admin/blog"
          className="p-6 bg-white border border-gray-100 hover:border-black transition-colors group"
        >
          <h3 className="text-sm font-medium mb-1 group-hover:text-muted transition-colors">
            Manage Blog
          </h3>
          <p className="text-xs text-muted">
            Create, edit, and manage journal posts
          </p>
        </Link>
        <Link
          href="/shop"
          className="p-6 bg-white border border-gray-100 hover:border-black transition-colors group"
        >
          <h3 className="text-sm font-medium mb-1 group-hover:text-muted transition-colors">
            View Store
          </h3>
          <p className="text-xs text-muted">
            See your store as customers see it
          </p>
        </Link>
      </div>
    </div>
  );
}