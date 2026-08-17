import { NextRequest } from "next/server";

type Handler = (
  req: NextRequest,
  ...args: unknown[]
) => Promise<Response>;

/** Adds X-Request-Id header to internal API routes */
export function withRequestId(handler: Handler) {
  return async (
    req: NextRequest,
    ...args: unknown[]
  ): Promise<Response> => {
    const requestId = crypto.randomUUID();
    const res = await handler(req, ...args);
    const headers = new Headers(res.headers);
    headers.set("X-Request-Id", requestId);
    return new Response(res.body, {
      status: res.status,
      headers,
    });
  };
}
