"use client";

import { useShopStore } from "@/store/shop-store";

export async function toggleWishlist(productId: string): Promise<boolean> {
  const { user, toggleWishlistLocal, setWishlist, wishlist } =
    useShopStore.getState();

  if (!user) {
    toggleWishlistLocal(productId);
    return !wishlist.includes(productId);
  }

  const res = await fetch("/api/wishlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error ?? "Wishlist error");

  const next = data.wished
    ? [...new Set([...wishlist, productId])]
    : wishlist.filter((id) => id !== productId);
  setWishlist(next);
  return Boolean(data.wished);
}
