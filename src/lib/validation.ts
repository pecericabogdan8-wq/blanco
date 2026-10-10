import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(200),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  password: z.string().min(6).max(200),
});

export const checkoutSchema = z.object({
  method: z.enum(["card", "apple_pay", "google_pay"]),
  cart: z
    .array(
      z.object({
        productId: z.string().trim().min(1).max(64),
        colorId: z.string().trim().min(1).max(64),
        size: z.string().trim().min(1).max(16),
        qty: z.number().int().min(1).max(20),
      })
    )
    .min(1)
    .max(50),
  customer: z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().min(5).max(32),
    city: z.string().trim().min(1).max(120),
    address: z.string().trim().min(1).max(240),
    novaPoshta: z.string().trim().max(120).optional(),
  }),
});

export const supportSchema = z.object({
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(3).max(4000),
});
