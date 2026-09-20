import { route } from "@/lib/api/route";
import { destroySession } from "@/lib/auth/session";

// Clearing a cookie the visitor never had is not an error, so this stays
// idempotent: always 204, signed in or not.
export const POST = route(async () => {
  await destroySession();
});
