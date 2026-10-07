"use client";

import { useEffect } from "react";
import { Toaster } from "sonner";
import { useShopStore } from "@/store/shop-store";

export function Providers({ children }: { children: React.ReactNode }) {
  const setHydrated = useShopStore((s) => s.setHydrated);

  useEffect(() => {
    setHydrated(true);
  }, [setHydrated]);

  return (
    <>
      {children}
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          className: "font-sans",
        }}
      />
    </>
  );
}
