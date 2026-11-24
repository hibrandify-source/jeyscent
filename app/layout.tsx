import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import MetaPixel from "@/components/MetaPixel";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Jey Scent — Fragrance with Intention",
  description:
    "Luxury reed diffusers, car diffusers, room diffusers & room sprays. Two signature fragrances — Ruth & Proverbs. Creating scents that make your space feel calm, fresh, and a little bit luxurious.",
  keywords: [
    "luxury diffuser",
    "reed diffuser",
    "car diffuser",
    "room spray",
    "Nigerian fragrance brand",
    "Jey Scent",
    "home fragrance",
  ],
  openGraph: {
    title: "Jey Scent — Fragrance with Intention",
    description:
      "Luxury reed diffusers, car diffusers, room diffusers & room sprays crafted with love and intention.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        {/* Shared by both storefronts. Header/footer/cart live in the
            per-storefront layouts: app/(jeyscent)/layout.tsx (jeyscent.com)
            and app/gift/layout.tsx (gift.jeyscent.com, via proxy.ts). */}
        <AuthProvider>
          <Suspense fallback={null}>
            <MetaPixel />
          </Suspense>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}