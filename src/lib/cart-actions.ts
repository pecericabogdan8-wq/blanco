import type { CartItem } from "@/lib/types";
import { useShopStore } from "@/store/shop-store";

/** Persist cart to server when logged in (fire-and-forget). */
export function syncCartToServer(cart?: CartItem[]) {
  const { user } = useShopStore.getState();
  if (!user) return;
  const payload = cart ?? useShopStore.getState().cart;
  void fetch("/api/cart", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cart: payload }),
  }).catch(() => undefined);
}

/** After login: merge guest local cart with account cart. */
export async function mergeCartOnLogin(): Promise<CartItem[]> {
  const local = useShopStore.getState().cart;
  const res = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cart: local, mode: "merge" }),
  });
  const data = await res.json();
  if (!data.ok || !Array.isArray(data.cart)) return local;
  useShopStore.getState().setCart(data.cart);
  return data.cart as CartItem[];
}
