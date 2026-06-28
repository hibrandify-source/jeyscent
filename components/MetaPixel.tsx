"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const PIXEL_ID = "1005311098603826";

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

export function pageview() {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "PageView");
  }
}

export function addToCart(params: {
  content_ids: string[];
  content_name: string;
  content_type: string;
  value: number;
  currency: string;
}) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "AddToCart", params);
  }
}

export function purchase(params: {
  value: number;
  currency: string;
  content_ids: string[];
  content_type: string;
  num_items: number;
}) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "Purchase", params);
  }
}

export function viewContent(params: {
  content_ids: string[];
  content_name: string;
  content_type: string;
  content_category?: string;
  value?: number;
  currency?: string;
}) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "ViewContent", params);
  }
}

export function initiateCheckout(params: {
  content_ids: string[];
  content_type: string;
  num_items: number;
  value: number;
  currency: string;
}) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "InitiateCheckout", params);
  }
}

export function addPaymentInfo(params: {
  content_ids: string[];
  content_type: string;
  num_items: number;
  value: number;
  currency: string;
}) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "AddPaymentInfo", params);
  }
}

// ── Component ──────────────────────────────────────────────────────────────
export default function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Fire PageView on every route change
  useEffect(() => {
    pageview();
  }, [pathname, searchParams]);

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
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