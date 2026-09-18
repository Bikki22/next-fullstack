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
