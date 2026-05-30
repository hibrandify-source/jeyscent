"use client";

import { useState, useMemo } from "react";
import {
  findShippingZone,
  getAllAreas,
  formatShippingFee,
  FREE_SHIPPING_THRESHOLD,
} from "@/lib/shipping";

interface ShippingCalculatorProps {
  area: string;
  onAreaChange: (area: string) => void;
  cartTotal: number;
}

export default function ShippingCalculator({
  area,
  onAreaChange,
  cartTotal,
}: ShippingCalculatorProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const allAreas = useMemo(() => getAllAreas(), []);

  const suggestions = useMemo(() => {
    if (!area || area.length < 2) return [];
    const search = area.toLowerCase();
    return allAreas
      .filter((a) => a.toLowerCase().includes(search))
      .slice(0, 8);
  }, [area, allAreas]);

  const zone = findShippingZone(area);
  const freeShipping =
    cartTotal >= FREE_SHIPPING_THRESHOLD && zone && !zone.isParkPickup;

  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[3px] text-muted mb-2">
        Area / Neighbourhood
      </label>
      <div className="relative">
        <input
          type="text"
          value={area}
          onChange={(e) => {
            onAreaChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="w-full border border-gray-200 px-4 py-3.5 text-sm focus:outline-none focus:border-black transition-colors"
          placeholder="Start typing your area e.g. Lekki, Ikeja, Sangotedo..."
        />

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 border-t-0 z-20 max-h-48 overflow-y-auto shadow-lg">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={() => {
                  onAreaChange(s);
                  setShowSuggestions(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Shipping Info — Lagos delivery */}
      {area && zone && !zone.isParkPickup && (
        <div className="mt-3 p-3 bg-gray-50 border border-gray-100 animate-fade-in">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted">{zone.name}</span>
            <span className="text-sm font-semibold">
              {freeShipping ? (
                <span className="text-green-700">Free Shipping</span>
              ) : (
                formatShippingFee(zone.fee)
              )}
            </span>
          </div>
          <p className="text-[10px] text-muted">
            📦 Est. delivery: {zone.estimatedDays}
          </p>
        </div>
      )}

      {/* Shipping Info — Outside Lagos (park pickup) */}
{area && zone && zone.isParkPickup && (
  <div className="mt-3 p-3 bg-amber-50 border border-amber-100 animate-fade-in">
    <div className="flex items-start gap-2">
      <span className="text-base mt-0.5">🚌</span>
      <div>
        <p className="text-sm font-medium text-amber-900 mb-1">
          {zone.name} — Park Pickup
        </p>
        <p className="text-xs text-amber-800 leading-relaxed mb-2">
          Your order will be shipped to the nearest bus park in your city.
          A flat logistics fee of <strong>₦3,500</strong> covers delivery
          from our store to the bus park.
        </p>
        <p className="text-xs text-amber-800 leading-relaxed">
          Pickup fee from the bus park to your location is negotiated
          directly between you and the bus driver.
        </p>
        <p className="text-[10px] text-amber-700 mt-2">
          💬 Need help? Chat with us on WhatsApp for guidance.
        </p>
      </div>
    </div>
  </div>
)}

      {/* Unknown area */}
      {area && !zone && area.length >= 3 && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-100">
          <p className="text-xs text-yellow-800">
            We couldn&apos;t find your area. Your order will be shipped to the
            nearest bus park. Contact us on WhatsApp for details.
          </p>
        </div>
      )}

      {/* Free shipping progress — Lagos only */}
      {!freeShipping && zone && !zone.isParkPickup && (
        <div className="mt-3">
          <p className="text-[10px] text-muted mb-1">
            Add{" "}
            <span className="font-semibold text-charcoal">
              ₦{(FREE_SHIPPING_THRESHOLD - cartTotal).toLocaleString()}
            </span>{" "}
            more for free shipping within Lagos
          </p>
          <div className="bg-gray-200 h-1 rounded-full overflow-hidden">
            <div
              className="h-full bg-black rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(
                  (cartTotal / FREE_SHIPPING_THRESHOLD) * 100,
                  100
                )}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}