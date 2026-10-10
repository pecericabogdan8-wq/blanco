"use client";

import { useEffect } from "react";
import { mergeCartOnLogin } from "@/lib/cart-actions";
import { hydrateShopLocal, useShopStore } from "@/store/shop-store";

export function ShopBootstrap() {
  useEffect(() => {
    let cancelled = false;

    async function load() {
      hydrateShopLocal();
      try {
        const [productsRes, meRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/auth/me"),
        ]);
        const productsData = await productsRes.json();
        const meData = await meRes.json();
        if (cancelled) return;

        if (productsData?.ok && Array.isArray(productsData.products)) {
          useShopStore.setState({
            products: productsData.products,
            productsLoaded: true,
          });
        }

        useShopStore.setState({ user: meData.user ?? null });

        if (meData.user) {
          const [wishRes] = await Promise.all([
            fetch("/api/wishlist"),
            mergeCartOnLogin(),
          ]);
          const wishData = await wishRes.json();
          if (!cancelled && wishData.ok) {
            useShopStore.getState().setWishlist(wishData.productIds);
          }
        }
      } catch (err) {
        console.error("ShopBootstrap", err);
      } finally {
        if (!cancelled) useShopStore.setState({ hydrated: true });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
