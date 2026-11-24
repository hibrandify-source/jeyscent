"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type { GiftCartItem } from "@/lib/types";
import { addToCart } from "@/components/MetaPixel";

// Cart for the gifting storefront (gift.jeyscent.com). Separate from the main
// CartContext: gift lines carry personalisation, and two identical hampers for
// different recipients are different lines.

interface GiftCartContextType {
  items: GiftCartItem[];
  addItem: (item: Omit<GiftCartItem, "lineId">) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const STORAGE_KEY = "gift-cart";

const GiftCartContext = createContext<GiftCartContextType | undefined>(undefined);

function sameGift(a: Omit<GiftCartItem, "lineId">, b: Omit<GiftCartItem, "lineId">) {
  return (
    a.kind === b.kind &&
    a.hamperId === b.hamperId &&
    a.boxId === b.boxId &&
    (a.itemIds ?? []).join(",") === (b.itemIds ?? []).join(",") &&
    a.personalisation.recipientName === b.personalisation.recipientName &&
    a.personalisation.message === b.personalisation.message &&
    a.personalisation.deliveryDate === b.personalisation.deliveryDate
  );
}

export function GiftCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<GiftCartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from localStorage; runs once on mount
        setItems(JSON.parse(saved));
      } catch {
        setItems([]);
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, loaded]);

  const addItem = (newItem: Omit<GiftCartItem, "lineId">) => {
    setItems((prev) => {
      const existing = prev.find((i) => sameGift(i, newItem));
      const updated = existing
        ? prev.map((i) =>
            i.lineId === existing.lineId
              ? { ...i, quantity: i.quantity + newItem.quantity }
              : i
          )
        : [
            ...prev,
            {
              ...newItem,
              lineId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
            },
          ];

      addToCart({
        content_ids: [newItem.hamperId ?? `custom:${newItem.boxId}`],
        content_name: newItem.name,
        content_type: "product",
        value: newItem.price * newItem.quantity,
        currency: "NGN",
      });

      return updated;
    });
  };

  const removeItem = (lineId: string) => {
    setItems((prev) => prev.filter((i) => i.lineId !== lineId));
  };

  const updateQuantity = (lineId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(lineId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.lineId === lineId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  return (
    <GiftCartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </GiftCartContext.Provider>
  );
}

export function useGiftCart() {
  const context = useContext(GiftCartContext);
  if (!context) throw new Error("useGiftCart must be used within GiftCartProvider");
  return context;
}
