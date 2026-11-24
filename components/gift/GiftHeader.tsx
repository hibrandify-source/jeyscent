"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGiftCart } from "@/context/GiftCartContext";
import { giftNav } from "./nav";

const navLink =
  "text-[11px] uppercase tracking-[3px] text-charcoal hover:text-black transition-colors duration-300";

function CartIcon({ count }: { count: number }) {
  return (
    <Link href="/cart" className="relative p-2 -mr-2" aria-label="Gift cart">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-black text-white text-[10px] rounded-full flex items-center justify-center">
          {count}
        </span>
      )}
    </Link>
  );
}

export default function GiftHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { totalItems } = useGiftCart();
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
  }, [mobileOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20 lg:h-24">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2"
              aria-label="Open menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="15" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <Link href="/" className="flex flex-col items-center lg:items-start">
              <span className="text-2xl lg:text-[26px] tracking-[6px] uppercase font-serif">
                Jey Scent
              </span>
              <span className="text-[9px] tracking-[6px] uppercase text-[#a8844a] mt-0.5">
                Gifting
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-8">
              {giftNav.map((item) =>
                item.children ? (
                  <div key={item.href} className="relative group">
                    <Link
                      href={item.href}
                      className={`${navLink} inline-flex items-center gap-1.5 py-8 ${isActive(item.href) ? "text-black" : ""}`}
                    >
                      {item.label}
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </Link>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full pt-0 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-opacity duration-200">
                      <ul className="bg-white border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.08)] py-4 min-w-[240px]">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className="block px-6 py-2.5 text-sm text-muted hover:text-black hover:bg-cream transition-colors"
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${navLink} ${isActive(item.href) ? "text-black" : ""}`}
                  >
                    {item.label}
                  </Link>
                )
              )}
              <CartIcon count={totalItems} />
            </nav>

            <div className="lg:hidden">
              <CartIcon count={totalItems} />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-[60] transition-all duration-500 lg:hidden ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
        <div
          className={`absolute top-0 left-0 h-full w-80 max-w-[85vw] bg-white overflow-y-auto transform transition-transform duration-500 ease-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-8">
            <div className="flex items-center justify-between mb-10">
              <span className="text-xl tracking-[4px] uppercase font-serif">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="p-2 -mr-2" aria-label="Close menu">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="py-4 border-b border-gray-100 text-sm tracking-[3px] uppercase text-charcoal"
              >
                Home
              </Link>
              {giftNav.map((item) =>
                item.children ? (
                  <div key={item.href} className="border-b border-gray-100">
                    <button
                      onClick={() => setExpanded(expanded === item.href ? null : item.href)}
                      className="w-full flex items-center justify-between py-4 text-sm tracking-[3px] uppercase text-charcoal"
                      aria-expanded={expanded === item.href}
                    >
                      {item.label}
                      <svg
                        width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        className={`transition-transform ${expanded === item.href ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {expanded === item.href && (
                      <ul className="pb-4 pl-3 space-y-3">
                        <li>
                          <Link href={item.href} onClick={() => setMobileOpen(false)} className="text-sm text-black">
                            View all
                          </Link>
                        </li>
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link href={child.href} onClick={() => setMobileOpen(false)} className="text-sm text-muted">
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="py-4 border-b border-gray-100 text-sm tracking-[3px] uppercase text-charcoal"
                  >
                    {item.label}
                  </Link>
                )
              )}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
