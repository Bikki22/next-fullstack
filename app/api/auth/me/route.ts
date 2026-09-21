import { NextResponse } from "next/server";

import { UserStatus } from "@/generated/prisma/enums";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireSession } from "@/lib/auth/guards";
import { destroySession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await requireSession();

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        status: true,
        store: { select: { id: true, name: true, slug: true, status: true } },
      },
    });

    // The cookie outlives the row it describes — a deleted or suspended user
    // still holds a valid JWT for up to a week. This is the one place we spend
    // a query to re-check, so the client has a truthful answer to "who am I?".
    if (!user || user.status === UserStatus.SUSPENDED) {
      await destroySession();
      throw unauthorized();
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      store: user.store,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
