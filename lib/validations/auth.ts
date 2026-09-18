import { z } from "zod";

import { Role } from "@/generated/prisma/enums";

const password = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Passwords are limited to 72 characters");

export const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Tell us your name"),
    email: z.email("Enter a valid email"),
    password,
    // Only these two are self-serve; SUPER_ADMIN is seeded, never registered.
    role: z.enum([Role.CUSTOMER, Role.MERCHANT]).default(Role.CUSTOMER),
    storeName: z.string().trim().min(2, "Store name is too short").optional(),
  })
  .refine((data) => data.role !== Role.MERCHANT || Boolean(data.storeName), {
    path: ["storeName"],
    message: "Merchants need a store name",
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.input<typeof registerSchema>;
