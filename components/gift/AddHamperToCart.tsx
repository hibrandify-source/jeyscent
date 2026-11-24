"use client";

import { useState } from "react";
import Link from "next/link";
import type { Hamper } from "@/lib/types";
import { useGiftCart } from "@/context/GiftCartContext";
import PersonaliseFields, { emptyPersonalisation } from "./PersonaliseFields";

export default function AddHamperToCart({ hamper }: { hamper: Hamper }) {
  const { addItem } = useGiftCart();
  const [personalisation, setPersonalisation] = useState(emptyPersonalisation);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem({
      kind: "hamper",
      hamperId: hamper.id,
      name: hamper.name,
      price: hamper.price,
      quantity,
      image: hamper.image,
      personalisation,
    });
    setAdded(true);
    setPersonalisation(emptyPersonalisation);
    setQuantity(1);
  };

  if (!hamper.inStock) {
    return (
      <p className="bg-light-gray px-6 py-4 text-sm text-center">
        This hamper is currently sold out.
      </p>
    );
  }

  return (
    <div>
      <h2 className="font-serif text-lg tracking-wide mb-4" id="personalise">
        Personalise your gift
      </h2>
      <PersonaliseFields value={personalisation} onChange={setPersonalisation} />

      <div className="flex items-stretch gap-4 mt-8">
        <div className="flex items-center border border-gray-200">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-4 py-3 text-lg"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-8 text-center text-sm" aria-live="polite">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(20, q + 1))}
            className="px-4 py-3 text-lg"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="btn-luxury flex-1 bg-black text-white py-4 text-[11px] uppercase tracking-[4px] hover:bg-charcoal transition-colors"
        >
          Add to Gift Cart
        </button>
      </div>

      {added && (
        <div className="mt-4 p-4 bg-green-50 border border-green-100 text-green-800 text-sm flex items-center justify-between gap-4">
          <span>Added to your gift cart.</span>
          <Link href="/cart" className="underline underline-offset-4 whitespace-nowrap">
            View cart →
          </Link>
        </div>
      )}

      <p className="text-xs text-muted mt-6">
        Sending 10 or more?{" "}
        <Link href="/quote" className="underline underline-offset-4 hover:text-black">
          Request a bulk quote
        </Link>{" "}
        for volume pricing and branding.
      </p>
    </div>
  );
}
