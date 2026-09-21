import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { env } from "@/lib/env";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const badRequest = (message = "Invalid request", details?: unknown) =>
  new ApiError(400, message, details);

export const unauthorized = (message = "You must be signed in") =>
  new ApiError(401, message);

export const forbidden = (
  message = "You do not have access to this resource",
) => new ApiError(403, message);

export const notFound = (message = "Not found") => new ApiError(404, message);

export const conflict = (message: string) => new ApiError(409, message);

/**
 * Turns anything thrown inside a route handler into a JSON response. Every
 * handler ends with `catch (error) { return handleApiError(error) }`, so error
 * bodies stay identical across the API.
 */
export function handleApiError(error: unknown) {
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

  // `request.json()` throws a SyntaxError on a malformed body — the caller's
  // fault, not ours.
  if (error instanceof SyntaxError) {
    return NextResponse.json(
      { error: "Request body must be valid JSON" },
      { status: 400 },
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
