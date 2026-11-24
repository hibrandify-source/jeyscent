"use client";

import { useState } from "react";
import type { GiftPersonalisation } from "@/lib/types";
import { GIFT_MESSAGE_MAX } from "@/data/gifting";

export const emptyPersonalisation: GiftPersonalisation = {
  recipientName: "",
  message: "",
  deliveryDate: "",
};

const inputClass =
  "w-full border border-gray-200 px-4 py-3.5 text-sm focus:outline-none focus:border-black transition-colors bg-white";
const labelClass = "block text-[10px] uppercase tracking-[3px] text-muted mb-2";

/** Free personalisation offered on every hamper: recipient, message card, delivery date. */
export default function PersonaliseFields({
  value,
  onChange,
  idPrefix = "gift",
}: {
  value: GiftPersonalisation;
  onChange: (next: GiftPersonalisation) => void;
  idPrefix?: string;
}) {
  const set = (field: keyof GiftPersonalisation, v: string) =>
    onChange({ ...value, [field]: v });

  // Earliest selectable date: tomorrow (local time).
  const [minDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 86_400_000);
    return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  });

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={`${idPrefix}-recipient`} className={labelClass}>
          Recipient&apos;s name <span className="normal-case tracking-normal">(optional)</span>
        </label>
        <input
          id={`${idPrefix}-recipient`}
          type="text"
          maxLength={100}
          value={value.recipientName}
          onChange={(e) => set("recipientName", e.target.value)}
          className={inputClass}
          placeholder="Who is this gift for?"
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-message`} className={labelClass}>
          Gift message <span className="normal-case tracking-normal">(optional)</span>
        </label>
        <textarea
          id={`${idPrefix}-message`}
          rows={3}
          maxLength={GIFT_MESSAGE_MAX}
          value={value.message}
          onChange={(e) => set("message", e.target.value)}
          className={`${inputClass} resize-none`}
          placeholder="We'll handwrite this on your message card"
        />
        <p className="text-[10px] text-muted text-right mt-1">
          {value.message.length}/{GIFT_MESSAGE_MAX}
        </p>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-date`} className={labelClass}>
          Preferred delivery date <span className="normal-case tracking-normal">(optional)</span>
        </label>
        <input
          id={`${idPrefix}-date`}
          type="date"
          min={minDate}
          value={value.deliveryDate}
          onChange={(e) => set("deliveryDate", e.target.value)}
          className={inputClass}
        />
      </div>
    </div>
  );
}
