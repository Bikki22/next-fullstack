import { parseBody, parseQuery, route } from "@/lib/api/route";
import { requireSession } from "@/lib/auth/guards";
import { checkout, listOrders } from "@/server/orders";
import { resolveOrderScope, scopeSchema } from "@/server/order-scope";
import { checkoutSchema, orderFiltersSchema } from "@/lib/validations/order";

const listQuerySchema = orderFiltersSchema.extend({ scope: scopeSchema });

export const GET = route(async (request) => {
  const query = parseQuery(request, listQuerySchema);
  const { scope } = await resolveOrderScope(query.scope);
  return listOrders(scope, query);
});

export const POST = route(async (request) => {
  const session = await requireSession();
  const input = await parseBody(request, checkoutSchema);
  // Returns { orders, esewa }. The esewa field is the signed form the browser
  // posts to the gateway, and is null for cash on delivery.
  return checkout(session.userId, input);
});
