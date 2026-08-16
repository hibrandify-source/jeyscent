"use client";

import { useState } from "react";

// Admin panel for recovering paid-but-unrecorded orders. Enter a QorePay
// payment reference → the server verifies it (status + amount) → fill in the
// customer details and items → create the order. The server refuses to create
// an order unless the payment succeeded and its amount matches the total.

interface VerifiedInfo {
  reference: string;
  verified: boolean;
  status?: string;
  error?: string;
  amount?: number;
  amountKobo?: number;
  email?: string;
  channel?: string;
  paidAt?: string;
  existingOrder?: string | null;
}

interface ItemRow {
  productId: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
}

const EMPTY_ITEM: ItemRow = {
  productId: "",
  name: "",
  size: "",
  quantity: 1,
  price: 0,
};

export default function ReconcileOrderPanel() {
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState("");
  const [verified, setVerified] = useState<VerifiedInfo | null>(null);
  const [checking, setChecking] = useState(false);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    deliveryMethod: "delivery" as "delivery" | "pickup",
    shippingFee: "0",
  });
  const [items, setItems] = useState<ItemRow[]>([{ ...EMPTY_ITEM }]);

  const updateForm = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const updateItem = (index: number, field: keyof ItemRow, value: string | number) =>
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );

  const itemsTotal = items.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
    0
  );
  const grandTotal = itemsTotal + (Number(form.shippingFee) || 0);

  const handleVerify = async () => {
    setResult(null);
    setVerified(null);
    if (!reference.trim()) return;
    setChecking(true);
    try {
      const res = await fetch(
        `/api/admin/orders/reconcile?reference=${encodeURIComponent(reference.trim())}`
      );
      const data = await res.json();
      setVerified(data);
      if (data.verified && data.email && !form.email) {
        setForm((prev) => ({ ...prev, email: data.email }));
      }
    } catch (err) {
      console.error(err);
      setVerified({ reference, verified: false, error: "Lookup failed. Try again." });
    } finally {
      setChecking(false);
    }
  };

  const handleCreate = async () => {
    setResult(null);
    if (!verified?.verified || verified.existingOrder) return;

    const payload = {
      form: {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        area: "",
        city: form.city,
        state: form.state,
      },
      deliveryMethod: form.deliveryMethod,
      isSubscription: false,
      items,
      totalPrice: itemsTotal,
      grandTotal,
      shippingFee: Number(form.shippingFee) || 0,
      isParkPickup: false,
      deliveryEstimate: "",
      createAccount: false,
    };

    setCreating(true);
    try {
      const res = await fetch("/api/admin/orders/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: reference.trim(), payload }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({
          ok: true,
          message: `Order created: #${data.orderId.slice(-8).toUpperCase()} (${data.orderId})`,
        });
      } else {
        setResult({ ok: false, message: data.error || "Failed to create order" });
      }
    } catch (err) {
      console.error(err);
      setResult({ ok: false, message: "Something went wrong. Try again." });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 mb-8">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-[10px] uppercase tracking-[3px] font-semibold">
          Recover a Paid Order (payment received, no order recorded)
        </span>
        <span className="text-muted">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="px-5 pb-6 border-t border-gray-100 pt-5">
          {/* Step 1: verify reference */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="QorePay payment reference"
              className="flex-1 border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
            />
            <button
              onClick={handleVerify}
              disabled={checking || !reference.trim()}
              className="bg-black text-white px-6 py-2.5 text-[10px] uppercase tracking-[3px] hover:bg-charcoal transition-colors disabled:opacity-50"
            >
              {checking ? "Verifying..." : "Verify Payment"}
            </button>
          </div>

          {verified && (
            <div
              className={`mb-5 p-4 text-sm border ${
                verified.verified
                  ? "bg-green-50 border-green-100 text-green-800"
                  : "bg-red-50 border-red-100 text-red-700"
              }`}
            >
              {verified.verified ? (
                <>
                  <p className="font-medium mb-1">
                    Payment verified — ₦{(verified.amount || 0).toLocaleString()}
                    {verified.channel ? ` (${verified.channel})` : ""}
                  </p>
                  <p className="text-xs opacity-80">
                    {verified.email ? `Customer: ${verified.email} · ` : ""}
                    {verified.paidAt
                      ? `Paid: ${new Date(verified.paidAt).toLocaleString()}`
                      : ""}
                  </p>
                  {verified.existingOrder ? (
                    <p className="text-xs mt-2 font-medium">
                      Order already exists: #{verified.existingOrder.slice(-8).toUpperCase()} — nothing to do.
                    </p>
                  ) : (
                    <p className="text-xs mt-2 font-medium">
                      Order total must equal ₦{(verified.amount || 0).toLocaleString()}.
                    </p>
                  )}
                </>
              ) : (
                <p>
                  Not verified ({verified.status || "unknown"}).{" "}
                  {verified.error || "Check the reference in the QorePay dashboard."}
                </p>
              )}
            </div>
          )}

          {verified?.verified && !verified.existingOrder && (
            <>
              {/* Step 2: customer details */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  placeholder="Full name"
                  className="border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  placeholder="Email"
                  className="border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
                />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateForm("phone", e.target.value)}
                  placeholder="Phone"
                  className="border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
                />
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => updateForm("address", e.target.value)}
                  placeholder="Street address"
                  className="border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
                />
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateForm("city", e.target.value)}
                  placeholder="City"
                  className="border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
                />
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => updateForm("state", e.target.value)}
                  placeholder="State"
                  className="border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mb-5">
                <select
                  value={form.deliveryMethod}
                  onChange={(e) => updateForm("deliveryMethod", e.target.value)}
                  className="border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black bg-white cursor-pointer"
                >
                  <option value="delivery">Delivery</option>
                  <option value="pickup">Pickup / My Rider</option>
                </select>
                <input
                  type="number"
                  value={form.shippingFee}
                  onChange={(e) => updateForm("shippingFee", e.target.value)}
                  placeholder="Shipping fee (₦)"
                  className="border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
                />
              </div>

              {/* Step 3: items */}
              <p className="text-[10px] uppercase tracking-[2px] text-muted mb-2">
                Items
              </p>
              <div className="space-y-2 mb-5">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2">
                    <input
                      type="text"
                      value={item.productId}
                      onChange={(e) => updateItem(index, "productId", e.target.value)}
                      placeholder="Product ID"
                      className="col-span-3 border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors"
                    />
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(index, "name", e.target.value)}
                      placeholder="Name"
                      className="col-span-4 border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors"
                    />
                    <input
                      type="text"
                      value={item.size}
                      onChange={(e) => updateItem(index, "size", e.target.value)}
                      placeholder="Size"
                      className="col-span-2 border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors"
                    />
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                      placeholder="Qty"
                      className="col-span-1 border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors"
                    />
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => updateItem(index, "price", Number(e.target.value))}
                      placeholder="₦"
                      className="col-span-1 border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors"
                    />
                    <button
                      onClick={() =>
                        setItems((prev) => prev.filter((_, i) => i !== index))
                      }
                      disabled={items.length === 1}
                      className="col-span-1 text-muted hover:text-red-600 disabled:opacity-30 text-lg leading-none"
                      aria-label="Remove item"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setItems((prev) => [...prev, { ...EMPTY_ITEM }])}
                  className="text-[10px] uppercase tracking-[2px] border border-gray-200 px-4 py-2 hover:border-black transition-colors"
                >
                  + Add item
                </button>
              </div>

              {/* Step 4: create */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="text-sm">
                  <span className="text-muted">Order total: </span>
                  <span className="font-semibold">₦{grandTotal.toLocaleString()}</span>
                  {verified.amount !== undefined &&
                    grandTotal !== verified.amount && (
                      <span className="ml-2 text-red-600 text-xs">
                        Must equal ₦{verified.amount.toLocaleString()} (verified)
                      </span>
                    )}
                </div>
                <button
                  onClick={handleCreate}
                  disabled={
                    creating ||
                    grandTotal !== verified.amount ||
                    !form.name ||
                    !form.email ||
                    !form.phone ||
                    items.some((i) => !i.productId || !i.name || !i.quantity)
                  }
                  className="bg-black text-white px-8 py-3 text-[10px] uppercase tracking-[3px] hover:bg-charcoal transition-colors disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Order"}
                </button>
              </div>
            </>
          )}

          {result && (
            <div
              className={`mt-4 p-4 text-sm border ${
                result.ok
                  ? "bg-green-50 border-green-100 text-green-800"
                  : "bg-red-50 border-red-100 text-red-700"
              }`}
            >
              {result.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}