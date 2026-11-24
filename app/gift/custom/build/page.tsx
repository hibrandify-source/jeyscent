import type { Metadata } from "next";
import HamperBuilder from "@/components/gift/HamperBuilder";

export const metadata: Metadata = {
  title: "Build Your Own Hamper",
  description:
    "Choose a box, fill it with Jey Scent fragrances, treats and keepsakes, and add a personal message.",
};

export default function BuildHamperPage() {
  return (
    <div className="page-transition pt-28 lg:pt-36">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pb-20">
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[5px] text-muted mb-3">Custom Hampers</p>
          <h1 className="font-serif text-3xl lg:text-4xl tracking-wide">Build Your Own Hamper</h1>
        </div>
        <HamperBuilder />
      </div>
    </div>
  );
}
