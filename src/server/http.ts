import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * One response shape for the whole API.
 *
 *   success -> { data: T, meta?: {...} }
 *   failure -> { error: { code, message, details? } }
 *
 * Handlers never build a NextResponse directly; they return ok()/fail() or
 * throw an ApiError and let withErrorHandling convert it.
 */

export interface ApiMeta {
  total?: number;
  limit?: number;
  offset?: number;
  hasMore?: boolean;
  [key: string]: unknown;
}

export type ErrorCode =
  | "bad_request"
  | "validation_failed"
  | "not_found"
  | "rate_limited"
  | "conflict"
  | "internal_error";

const STATUS_FOR: Record<ErrorCode, number> = {
  bad_request: 400,
  validation_failed: 422,
  not_found: 404,
  rate_limited: 429,
  conflict: 409,
  internal_error: 500,
};

export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown,
    readonly headers?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const notFound = (what: string) => new ApiError("not_found", `${what} not found`);

export function ok<T>(data: T, meta?: ApiMeta, init?: ResponseInit) {
  return NextResponse.json(meta ? { data, meta } : { data }, init);
}

export function fail(error: ApiError) {
  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
    },
    { status: STATUS_FOR[error.code], headers: error.headers },
  );
}

/**
 * Wraps a route handler so no failure escapes as an unformatted 500.
 *
 * Zod failures become 422 with per-field messages. Anything unrecognised is
 * logged server-side and reported as a bare 500 — internal messages and stack
 * traces are never echoed to the client.
 */
export function withErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof ApiError) return fail(error);

      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          field: issue.path.join(".") || "(root)",
          message: issue.message,
        }));
        return fail(new ApiError("validation_failed", "Request validation failed", details));
      }

      console.error("[api] unhandled error:", error);
      return fail(new ApiError("internal_error", "Something went wrong"));
    }
  };
}

/** Parses a JSON body, turning malformed JSON into a clean 400. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError("bad_request", "Request body must be valid JSON");
  }
}
