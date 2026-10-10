import { prisma } from "@/lib/db";

export type ShippingConfig = {
  freeFrom: number;
  flatRate: number;
  carrier: string;
};

export const DEFAULT_SHIPPING: ShippingConfig = {
  freeFrom: 2500,
  flatRate: 99,
  carrier: "nova_poshta",
};

export async function getShippingConfig(): Promise<ShippingConfig> {
  const row = await prisma.siteSetting.findUnique({ where: { key: "shipping" } });
  if (!row) return DEFAULT_SHIPPING;
  try {
    return { ...DEFAULT_SHIPPING, ...(JSON.parse(row.value) as Partial<ShippingConfig>) };
  } catch {
    return DEFAULT_SHIPPING;
  }
}

export function calcShipping(subtotal: number, cfg: ShippingConfig) {
  if (subtotal <= 0 || subtotal >= cfg.freeFrom) return 0;
  return cfg.flatRate;
}
