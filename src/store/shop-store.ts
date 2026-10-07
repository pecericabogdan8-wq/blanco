"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEMO_PRODUCTS } from "@/lib/demo-data";
import type {
  CartItem,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  ProductSize,
  SupportTicket,
  User,
} from "@/lib/types";

type ShopState = {
  hydrated: boolean;
  products: Product[];
  cart: CartItem[];
  wishlist: string[];
  orders: Order[];
  user: User | null;
  users: User[];
  passwords: Record<string, string>;
  tickets: SupportTicket[];
  setHydrated: (v: boolean) => void;
  // catalog
  upsertProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  setInventory: (productId: string, key: string, qty: number) => void;
  // cart
  addToCart: (item: CartItem) => { ok: boolean; error?: string };
  updateCartQty: (productId: string, colorId: string, size: ProductSize, qty: number) => void;
  removeFromCart: (productId: string, colorId: string, size: ProductSize) => void;
  clearCart: () => void;
  // wishlist
  toggleWishlist: (productId: string) => void;
  // auth
  register: (name: string, email: string, password: string) => { ok: boolean; error?: string };
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  updateProfile: (data: Partial<Pick<User, "name" | "phone">>) => void;
  // orders
  placeOrder: (input: {
    paymentMethod: PaymentMethod;
    customer: Order["customer"];
  }) => { ok: boolean; order?: Order; error?: string };
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  // support
  addTicket: (ticket: SupportTicket) => void;
  resetDemo: () => void;
};

function cloneProducts() {
  return structuredClone(DEMO_PRODUCTS);
}

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      products: cloneProducts(),
      cart: [],
      wishlist: [],
      orders: [],
      user: null,
      users: [
        {
          id: "u-demo",
          name: "Демо Користувач",
          email: "demo@blanco.ua",
          phone: "+380501112233",
          createdAt: new Date().toISOString(),
        },
      ],
      passwords: { "demo@blanco.ua": "demo1234" },
      tickets: [],
      setHydrated: (v) => set({ hydrated: v }),
      upsertProduct: (product) =>
        set((s) => {
          const idx = s.products.findIndex((p) => p.id === product.id);
          if (idx === -1) return { products: [product, ...s.products] };
          const products = [...s.products];
          products[idx] = product;
          return { products };
        }),
      deleteProduct: (id) =>
        set((s) => ({
          products: s.products.filter((p) => p.id !== id),
          cart: s.cart.filter((c) => c.productId !== id),
          wishlist: s.wishlist.filter((w) => w !== id),
        })),
      setInventory: (productId, key, qty) =>
        set((s) => ({
          products: s.products.map((p) =>
            p.id === productId
              ? { ...p, inventory: { ...p.inventory, [key]: Math.max(0, qty) } }
              : p
          ),
        })),
      addToCart: (item) => {
        const product = get().products.find((p) => p.id === item.productId);
        if (!product) return { ok: false, error: "Товар не знайдено" };
        const stock = product.inventory[`${item.colorId}:${item.size}`] ?? 0;
        const existing = get().cart.find(
          (c) =>
            c.productId === item.productId &&
            c.colorId === item.colorId &&
            c.size === item.size
        );
        const nextQty = (existing?.qty ?? 0) + item.qty;
        if (nextQty > stock) {
          return { ok: false, error: `У наявності лише ${stock} шт.` };
        }
        set((s) => {
          if (existing) {
            return {
              cart: s.cart.map((c) =>
                c.productId === item.productId &&
                c.colorId === item.colorId &&
                c.size === item.size
                  ? { ...c, qty: nextQty }
                  : c
              ),
            };
          }
          return { cart: [...s.cart, item] };
        });
        return { ok: true };
      },
      updateCartQty: (productId, colorId, size, qty) => {
        const product = get().products.find((p) => p.id === productId);
        const stock = product?.inventory[`${colorId}:${size}`] ?? 0;
        const clamped = Math.min(Math.max(1, qty), Math.max(1, stock));
        set((s) => ({
          cart: s.cart.map((c) =>
            c.productId === productId && c.colorId === colorId && c.size === size
              ? { ...c, qty: clamped }
              : c
          ),
        }));
      },
      removeFromCart: (productId, colorId, size) =>
        set((s) => ({
          cart: s.cart.filter(
            (c) =>
              !(c.productId === productId && c.colorId === colorId && c.size === size)
          ),
        })),
      clearCart: () => set({ cart: [] }),
      toggleWishlist: (productId) =>
        set((s) => ({
          wishlist: s.wishlist.includes(productId)
            ? s.wishlist.filter((id) => id !== productId)
            : [...s.wishlist, productId],
        })),
      register: (name, email, password) => {
        const normalized = email.trim().toLowerCase();
        if (get().users.some((u) => u.email === normalized)) {
          return { ok: false, error: "Email уже зареєстровано" };
        }
        if (password.length < 6) {
          return { ok: false, error: "Пароль мінімум 6 символів" };
        }
        const user: User = {
          id: `u-${Date.now()}`,
          name: name.trim(),
          email: normalized,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          users: [...s.users, user],
          passwords: { ...s.passwords, [normalized]: password },
          user,
        }));
        return { ok: true };
      },
      login: (email, password) => {
        const normalized = email.trim().toLowerCase();
        const user = get().users.find((u) => u.email === normalized);
        if (!user || get().passwords[normalized] !== password) {
          return { ok: false, error: "Невірний email або пароль" };
        }
        set({ user });
        return { ok: true };
      },
      logout: () => set({ user: null }),
      updateProfile: (data) =>
        set((s) => {
          if (!s.user) return s;
          const user = { ...s.user, ...data };
          return {
            user,
            users: s.users.map((u) => (u.id === user.id ? user : u)),
          };
        }),
      placeOrder: ({ paymentMethod, customer }) => {
        const { cart, products, user } = get();
        if (cart.length === 0) return { ok: false, error: "Кошик порожній" };

        for (const item of cart) {
          const product = products.find((p) => p.id === item.productId);
          const stock = product?.inventory[`${item.colorId}:${item.size}`] ?? 0;
          if (!product || stock < item.qty) {
            return {
              ok: false,
              error: `Недостатньо «${product?.name ?? "товар"}» у розмірі ${item.size}`,
            };
          }
        }

        const items = cart.map((item) => {
          const product = products.find((p) => p.id === item.productId)!;
          const color = product.colors.find((c) => c.id === item.colorId)!;
          const price = product.salePrice ?? product.price;
          return {
            ...item,
            name: product.name,
            price,
            colorName: color.name,
            image: product.images[0],
          };
        });

        const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
        const shipping = subtotal >= 2500 ? 0 : 99;
        const status: OrderStatus =
          paymentMethod === "card" ||
          paymentMethod === "apple_pay" ||
          paymentMethod === "google_pay"
            ? "paid"
            : "placed";

        const order: Order = {
          id: `BL-${Date.now().toString(36).toUpperCase()}`,
          createdAt: new Date().toISOString(),
          status,
          paymentMethod,
          items,
          subtotal,
          shipping,
          total: subtotal + shipping,
          customer,
          userId: user?.id,
        };

        const nextProducts = products.map((p) => {
          const updates = cart.filter((c) => c.productId === p.id);
          if (!updates.length) return p;
          const inventory = { ...p.inventory };
          for (const u of updates) {
            const key = `${u.colorId}:${u.size}`;
            inventory[key] = Math.max(0, (inventory[key] ?? 0) - u.qty);
          }
          return { ...p, inventory };
        });

        set((s) => ({
          orders: [order, ...s.orders],
          products: nextProducts,
          cart: [],
        }));
        return { ok: true, order };
      },
      updateOrderStatus: (orderId, status) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
        })),
      addTicket: (ticket) => set((s) => ({ tickets: [ticket, ...s.tickets] })),
      resetDemo: () =>
        set({
          products: cloneProducts(),
          cart: [],
          wishlist: [],
          orders: [],
          tickets: [],
        }),
    }),
    {
      name: "blanco-shop-v2",
      onRehydrateStorage: () => (state) => {
        // Always sync catalog from source so new photos/products appear
        if (state) {
          state.products = cloneProducts();
          state.setHydrated(true);
        }
      },
      partialize: (s) => ({
        cart: s.cart,
        wishlist: s.wishlist,
        orders: s.orders,
        user: s.user,
        users: s.users,
        passwords: s.passwords,
        tickets: s.tickets,
      }),
    }
  )
);

export function useCartCount() {
  return useShopStore((s) => s.cart.reduce((n, i) => n + i.qty, 0));
}

export function useWishlistCount() {
  return useShopStore((s) => s.wishlist.length);
}
