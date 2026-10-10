"use client";

import { create } from "zustand";
import type { CartItem, Product, ProductSize } from "@/lib/types";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: "USER" | "ADMIN";
  settings: Record<string, unknown>;
};

type ShopState = {
  hydrated: boolean;
  products: Product[];
  productsLoaded: boolean;
  cart: CartItem[];
  wishlist: string[];
  user: SessionUser | null;
  setHydrated: (v: boolean) => void;
  setProducts: (products: Product[]) => void;
  setUser: (user: SessionUser | null) => void;
  setWishlist: (ids: string[]) => void;
  setCart: (cart: CartItem[]) => void;
  addToCart: (item: CartItem) => { ok: boolean; error?: string };
  updateCartQty: (
    productId: string,
    colorId: string,
    size: ProductSize,
    qty: number
  ) => void;
  removeFromCart: (productId: string, colorId: string, size: ProductSize) => void;
  clearCart: () => void;
  toggleWishlistLocal: (productId: string) => void;
};

const CART_KEY = "blanco-cart-v4";

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { cart?: CartItem[]; wishlist?: string[] };
    return Array.isArray(parsed.cart) ? parsed.cart : [];
  } catch {
    return [];
  }
}

function readWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { wishlist?: string[] };
    return Array.isArray(parsed.wishlist) ? parsed.wishlist : [];
  } catch {
    return [];
  }
}

function writeLocal(cart: CartItem[], wishlist: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify({ cart, wishlist }));
}

function persistCartServer(cart: CartItem[]) {
  if (typeof window === "undefined") return;
  if (!getUserLoggedIn()) return;
  void fetch("/api/cart", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cart }),
  }).catch(() => undefined);
}

function getUserLoggedIn() {
  try {
    return Boolean(useShopStore.getState().user);
  } catch {
    return false;
  }
}

export const useShopStore = create<ShopState>((set, get) => ({
  hydrated: false,
  products: [],
  productsLoaded: false,
  cart: [],
  wishlist: [],
  user: null,
  setHydrated: (v) => set({ hydrated: v }),
  setProducts: (products) => set({ products, productsLoaded: true }),
  setUser: (user) => set({ user }),
  setWishlist: (wishlist) => {
    set({ wishlist });
    writeLocal(get().cart, wishlist);
  },
  setCart: (cart) => {
    set({ cart });
    writeLocal(cart, get().wishlist);
    persistCartServer(cart);
  },
  addToCart: (item) => {
    const product = get().products.find((p) => p.id === item.productId);
    if (!product) return { ok: false, error: "Товар не знайдено" };
    if (product.active === false) {
      return { ok: false, error: "Товар знято з продажу" };
    }
    const stock = product.inventory[`${item.colorId}:${item.size}`] ?? 0;
    const existing = get().cart.find(
      (c) =>
        c.productId === item.productId &&
        c.colorId === item.colorId &&
        c.size === item.size
    );
    const nextQty = (existing?.qty ?? 0) + item.qty;
    if (stock <= 0 || nextQty > stock) {
      return { ok: false, error: `У наявності лише ${stock} шт.` };
    }
    let cart: CartItem[];
    if (existing) {
      cart = get().cart.map((c) =>
        c.productId === item.productId &&
        c.colorId === item.colorId &&
        c.size === item.size
          ? { ...c, qty: nextQty }
          : c
      );
    } else {
      cart = [...get().cart, item];
    }
    set({ cart });
    writeLocal(cart, get().wishlist);
    persistCartServer(cart);
    return { ok: true };
  },
  updateCartQty: (productId, colorId, size, qty) => {
    const product = get().products.find((p) => p.id === productId);
    const stock = product?.inventory[`${colorId}:${size}`] ?? 0;
    if (qty <= 0 || stock <= 0) {
      get().removeFromCart(productId, colorId, size);
      return;
    }
    const next = Math.min(qty, stock);
    const cart = get().cart.map((c) =>
      c.productId === productId && c.colorId === colorId && c.size === size
        ? { ...c, qty: next }
        : c
    );
    set({ cart });
    writeLocal(cart, get().wishlist);
    persistCartServer(cart);
  },
  removeFromCart: (productId, colorId, size) => {
    const cart = get().cart.filter(
      (c) =>
        !(c.productId === productId && c.colorId === colorId && c.size === size)
    );
    set({ cart });
    writeLocal(cart, get().wishlist);
    persistCartServer(cart);
  },
  clearCart: () => {
    set({ cart: [] });
    writeLocal([], get().wishlist);
    persistCartServer([]);
  },
  toggleWishlistLocal: (productId) => {
    const wishlist = get().wishlist.includes(productId)
      ? get().wishlist.filter((id) => id !== productId)
      : [...get().wishlist, productId];
    set({ wishlist });
    writeLocal(get().cart, wishlist);
  },
}));

/** Call once on client mount to restore cart/wishlist from localStorage. */
export function hydrateShopLocal() {
  const cart = readCart();
  const wishlist = readWishlist();
  useShopStore.setState({ cart, wishlist, hydrated: true });
}

export function useCartCount() {
  return useShopStore((s) => s.cart.reduce((n, i) => n + i.qty, 0));
}

export function useWishlistCount() {
  return useShopStore((s) => s.wishlist.length);
}
