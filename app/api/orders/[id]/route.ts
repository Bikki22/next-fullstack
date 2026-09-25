import { OrderStatus } from "@/generated/prisma/enums";
import { forbidden } from "@/lib/api/errors";
import { parseBody, parseQuery, route } from "@/lib/api/route";
import { canCustomerCancel, getOrder, updateOrderStatus } from "@/server/orders";
import { resolveOrderScope, scopeSchema } from "@/server/order-scope";
import { orderStatusSchema } from "@/lib/validations/order";
import { z } from "zod";

const scopeQuerySchema = z.object({ scope: scopeSchema });

export const GET = route<{ id: string }>(async (request, { params }) => {
  const { scope } = await resolveOrderScope(
    parseQuery(request, scopeQuerySchema).scope,
  );
  return getOrder(params.id, scope);
});

export const PATCH = route<{ id: string }>(async (request, { params }) => {
  const requested = new URL(request.url).searchParams.get("scope") ?? "customer";
  const { scope, role } = await resolveOrderScope(
    scopeQuerySchema.parse({ scope: requested }).scope,
  );
  const input = await parseBody(request, orderStatusSchema);

  // Customers get exactly one lever: cancel, and only while it still makes sense.
  if (scope.role === "customer") {
    if (input.status !== OrderStatus.CANCELLED) {
      throw forbidden("You can only cancel your own orders");
    }
    const order = await getOrder(params.id, scope);
    if (!canCustomerCancel(order.status, role)) {
      throw forbidden("This order has already shipped");
    }
  }

  return updateOrderStatus(params.id, scope, input.status, input.note || undefined);
});
