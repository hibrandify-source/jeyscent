// Public URLs of the two storefronts served by this app. gift.jeyscent.com is
// routed to app/gift/* by proxy.ts.
export const MAIN_SITE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://jeyscent.com";

export const GIFT_SITE_URL =
  process.env.NEXT_PUBLIC_GIFT_BASE_URL || "https://gift.jeyscent.com";
