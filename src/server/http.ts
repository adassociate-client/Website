import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { MAX_BODY_BYTES } from "./constants";

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
  | "payload_too_large"
  | "conflict"
  | "internal_error";

const STATUS_FOR: Record<ErrorCode, number> = {
  bad_request: 400,
  validation_failed: 422,
  not_found: 404,
  rate_limited: 429,
  payload_too_large: 413,
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

/**
 * Reads the body with a hard byte ceiling, then parses it as JSON.
 *
 * `request.json()` buffers whatever arrives before anything can inspect it,
 * so a single request could pin memory well before Zod ever saw the payload.
 * This streams instead and aborts the moment the limit is passed, so an
 * oversized body costs the bytes read so far and nothing more.
 *
 * Content-Length is checked first as a cheap rejection, but it is only a
 * hint — it can be absent under chunked encoding and it can lie — so the
 * running total is what actually enforces the limit.
 */
export async function readJson(
  request: Request,
  maxBytes: number = MAX_BODY_BYTES,
): Promise<unknown> {
  const tooLarge = () =>
    new ApiError(
      "payload_too_large",
      `Request body must be ${maxBytes} bytes or fewer`,
    );

  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) throw tooLarge();

  if (!request.body) throw new ApiError("bad_request", "Request body is required");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw tooLarge();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(total);
  let at = 0;
  for (const chunk of chunks) {
    body.set(chunk, at);
    at += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder().decode(body));
  } catch {
    throw new ApiError("bad_request", "Request body must be valid JSON");
  }
}
