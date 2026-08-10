"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
  }, [mobileOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.05)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20 lg:h-24">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2"
              aria-label="Open menu"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="15" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Desktop Nav Left */}
            <nav className="hidden lg:flex items-center gap-10">
              <Link
                href="/shop"
                className="text-[11px] uppercase tracking-[3px] text-charcoal hover:text-black transition-colors duration-300"
              >
                Shop
              </Link>
              <Link
                href="/our-story"
                className="text-[11px] uppercase tracking-[3px] text-charcoal hover:text-black transition-colors duration-300"
              >
                Our Story
              </Link>
              <Link
                href="/subscribe"
                className="text-[11px] uppercase tracking-[3px] text-charcoal hover:text-black transition-colors duration-300"
              >
                Subscribe
              </Link>
              <Link
                href="/classes"
                className="text-[11px] uppercase tracking-[3px] text-charcoal hover:text-black transition-colors duration-300"
              >
                Class
              </Link>
            </nav>

            {/* Logo */}
            <Link href="/" className="flex flex-col items-center">
              <span
                className="text-2xl lg:text-3xl tracking-[6px] uppercase"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Jey Scent
              </span>
              <span className="text-[8px] tracking-[4px] uppercase text-muted mt-0.5 hidden sm:block">
                Fragrance with intention
              </span>
            </Link>

            {/* Desktop Nav Right */}
<nav className="hidden lg:flex items-center gap-10">
  <Link
    href="/blog"
    className="text-[11px] uppercase tracking-[3px] text-charcoal hover:text-black transition-colors duration-300"
  >
    Journal
  </Link>
  <Link
    href="/jeycraft"
    className="text-[11px] uppercase tracking-[3px] text-charcoal hover:text-black transition-colors duration-300"
  >
    Jey Craft
  </Link>
  <Link
    href={user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/auth/login"}
    className="text-[11px] uppercase tracking-[3px] text-charcoal hover:text-black transition-colors duration-300"
  >
    {user ? "Account" : "Sign In"}
  </Link>
  <Link href="/cart" className="relative p-2 -mr-2">
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
    {totalItems > 0 && (
      <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-black text-white text-[10px] rounded-full flex items-center justify-center">
        {totalItems}
      </span>
    )}
  </Link>
</nav>

            {/* Mobile Cart */}
            <Link href="/cart" className="lg:hidden relative p-2 -mr-2">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-black text-white text-[10px] rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-[60] transition-all duration-500 lg:hidden ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={`absolute top-0 left-0 h-full w-80 bg-white transform transition-transform duration-500 ease-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-8">
            <div className="flex items-center justify-between mb-12">
              <span
                className="text-xl tracking-[4px] uppercase"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Menu
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 -mr-2"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col gap-8">
              {[
                { href: "/shop", label: "Shop" },
                { href: "/our-story", label: "Our Story" },
                { href: "/subscribe", label: "Subscribe" },
                { href: "/classes", label: "Class" },
                { href: "/blog", label: "Journal" },
                { href: "/jeycraft", label: "Jey Craft" },
                {
                  href: user
                    ? user.role === "admin"
                      ? "/admin"
                      : "/dashboard"
                    : "/auth/login",
                  label: user ? "My Account" : "Sign In",
                },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-lg tracking-[3px] uppercase text-charcoal hover:text-black transition-colors"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-16 pt-8 border-t border-light-gray">
              <p className="text-[10px] uppercase tracking-[3px] text-muted mb-2">
                Fragrance with intention
              </p>
              <p className="text-[10px] uppercase tracking-[2px] text-muted">
                © 2026 Jey Scent
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}