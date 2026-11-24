import { Suspense } from "react";
import type { Metadata } from "next";
import GiftCheckout from "@/components/gift/GiftCheckout";

export const metadata: Metadata = { title: "Checkout" };

export default function GiftCheckoutPage() {
  return (
    <Suspense fallback={null}>
      <GiftCheckout />
    </Suspense>
  );
}
