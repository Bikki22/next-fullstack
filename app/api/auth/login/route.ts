import { UserStatus } from "@/generated/prisma/enums";
import { forbidden, unauthorized } from "@/lib/api/errors";
import { parseBody, route } from "@/lib/api/route";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";

export const POST = route(async (request) => {
  const input = await parseBody(request, loginSchema);

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

  const session = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  await createSession(session);

  return { user: session };
});
