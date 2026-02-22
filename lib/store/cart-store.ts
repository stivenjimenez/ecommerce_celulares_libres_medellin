"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { toast } from "sonner";

import { type CartItem } from "@/lib/domain/cart";
import { type Product } from "@/lib/domain/product";

type CartState = {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  totalItems: () => number;
  subtotal: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((item) => item.productId === product.id);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.productId === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item,
              ),
            };
          }

          const nextItem: CartItem = {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            image: product.images[0] ?? "/file.svg",
            quantity,
          };

          return {
            items: [...state.items, nextItem],
          };
        });

        const units = quantity > 1 ? `${quantity} unidades` : "1 unidad";
        toast.success("Producto agregado al carrito", {
          description: `${product.name} (${units})`,
        });
      },
      updateItemQuantity: (productId, quantity) => {
        const nextQuantity = Math.max(1, Math.trunc(quantity));
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId ? { ...item, quantity: nextQuantity } : item,
          ),
        }));
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
      },
      clearCart: () => {
        set({ items: [] });
      },
      totalItems: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
      subtotal: () => get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    }),
    {
      name: "clm-cart",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
