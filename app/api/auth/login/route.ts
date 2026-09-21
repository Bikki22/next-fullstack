import { NextResponse, type NextRequest } from "next/server";

import { UserStatus } from "@/generated/prisma/enums";
import { forbidden, handleApiError, unauthorized } from "@/lib/api/errors";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const input = loginSchema.parse(await request.json());

    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        passwordHash: true,
      },
    });

    // Same message either way: never reveal which half of the pair was wrong.
    const valid =
      user && (await verifyPassword(input.password, user.passwordHash));
    if (!user || !valid) throw unauthorized("Email or password is incorrect");

    if (user.status === UserStatus.SUSPENDED) {
      throw forbidden("This account has been suspended");
    }

    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // `id`, not the session's `userId` — every auth route answers in the same
    // shape as `GET /api/auth/me`, so clients need only one parser.
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
