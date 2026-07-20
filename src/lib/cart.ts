import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string; // productId + optional variantId
  product_id: string;
  variant_id: string | null;
  variant_label: string | null;
  slug: string;
  name_ar: string;
  name_fr: string;
  price: number;
  image_url: string | null;
  qty: number;
}

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty"> & { qty?: number }) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((s) => {
          const existing = s.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.id === item.id ? { ...i, qty: i.qty + (item.qty ?? 1) } : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, qty: item.qty ?? 1 }] };
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      setQty: (id, qty) =>
        set((s) => ({
          items: s.items
            .map((i) => (i.id === id ? { ...i, qty: Math.max(1, Math.min(99, qty)) } : i))
            .filter((i) => i.qty > 0),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "tringle-cart" },
  ),
);

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.qty, 0);
}
export function cartSubtotal(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.price * i.qty, 0);
}
