import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";

import { ApiError, badRequest } from "@/lib/api/errors";
import { env } from "@/lib/env";

export function route<
  Params extends Record<string, string> = Record<string, never>,
>(
  handler: (
    request: NextRequest,
    context: { params: Params },
  ) => Promise<unknown> | unknown,
) {
  return async (
    request: NextRequest,
    context: { params: Promise<Params> },
  ): Promise<Response> => {
    try {
      const params = ((await context?.params) ?? {}) as Params;
      const result = await handler(request, { params });

      if (result instanceof Response) return result;
      if (result === undefined) return new NextResponse(null, { status: 204 });
      return NextResponse.json(result);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

function toErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", details: flattenZodError(error) },
      { status: 422 },
    );
  }

  if (env.NODE_ENV !== "production") console.error(error);

  return NextResponse.json(
    { error: "Something went wrong on our side" },
    { status: 500 },
  );
}

function flattenZodError(error: ZodError) {
  return error.issues.reduce<Record<string, string>>((acc, issue) => {
    const key = issue.path.join(".") || "_";
    acc[key] ??= issue.message;
    return acc;
  }, {});
}

export async function parseBody<T>(request: NextRequest, schema: ZodType<T>) {
  const json = await request.json().catch(() => {
    throw badRequest("Request body must be valid JSON");
  });
  return schema.parse(json);
}

export function parseQuery<T>(request: NextRequest, schema: ZodType<T>) {
  return schema.parse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
}
