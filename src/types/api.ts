export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    perPage?: number;
  };
}

export interface ApiError {
  error: string;
  code: string;
  status: number;
}

export const API_ERRORS = {
  UNAUTHORIZED: { code: "UNAUTHORIZED", status: 401 },
  FORBIDDEN: { code: "FORBIDDEN", status: 403 },
  NOT_FOUND: { code: "NOT_FOUND", status: 404 },
  RATE_LIMITED: { code: "RATE_LIMITED", status: 429 },
  PLAN_LIMIT_REACHED: { code: "PLAN_LIMIT_REACHED", status: 402 },
  INVALID_INPUT: { code: "INVALID_INPUT", status: 400 },
  CONFLICT: { code: "CONFLICT", status: 409 },
  INVALID_ACTION: { code: "INVALID_ACTION", status: 400 },
  ALREADY_SUBSCRIBED: { code: "ALREADY_SUBSCRIBED", status: 409 },
  INTERNAL_ERROR: { code: "INTERNAL_ERROR", status: 500 },
} as const;

export function apiError(
  key: keyof typeof API_ERRORS,
  message: string
) {
  const { code, status } = API_ERRORS[key];
  return Response.json({ error: message, code }, { status });
}

export function apiSuccess<T>(
  data: T,
  meta?: ApiResponse<T>["meta"]
) {
  return Response.json({ data, ...(meta ? { meta } : {}) });
}
