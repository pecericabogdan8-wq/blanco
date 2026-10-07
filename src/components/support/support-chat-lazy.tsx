"use client";

import dynamic from "next/dynamic";

export const SupportChatLazy = dynamic(
  () => import("@/components/support/support-chat").then((m) => m.SupportChat),
  {
    ssr: false,
    loading: () => null,
  }
);
