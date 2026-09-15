"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const FALLBACK_PIXEL_ID = "1005311098603826";
const PIXEL_ID =
  process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || FALLBACK_PIXEL_ID;

// ── Typed fbq helper ───────────────────────────────────────────────────────
declare global {
  interface Window {
    fbq: (
      type: string,
      event: string,
      params?: Record<string, unknown>
    ) => void;
    _fbq: unknown;
  }
}

// The pixel library loads async (afterInteractive), so `window.fbq` may not
// exist yet when an event fires. Buffer those calls and flush them once the
// script reports it's ready, so no event is silently dropped.
let pendingEvents: Array<{
  type: string;
  event: string;
  params?: Record<string, unknown>;
}> = [];

function track(
  type: string,
  event: string,
  params?: Record<string, unknown>
) {
  if (typeof window !== "undefined") {
    if (window.fbq) {
      window.fbq(type, event, params);
    } else {
      pendingEvents.push({ type, event, params });
    }
  }
}

export function flushPendingEvents() {
  if (typeof window === "undefined" || !window.fbq) return;
  const events = pendingEvents;
  pendingEvents = [];
  for (const e of events) {
    window.fbq(e.type, e.event, e.params);
  }
}

export function pageview() {
  track("track", "PageView");
}

export function addToCart(params: {
  content_ids: string[];
  content_name: string;
  content_type: string;
  value: number;
  currency: string;
}) {
  track("track", "AddToCart", params);
}

export function purchase(params: {
  value: number;
  currency: string;
  content_ids: string[];
  content_type: string;
  num_items: number;
}) {
  track("track", "Purchase", params);
}

export function viewContent(params: {
  content_ids: string[];
  content_name: string;
  content_type: string;
  content_category?: string;
  value?: number;
  currency?: string;
}) {
  track("track", "ViewContent", params);
}

export function initiateCheckout(params: {
  content_ids: string[];
  content_type: string;
  num_items: number;
  value: number;
  currency: string;
}) {
  track("track", "InitiateCheckout", params);
}

export function addPaymentInfo(params: {
  content_ids: string[];
  content_type: string;
  num_items: number;
  value: number;
  currency: string;
}) {
  track("track", "AddPaymentInfo", params);
}

// ── Component ──────────────────────────────────────────────────────────────
export default function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Fire PageView on every route change
  useEffect(() => {
    pageview();
  }, [pathname, searchParams]);

  // Don't load the pixel unless a pixel ID is configured.
  if (!PIXEL_ID) return null;

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        onLoad={flushPendingEvents}
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
      {/* NoScript fallback */}
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}