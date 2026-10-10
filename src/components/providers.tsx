"use client";

import { Toaster } from "sonner";
import { ShopBootstrap } from "@/components/shop/shop-bootstrap";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ShopBootstrap />
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
