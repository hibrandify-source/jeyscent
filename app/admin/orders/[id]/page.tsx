"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/data/products";

interface OrderItem {
  id: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
  productId: string;
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
  updatedAt: string;
  user?: { name: string; email: string };
  items: OrderItem[];
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setOrder(data.order || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const updateStatus = async (status: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok && order) {
        setOrder({ ...order, status });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
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
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 text-center">
        <h2
          className="text-2xl mb-4"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Order Not Found
        </h2>
        <Link
          href="/admin/orders"
          className="text-[11px] uppercase tracking-[3px] border-b border-black pb-1"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  const statusFlow = ["pending", "confirmed", "processing", "shipped", "delivered"];

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[2px] text-muted mb-6">
        <Link href="/admin" className="hover:text-black transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/admin/orders" className="hover:text-black transition-colors">
          Orders
        </Link>
        <span>/</span>
        <span className="text-black">
          #{order.id.slice(-8).toUpperCase()}
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1
            className="text-2xl tracking-wide mb-1"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Order #{order.id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-muted text-sm">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-NG", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
        <span
          className={`px-4 py-2 text-[10px] uppercase tracking-[2px] border ${getStatusColor(order.status)}`}
        >
          {order.status}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white border border-gray-100 p-6">
            <h3
              className="text-lg tracking-wide mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Items
            </h3>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted">
                      Size: {item.size} • Qty: {item.quantity} •{" "}
                      {formatPrice(item.price)} each
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-semibold">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>

          {/* Status Update */}
          <div className="bg-white border border-gray-100 p-6">
            <h3
              className="text-lg tracking-wide mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Update Status
            </h3>
            <div className="flex flex-wrap gap-2">
              {statusFlow.map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  disabled={updating || order.status === s}
                  className={`px-4 py-2.5 text-[10px] uppercase tracking-[2px] border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    order.status === s
                      ? "bg-black text-white border-black"
                      : "border-gray-200 hover:border-black hover:bg-black hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
              <button
                onClick={() => updateStatus("cancelled")}
                disabled={updating || order.status === "cancelled"}
                className="px-4 py-2.5 text-[10px] uppercase tracking-[2px] border border-red-200 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Right — Customer & Shipping */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="bg-white border border-gray-100 p-6">
            <h3
              className="text-lg tracking-wide mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Customer
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[9px] uppercase tracking-[2px] text-muted mb-0.5">
                  Name
                </p>
                <p>{order.user?.name || "—"}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[2px] text-muted mb-0.5">
                  Email
                </p>
                <p>{order.email}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[2px] text-muted mb-0.5">
                  Phone
                </p>
                <p>{order.phone}</p>
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className="bg-white border border-gray-100 p-6">
            <h3
              className="text-lg tracking-wide mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Shipping
            </h3>
            <div className="text-sm space-y-1">
              <p>{order.shippingAddress}</p>
              <p>
                {order.shippingCity}, {order.shippingState}
              </p>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white border border-gray-100 p-6">
            <h3
              className="text-lg tracking-wide mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Payment
            </h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted">Reference</span>
                <span className="font-mono text-xs">
                  {order.paymentRef || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Amount</span>
                <span className="font-semibold">
                  {formatPrice(order.total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Method</span>
                <span>Paystack</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}