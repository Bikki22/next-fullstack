import { z } from "zod";

import { ProductStatus } from "@/generated/prisma/enums";

const name = z
  .string()
  .trim()
  .min(2, "Product name is too short")
  .max(120, "Product name is too long");

const description = z
  .string()
  .trim()
  .max(5_000, "Description is too long")
  .nullable();

// Integer cents, like every other amount in the app — see lib/format.ts.
const priceCents = z
  .number()
  .int("Price must be a whole number of cents")
  .min(0, "Price cannot be negative")
  .max(100_000_000, "That price looks wrong");

const stock = z
  .number()
  .int("Stock must be a whole number")
  .min(0, "Stock cannot be negative")
  .max(1_000_000, "That stock count looks wrong");

const images = z
  .array(z.url("Each image must be a valid URL"))
  .max(8, "Up to 8 images per product");

const categoryId = z.cuid("Unknown category").nullable();

export const createProductSchema = z.object({
  name,
  description: description.default(null),
  priceCents,
  stock: stock.default(0),
  images: images.default([]),
  // Sellers publish deliberately: a product nobody set live stays a draft.
  status: z.enum(ProductStatus).default(ProductStatus.DRAFT),
  categoryId: categoryId.default(null),
});

export const updateProductSchema = z
  .object({
    name,
    description,
    priceCents,
    stock,
    images,
    status: z.enum(ProductStatus),
    categoryId,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Send at least one field to update",
  });

const boolish = z
  .enum(["true", "false"], "Expected 'true' or 'false'")
  .transform((value) => value === "true");

export const productQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(100).optional(),
    // Slugs, not ids: these come from links a shopper can read.
    category: z.string().trim().min(1).optional(),
    store: z.string().trim().min(1).optional(),
    minPrice: z.coerce.number().int().min(0).optional(),
    maxPrice: z.coerce.number().int().min(0).optional(),
    sort: z
      .enum(["newest", "oldest", "price_asc", "price_desc"])
      .default("newest"),
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(60).default(24),
    // `mine=true` switches the catalog into the seller's own inventory view.
    mine: boolish.optional(),
    // Only meaningful with `mine=true`; the public catalog is always ACTIVE.
    status: z.enum(ProductStatus).optional(),
  })
  .refine(
    (query) =>
      query.minPrice === undefined ||
      query.maxPrice === undefined ||
      query.minPrice <= query.maxPrice,
    { path: ["minPrice"], message: "minPrice cannot exceed maxPrice" },
  );

export type CreateProductInput = z.input<typeof createProductSchema>;
export type UpdateProductInput = z.input<typeof updateProductSchema>;
export type ProductQuery = z.output<typeof productQuerySchema>;
