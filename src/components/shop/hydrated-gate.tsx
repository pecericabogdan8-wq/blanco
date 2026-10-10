"use client";

import { useShopStore } from "@/store/shop-store";

/** Avoid SSR/localStorage mismatch flashes for cart-dependent UI. */
export function HydratedGate({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const hydrated = useShopStore((s) => s.hydrated);
  if (!hydrated) return <>{fallback}</>;
  return <>{children}</>;
}
