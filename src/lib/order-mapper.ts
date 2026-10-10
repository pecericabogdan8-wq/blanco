type OrderItemRow = {
  productId: string | null;
  colorId: string;
  size: string;
  qty: number;
  name: string;
  price: number;
  colorName: string;
  image: string;
  product?: { id: string; slug: string; active: boolean } | null;
};

type OrderRow = {
  id: string;
  createdAt: Date;
  status: string;
  paymentMethod: string;
  subtotal: number;
  shipping: number;
  total: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  city: string;
  address: string;
  novaPoshta: string | null;
  userId: string | null;
  items: OrderItemRow[];
};

export function mapOrderItem(i: OrderItemRow) {
  const product = i.product ?? null;
  const productStatus = !i.productId
    ? ("gone" as const)
    : !product
      ? ("gone" as const)
      : product.active
        ? ("active" as const)
        : ("trash" as const);

  return {
    productId: i.productId ?? "",
    colorId: i.colorId,
    size: i.size,
    qty: i.qty,
    name: i.name,
    price: i.price,
    colorName: i.colorName,
    image: i.image,
    productSlug: product?.slug ?? null,
    productStatus,
  };
}

export function mapOrder(o: OrderRow) {
  return {
    id: o.id,
    createdAt: o.createdAt.toISOString(),
    status: o.status,
    paymentMethod: o.paymentMethod,
    subtotal: o.subtotal,
    shipping: o.shipping,
    total: o.total,
    userId: o.userId ?? undefined,
    customer: {
      name: o.customerName,
      email: o.customerEmail,
      phone: o.customerPhone,
      city: o.city,
      address: o.address,
      novaPoshta: o.novaPoshta ?? undefined,
    },
    items: o.items.map(mapOrderItem),
  };
}

export const orderItemInclude = {
  product: { select: { id: true, slug: true, active: true } },
} as const;
