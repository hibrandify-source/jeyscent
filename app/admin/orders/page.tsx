"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatPrice } from "@/data/products";

interface OrderItem {
  id: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  userId: string;
  total: number;
  status: string;
  paymentRef: string | null;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  phone: string;
  email: string;
  createdAt: string;
  user?: { name: string; email: string };
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status } : o))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = orders.filter((o) => {
    const matchesFilter = filter === "all" || o.status === filter;
    const matchesSearch =
      search === "" ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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

  const statuses = ["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
  const statusOptions = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1
            className="text-2xl lg:text-3xl tracking-wide mb-1"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Orders
          </h1>
          <p className="text-muted text-sm">
            {orders.length} total order{orders.length !== 1 ? "s" : ""} •
            Auto-refreshes
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {statuses.map((s) => {
          const count =
            s === "all"
              ? orders.length
              : orders.filter((o) => o.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`flex-shrink-0 px-4 py-2 text-[10px] uppercase tracking-[2px] border transition-all ${
                filter === s
                  ? "bg-black text-white border-black"
                  : "bg-white text-muted border-gray-200 hover:border-black hover:text-black"
              }`}
            >
              {s} ({count})
            </button>
          );
        })}
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-white border border-gray-100">
          <p className="text-muted text-sm">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-100 hover:border-gray-200 transition-colors"
            >
              <div className="p-5 lg:p-6">
                {/* Top Row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                  <div className="flex flex-wrap items-center gap-4 lg:gap-8">
                    {/* Order ID */}
                    <div>
                      <p className="text-[9px] uppercase tracking-[2px] text-muted mb-0.5">
                        Order
                      </p>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-semibold text-sm tracking-[1px] hover:text-muted transition-colors"
                      >
                        #{order.id.slice(-8).toUpperCase()}
                      </Link>
                    </div>

                    {/* Customer */}
                    <div>
                      <p className="text-[9px] uppercase tracking-[2px] text-muted mb-0.5">
                        Customer
                      </p>
                      <p className="text-sm">{order.user?.name || "—"}</p>
                    </div>

                    {/* Date */}
                    <div className="hidden sm:block">
                      <p className="text-[9px] uppercase tracking-[2px] text-muted mb-0.5">
                        Date
                      </p>
                      <p className="text-sm">
                        {new Date(order.createdAt).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Total */}
                    <div>
                      <p className="text-[9px] uppercase tracking-[2px] text-muted mb-0.5">
                        Total
                      </p>
                      <p className="text-sm font-semibold">
                        {formatPrice(order.total)}
                      </p>
                    </div>
                  </div>

                  {/* Status + Action */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 text-[9px] uppercase tracking-[2px] border ${getStatusColor(order.status)}`}
                    >
                      {order.status}
                    </span>

                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className="text-[11px] border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-black bg-white cursor-pointer"
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Items */}
                <div className="flex flex-wrap gap-2">
                  {order.items.map((item) => (
                    <span
                      key={item.id}
                      className="text-[10px] bg-gray-50 text-muted px-3 py-1.5 border border-gray-100"
                    >
                      {item.name} ({item.size}) ×{item.quantity}
                    </span>
                  ))}
                </div>

                {/* Contact & Shipping */}
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
                  <span>📧 {order.email}</span>
                  <span>📱 {order.phone}</span>
                  <span>
                    📍 {order.shippingAddress}, {order.shippingCity},{" "}
                    {order.shippingState}
                  </span>
                  {order.paymentRef && <span>💳 {order.paymentRef}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}