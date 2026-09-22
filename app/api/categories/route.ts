import { NextResponse, type NextRequest } from "next/server";

import { Role } from "@/generated/prisma/enums";
import { badRequest, conflict, handleApiError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/format";
import { createCategorySchema } from "@/lib/validations/category";

const categorySelect = { id: true, name: true, slug: true } as const;

// Public: the catalog filter and the seller's product form both read this.
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      select: categorySelect,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(Role.SUPER_ADMIN);
    const input = createCategorySchema.parse(await request.json());

    const slug = slugify(input.name);
    if (!slug) throw badRequest("Category name needs a letter or digit");

    // Categories are a short, curated list: a clash is a duplicate, not
    // something to paper over with a `-2` suffix.
    const existing = await prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existing) throw conflict("That category already exists");

    const category = await prisma.category.create({
      data: { name: input.name, slug },
      select: categorySelect,
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
