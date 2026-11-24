"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGiftCart } from "@/context/GiftCartContext";
import {
  hamperBoxes,
  builderItems,
  BUILDER_CATEGORY_LABELS,
  getHamperBox,
  getBuilderItem,
} from "@/data/gifting";
import { formatPrice } from "@/data/products";
import type { BuilderItem } from "@/lib/types";
import PersonaliseFields, { emptyPersonalisation } from "./PersonaliseFields";

const STEPS = ["Choose a box", "Fill your hamper", "Personalise"] as const;
const CATEGORIES = Object.keys(BUILDER_CATEGORY_LABELS) as BuilderItem["category"][];

export default function HamperBuilder() {
  const { addItem } = useGiftCart();
  const [step, setStep] = useState(0);
  const [boxId, setBoxId] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [personalisation, setPersonalisation] = useState(emptyPersonalisation);
  const [added, setAdded] = useState(false);

  const box = boxId ? getHamperBox(boxId) : undefined;
  const itemCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const isFull = !!box && itemCount >= box.capacity;

  // Repeated ids mean "two of the same item" — matches priceCustomHamper().
  const itemIds = useMemo(
    () => Object.entries(counts).flatMap(([id, n]) => Array<string>(n).fill(id)),
    [counts]
  );
  const rawTotal =
    (box?.basePrice ?? 0) +
    itemIds.reduce((sum, id) => sum + (getBuilderItem(id)?.price ?? 0), 0);

  const chooseBox = (id: string) => {
    const next = getHamperBox(id);
    setBoxId(id);
    // Trim the selection if the new box is smaller.
    if (next && itemCount > next.capacity) {
      const trimmed: Record<string, number> = {};
      let left = next.capacity;
      for (const [itemId, n] of Object.entries(counts)) {
        const keep = Math.min(n, left);
        if (keep > 0) trimmed[itemId] = keep;
        left -= keep;
      }
      setCounts(trimmed);
    }
  };

  const changeCount = (id: string, delta: number) => {
    setCounts((prev) => {
      const n = Math.max(0, (prev[id] ?? 0) + delta);
      const next = { ...prev };
      if (n === 0) delete next[id];
      else next[id] = n;
      return next;
    });
  };

  const handleAdd = () => {
    if (!box || itemIds.length === 0) return;
    addItem({
      kind: "custom",
      boxId: box.id,
      itemIds,
      name: `Custom Hamper — ${box.name}`,
      price: rawTotal,
      quantity: 1,
      image: box.image,
      personalisation,
    });
    setAdded(true);
  };

  const startOver = () => {
    setStep(0);
    setBoxId(null);
    setCounts({});
    setPersonalisation(emptyPersonalisation);
    setAdded(false);
  };

  if (added) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <p className="font-serif text-3xl tracking-wide mb-4">Your hamper is in the cart 🤍</p>
        <p className="text-muted mb-10">We&apos;ll wrap it by hand and include your message card.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/cart"
            className="btn-luxury bg-black text-white px-10 py-4 text-[11px] uppercase tracking-[4px] hover:bg-charcoal transition-colors"
          >
            View Cart
          </Link>
          <button
            type="button"
            onClick={startOver}
            className="border border-black px-10 py-4 text-[11px] uppercase tracking-[4px] hover:bg-black hover:text-white transition-colors"
          >
            Build Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-10 lg:gap-14">
      <div className="lg:col-span-2">
        {/* Stepper */}
        <ol className="flex items-center gap-3 mb-10">
          {STEPS.map((label, i) => {
            const reachable = i === 0 || (i === 1 && !!box) || (i === 2 && !!box && itemCount > 0);
            return (
              <li key={label} className="flex items-center gap-3 flex-1 last:flex-none">
                <button
                  type="button"
                  disabled={!reachable}
                  onClick={() => setStep(i)}
                  className={`flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[2px] disabled:opacity-40 ${
                    step === i ? "text-black" : "text-muted"
                  }`}
                  aria-current={step === i ? "step" : undefined}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border ${
                      step === i ? "bg-black text-white border-black" : "border-gray-300"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
                {i < STEPS.length - 1 && <span className="h-px bg-gray-200 flex-1" />}
              </li>
            );
          })}
        </ol>

        {step === 0 && (
          <div>
            <h2 className="font-serif text-2xl tracking-wide mb-6">Choose your box</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {hamperBoxes.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => chooseBox(b.id)}
                  className={`text-left border transition-colors ${
                    boxId === b.id ? "border-black ring-1 ring-black" : "border-gray-200 hover:border-gray-400"
                  }`}
                  aria-pressed={boxId === b.id}
                >
                  <div className="relative aspect-square bg-light-gray">
                    <Image src={b.image} alt="" fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
                  </div>
                  <div className="p-4">
                    <p className="font-serif text-lg">{b.name}</p>
                    <p className="text-xs text-muted mb-2">{b.description}</p>
                    <p className="text-sm">{formatPrice(b.basePrice)}</p>
                  </div>
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={!box}
              onClick={() => setStep(1)}
              className="mt-8 btn-luxury bg-black text-white px-10 py-4 text-[11px] uppercase tracking-[4px] hover:bg-charcoal transition-colors disabled:opacity-40"
            >
              Next: Fill your hamper
            </button>
          </div>
        )}

        {step === 1 && box && (
          <div>
            <div className="flex items-end justify-between gap-4 mb-6">
              <h2 className="font-serif text-2xl tracking-wide">Fill your hamper</h2>
              <p className={`text-sm ${isFull ? "text-[#a8844a]" : "text-muted"}`} aria-live="polite">
                {itemCount} / {box.capacity} items{isFull ? " — box full" : ""}
              </p>
            </div>
            {CATEGORIES.map((cat) => {
              const list = builderItems.filter((i) => i.category === cat);
              if (list.length === 0) return null;
              return (
                <section key={cat} className="mb-10">
                  <h3 className="text-[10px] uppercase tracking-[3px] text-muted mb-4">
                    {BUILDER_CATEGORY_LABELS[cat]}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {list.map((item) => {
                      const n = counts[item.id] ?? 0;
                      return (
                        <div key={item.id} className={`border ${n > 0 ? "border-black" : "border-gray-200"}`}>
                          <div className="relative aspect-square bg-light-gray">
                            <Image src={item.image} alt="" fill className="object-cover" sizes="(max-width: 640px) 50vw, 25vw" />
                          </div>
                          <div className="p-3">
                            <p className="text-sm leading-snug mb-1 min-h-[2.5em]">{item.name}</p>
                            <p className="text-xs text-muted mb-3">{formatPrice(item.price)}</p>
                            {!item.inStock ? (
                              <p className="text-xs text-muted">Sold out</p>
                            ) : n === 0 ? (
                              <button
                                type="button"
                                disabled={isFull}
                                onClick={() => changeCount(item.id, 1)}
                                className="w-full border border-black py-2 text-[10px] uppercase tracking-[2px] hover:bg-black hover:text-white transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-black"
                              >
                                Add
                              </button>
                            ) : (
                              <div className="flex items-center justify-between border border-black">
                                <button
                                  type="button"
                                  onClick={() => changeCount(item.id, -1)}
                                  className="px-3 py-1.5"
                                  aria-label={`Remove one ${item.name}`}
                                >
                                  −
                                </button>
                                <span className="text-sm">{n}</span>
                                <button
                                  type="button"
                                  disabled={isFull}
                                  onClick={() => changeCount(item.id, 1)}
                                  className="px-3 py-1.5 disabled:opacity-30"
                                  aria-label={`Add another ${item.name}`}
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
            <button
              type="button"
              disabled={itemCount === 0}
              onClick={() => setStep(2)}
              className="btn-luxury bg-black text-white px-10 py-4 text-[11px] uppercase tracking-[4px] hover:bg-charcoal transition-colors disabled:opacity-40"
            >
              Next: Personalise
            </button>
          </div>
        )}

        {step === 2 && box && (
          <div className="max-w-lg" id="personalise">
            <h2 className="font-serif text-2xl tracking-wide mb-2">Personalise your gift</h2>
            <p className="text-sm text-muted mb-6">Free with every hamper — we handwrite your message on a card.</p>
            <PersonaliseFields value={personalisation} onChange={setPersonalisation} idPrefix="builder" />
            <button
              type="button"
              onClick={handleAdd}
              className="mt-8 w-full btn-luxury bg-black text-white py-4 text-[11px] uppercase tracking-[4px] hover:bg-charcoal transition-colors"
            >
              Add Hamper to Cart — {formatPrice(rawTotal)}
            </button>
          </div>
        )}
      </div>

      {/* Summary */}
      <aside className="bg-cream p-8 h-fit lg:sticky lg:top-32">
        <h2 className="font-serif text-lg tracking-wide mb-6">Your hamper</h2>
        {!box ? (
          <p className="text-sm text-muted">Start by choosing a box.</p>
        ) : (
          <>
            <div className="flex justify-between text-sm mb-4 pb-4 border-b border-gray-200">
              <span>{box.name}</span>
              <span>{formatPrice(box.basePrice)}</span>
            </div>
            {itemIds.length === 0 ? (
              <p className="text-sm text-muted mb-4">No items yet.</p>
            ) : (
              <ul className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                {Object.entries(counts).map(([id, n]) => {
                  const item = getBuilderItem(id);
                  if (!item) return null;
                  return (
                    <li key={id} className="flex justify-between gap-4 text-sm">
                      <span className="text-muted">
                        {item.name}
                        {n > 1 ? ` × ${n}` : ""}
                      </span>
                      <span className="flex-shrink-0">{formatPrice(item.price * n)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-semibold">{formatPrice(rawTotal)}</span>
            </div>
            <p className="text-[10px] text-muted mt-2">Delivery calculated at checkout.</p>
          </>
        )}
      </aside>
    </div>
  );
}
