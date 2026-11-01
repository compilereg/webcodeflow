import { apiUrl } from "./apiUrl";
import { getCsrfToken } from "shared/auth/authStorage";
import type { ApiErrorBody } from "./types";

export class ApiError extends Error {
  status?: number;
  body?: unknown;

  constructor(
    message: string,
    { status, body }: { status?: number; body?: unknown } = {}
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type BuildHeadersOptions = {
  json?: boolean;
  csrf?: boolean;
  headers?: Record<string, string>;
};

function buildHeaders({
  json = true,
  csrf = true,
  headers = {},
}: BuildHeadersOptions = {}): Record<string, string> {
  const result = { ...headers };

  if (json && !result["Content-Type"]) {
    result["Content-Type"] = "application/json";
  }

  if (csrf && result["X-CSRF-Token"] == null) {
    result["X-CSRF-Token"] = getCsrfToken();
  }

  return result;
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export type ApiRequestOptions = {
  method?: string;
  body?: unknown;
  json?: boolean;
  csrf?: boolean;
  headers?: Record<string, string>;
  throwOnError?: boolean;
  /** Abort the request after this many ms. */
  timeoutMs?: number;
};

export type ApiResult<T = unknown> = {
  ok: boolean;
  status: number;
  data: T;
};

/**
 * Central fetch wrapper: credentials include, optional CSRF, JSON body.
 * Returns { ok, status, data } — does not throw on HTTP errors by default.
 */
export async function apiRequest<T = unknown>(
  path: string,
  {
    method = "GET",
    body,
    json = true,
    csrf = true,
    headers,
    throwOnError = false,
    timeoutMs,
  }: ApiRequestOptions = {}
): Promise<ApiResult<T>> {
  const init: RequestInit = {
    method,
    credentials: "include",
    cache: "no-store",
    headers: buildHeaders({ json: json && body !== undefined, csrf, headers }),
  };

  if (body !== undefined) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
    if (json) {
      init.headers = buildHeaders({ json: true, csrf, headers });
    }
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  if (timeoutMs != null && timeoutMs > 0) {
    const controller = new AbortController();
    init.signal = controller.signal;
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  }

  try {
    const response = await fetch(apiUrl(path), init);
    const data = (await parseBody(response)) as T;

    if (throwOnError && !response.ok) {
      const errBody = data as ApiErrorBody | null;
      const message =
        (errBody && (errBody.message || errBody.error)) ||
        `Request failed (${response.status})`;
      throw new ApiError(String(message), {
        status: response.status,
        body: data,
      });
    }

    return { ok: response.ok, status: response.status, data };
  } finally {
    if (timeoutId != null) clearTimeout(timeoutId);
  }
}
