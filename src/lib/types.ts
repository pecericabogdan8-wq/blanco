export type Category = "sweaters" | "tshirts" | "scarves";

export type ProductColor = {
  id: string;
  name: string;
  hex: string;
};

export type ProductSize = "XS" | "S" | "M" | "L" | "XL" | "XXL" | "ONE";

export type InventoryKey = string; // `${colorId}:${size}`

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  description: string;
  details: string[];
  price: number;
  salePrice?: number;
  colors: ProductColor[];
  sizes: ProductSize[];
  inventory: Record<InventoryKey, number>;
  images: string[];
  figure?: string;
  featured?: boolean;
  newArrival?: boolean;
  tags: string[];
  sizeChart?: { size: ProductSize; chest: string; length: string; sleeve: string }[];
};

export type CartItem = {
  productId: string;
  colorId: string;
  size: ProductSize;
  qty: number;
};

export type OrderStatus =
  | "placed"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "card" | "apple_pay" | "google_pay";

export type OrderItem = CartItem & {
  name: string;
  price: number;
  colorName: string;
  image: string;
};

export type Order = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  customer: {
    name: string;
    email: string;
    phone: string;
    city: string;
    address: string;
    novaPoshta?: string;
  };
  userId?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
};

export type Review = {
  id: string;
  productId?: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  city: string;
};

export type InstagramMention = {
  id: string;
  handle: string;
  caption: string;
  image: string;
};

export type SupportTicket = {
  id: string;
  createdAt: string;
  email: string;
  message: string;
  status: "open" | "escalated" | "resolved";
  telegramSent?: boolean;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  ts: number;
};
