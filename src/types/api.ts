export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    perPage?: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface ApiErrorResponse {
  success: boolean;
  error: {
    code: string;
    message: string;
  };
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
  return Response.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    { status }
  );
}

export function apiSuccess<T>(
  data: T,
  meta?: ApiResponse<T>["meta"]
) {
  return Response.json({
    success: true,
    data,
    ...(meta ? { meta } : {}),
  });
}
