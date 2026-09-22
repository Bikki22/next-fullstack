import { z } from "zod";

const quantity = z
  .number()
  .int("Quantity must be a whole number")
  .min(1, "Quantity must be at least 1")
  .max(99, "Up to 99 of one product");

export const addCartItemSchema = z.object({
  productId: z.cuid("Unknown product"),
  quantity: quantity.default(1),
});

export const updateCartItemSchema = z.object({ quantity });
