"use client";

import { useState } from "react";

// ExpandableText — client-side "See more" wrapper for long descriptions.
// Renders the first `maxLength` characters with a "See more" button when the
// full text is longer; clicking the button reveals the rest. The collapsed
// state preserves the original whitespace via `whitespace-pre-line`.
export default function ExpandableText({
  text,
  maxLength = 220,
  className = "",
  moreLabel = "See more",
  lessLabel = "See less",
}: {
  text: string;
  maxLength?: number;
  className?: string;
  moreLabel?: string;
  lessLabel?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  if (text.length <= maxLength) {
    return <p className={`whitespace-pre-line ${className}`}>{text}</p>;
  }

  if (expanded) {
    return (
      <p className={`whitespace-pre-line ${className}`}>
        {text}{" "}
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-charcoal underline underline-offset-2 text-xs ml-1 hover:opacity-70"
          aria-expanded={expanded}
        >
          {lessLabel}
        </button>
      </p>
    );
  }

  const truncated = text.slice(0, maxLength).replace(/\s+\S*$/, "") + "…";

  return (
    <p className={`whitespace-pre-line ${className}`}>
      {truncated}{" "}
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="text-charcoal underline underline-offset-2 text-xs ml-1 hover:opacity-70"
        aria-expanded={expanded}
      >
        {moreLabel}
      </button>
    </p>
  );
}
