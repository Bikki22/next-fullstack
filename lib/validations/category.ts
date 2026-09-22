import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name is too short")
    .max(60, "Category name is too long"),
});

export type CreateCategoryInput = z.input<typeof createCategorySchema>;
