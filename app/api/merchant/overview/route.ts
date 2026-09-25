import { z } from "zod";

import { parseQuery, route } from "@/lib/api/route";
import { requireStore } from "@/lib/auth/guards";
import { merchantAnalytics } from "@/server/analytics";

const querySchema = z.object({
  days: z.coerce.number().int().min(7).max(365).default(30),
});

export const GET = route(async (request) => {
  const { store } = await requireStore();
  const { days } = parseQuery(request, querySchema);
  return merchantAnalytics(store.id, days);
});
