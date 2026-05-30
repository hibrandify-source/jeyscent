"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/data/products";
import Link from "next/link";

interface OrderItem {
  id: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
}

interface Subscription {
  id: string;
  productName: string;
  size: string;
  frequency: string;
  status: string;
  price: number;
  nextDelivery: string;
}

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"orders" | "subscriptions" | "settings">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
    if (!loading && user?.role === "admin") {
      router.push("/admin");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [ordersRes, subsRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/subscriptions"),
      ]);

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data.orders || []);
      }
      if (subsRes.ok) {
        const data = await subsRes.json();
        setSubscriptions(data.subscriptions || []);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const cancelSubscription = async (subId: string) => {
    if (!confirm("Are you sure you want to cancel this subscription?")) return;
    try {
      await fetch("/api/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: subId, status: "cancelled" }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

    const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPwError("New passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPwError("New password must be at least 6 characters");
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      // FIXED: Handle non-JSON responses gracefully
      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        // Non-JSON response — server likely crashed
        const text = await res.text();
        console.error("Non-JSON response:", text);
        data = { error: "Server error. Please try again." };
      }

      if (res.ok) {
        setPwSuccess("Password changed successfully! 🤍");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setPwError(data.error || "Failed to change password");
      }
    } catch {
      setPwError("Something went wrong. Please try again.");
    } finally {
      setPwLoading(false);
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
      active: "bg-green-50 text-green-700 border-green-200",
    };
    return colors[status] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getStatusSteps = (status: string) => {
    const steps = ["pending", "confirmed", "processing", "shipped", "delivered"];
    const currentIdx = steps.indexOf(status);
    return steps.map((step, i) => ({
      name: step,
      completed: i <= currentIdx,
      active: i === currentIdx,
    }));
  };

  if (loading || !user) {
    return (
      <div className="pt-32 pb-20 text-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="page-transition pt-24 lg:pt-28">
      {/* Header */}
      <div className="bg-black text-white py-10 lg:py-14">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[5px] text-white/40 mb-2">My Account</p>
            <h1 className="text-2xl lg:text-3xl tracking-wide font-serif">
              Welcome, {user.name.split(" ")[0]} 🤍
            </h1>
          </div>
          <button
            onClick={logout}
            className="text-[11px] uppercase tracking-[3px] border border-white/20 px-6 py-2.5 hover:bg-white hover:text-black transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-10 lg:py-16">
        {/* Tabs */}
        <div className="flex gap-8 mb-10 border-b border-gray-100 overflow-x-auto">
          {(["orders", "subscriptions", "settings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-[11px] uppercase tracking-[3px] transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "text-black border-b-2 border-black"
                  : "text-muted hover:text-black"
              }`}
            >
              {tab === "orders"
                ? `Orders (${orders.length})`
                : tab === "subscriptions"
                ? `Subscriptions (${subscriptions.length})`
                : "Settings"}
            </button>
          ))}
        </div>

        {loadingData && activeTab !== "settings" ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted text-sm">Loading...</p>
          </div>
        ) : activeTab === "orders" ? (
          /* ===== ORDERS TAB ===== */
          orders.length === 0 ? (
            <div className="py-20 text-center">
              <h3 className="text-xl mb-3 font-serif">No Orders Yet</h3>
              <p className="text-muted text-sm mb-6">Your order history will appear here.</p>
              <Link href="/shop" className="inline-block bg-black text-white px-8 py-3 text-[11px] uppercase tracking-[3px]">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border border-gray-100 bg-white">
                  <button
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    className="w-full p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-[10px] uppercase tracking-[2px] text-muted mb-1">Order</p>
                        <p className="font-semibold tracking-[1px]">#{order.id.slice(-8).toUpperCase()}</p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-[10px] uppercase tracking-[2px] text-muted mb-1">Date</p>
                        <p className="text-sm">
                          {new Date(order.createdAt).toLocaleDateString("en-NG", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[2px] text-muted mb-1">Total</p>
                        <p className="text-sm font-medium">{formatPrice(order.total)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 text-[10px] uppercase tracking-[2px] border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                        className={`transition-transform duration-300 ${expandedOrder === order.id ? "rotate-180" : ""}`}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </button>

                  {expandedOrder === order.id && (
                    <div className="px-6 pb-6 border-t border-gray-100 animate-slide-down">
                      {order.status !== "cancelled" && (
                        <div className="py-8">
                          <div className="flex items-center justify-between relative">
                            <div className="absolute top-3 left-0 right-0 h-[2px] bg-gray-200" />
                            <div className="absolute top-3 left-0 h-[2px] bg-black transition-all duration-700"
                              style={{ width: `${(getStatusSteps(order.status).filter((s) => s.completed).length - 1) * 25}%` }} />
                            {getStatusSteps(order.status).map((step) => (
                              <div key={step.name} className="relative z-10 flex flex-col items-center">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                  step.completed ? "bg-black border-black" : "bg-white border-gray-300"
                                }`}>
                                  {step.completed && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                </div>
                                <span className={`mt-2 text-[9px] uppercase tracking-[2px] ${step.active ? "text-black font-semibold" : "text-muted"}`}>
                                  {step.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="space-y-3 mb-6">
                        <p className="text-[10px] uppercase tracking-[3px] text-muted">Items</p>
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm py-2 border-b border-gray-50">
                            <span>{item.name} ({item.size}) × {item.quantity}</span>
                            <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[3px] text-muted mb-2">Shipping To</p>
                        <p className="text-sm">{order.shippingAddress}, {order.shippingCity}, {order.shippingState}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : activeTab === "subscriptions" ? (
          /* ===== SUBSCRIPTIONS TAB ===== */
          subscriptions.length === 0 ? (
            <div className="py-20 text-center">
              <h3 className="text-xl mb-3 font-serif">No Subscriptions Yet</h3>
              <p className="text-muted text-sm mb-6">Subscribe for automatic quarterly deliveries.</p>
              <Link href="/subscribe" className="inline-block bg-black text-white px-8 py-3 text-[11px] uppercase tracking-[3px]">
                Start a Subscription
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="border border-gray-100 p-6 bg-white">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg mb-1 font-serif">{sub.productName}</h4>
                      <p className="text-sm text-muted">{sub.size} · {sub.frequency}</p>
                    </div>
                    <span className={`px-3 py-1 text-[10px] uppercase tracking-[2px] border ${getStatusColor(sub.status)}`}>
                      {sub.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-4 py-3 bg-cream px-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[2px] text-muted">Next Delivery</p>
                      <p className="text-sm font-medium">
                        {new Date(sub.nextDelivery).toLocaleDateString("en-NG", {
                          day: "numeric", month: "long", year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-[2px] text-muted">Price</p>
                      <p className="text-sm font-medium">{formatPrice(sub.price)}/quarter</p>
                    </div>
                  </div>
                  {sub.status === "active" && (
                    <button onClick={() => cancelSubscription(sub.id)}
                      className="text-[11px] uppercase tracking-[2px] text-red-600 hover:text-red-800 transition-colors">
                      Cancel Subscription
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          /* ===== SETTINGS TAB ===== */
          <div className="max-w-lg">
            {/* Account Info */}
            <div className="mb-10">
              <h3 className="text-lg tracking-wide mb-6 font-serif">Account Information</h3>
              <div className="space-y-4 p-6 bg-gray-50 border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-sm text-muted">Name</span>
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted">Email</span>
                  <span className="text-sm font-medium">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted">Role</span>
                  <span className="text-sm font-medium capitalize">{user.role}</span>
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div>
              <h3 className="text-lg tracking-wide mb-6 font-serif">Change Password</h3>

              {pwSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 text-sm animate-slide-down">
                  {pwSuccess}
                </div>
              )}
              {pwError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 text-sm animate-slide-down">
                  {pwError}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-5">
                <div>
                  <label className="block text-[10px] uppercase tracking-[3px] text-muted mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPw ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full border border-gray-200 px-4 py-3.5 text-sm focus:outline-none focus:border-black transition-colors pr-12"
                      placeholder="••••••••"
                      required
                    />
                    <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-black transition-colors">
                      {showCurrentPw ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[3px] text-muted mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPw ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full border border-gray-200 px-4 py-3.5 text-sm focus:outline-none focus:border-black transition-colors pr-12"
                      placeholder="Min. 6 characters"
                      required
                    />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-black transition-colors">
                      {showNewPw ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[3px] text-muted mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full border border-gray-200 px-4 py-3.5 text-sm focus:outline-none focus:border-black transition-colors"
                    placeholder="Re-enter new password"
                    required
                  />
                </div>

                <button type="submit" disabled={pwLoading}
                  className="bg-black text-white px-8 py-3.5 text-[11px] uppercase tracking-[4px] hover:bg-charcoal transition-all disabled:opacity-50">
                  {pwLoading ? "Changing..." : "Change Password"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}