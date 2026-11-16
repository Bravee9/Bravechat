/**
 * services/http.ts — the ONLY place that calls `fetch` against the API.
 * Unwraps the `{ statusCode, data }` envelope and throws `ApiError` on failure.
 * Works in Server Components and in the browser.
 */

import type { ApiErrorBody, ApiSuccess } from "@discord-clone/shared";
import { env } from "@/config/env";

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | null;

  constructor(status: number, body: ApiErrorBody | null) {
    super(body?.message ?? `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type Query = Record<string, string | number | undefined>;

interface RequestOptions extends Omit<RequestInit, "body" | "method"> {
  query?: Query;
  body?: unknown;
}

function buildUrl(path: string, query?: Query): string {
  const url = new URL(env.apiUrl.replace(/\/$/, "") + path);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

let refreshInFlight: Promise<boolean> | null = null;
let sessionVersion = 0;

async function request<T>(method: string, path: string, options: RequestOptions = {}, retryAuth = true): Promise<T> {
  const { query, body, headers, ...init } = options;
  const multipart = typeof FormData !== "undefined" && body instanceof FormData;

  // Request mới chờ cookie được xoay vòng, không gửi bằng phiên vừa hết hạn.
  if (refreshInFlight && !path.startsWith("/auth/")) await refreshInFlight;
  const sentVersion = sessionVersion;
  const response = await fetch(buildUrl(path, query), {
    ...init,
    method,
    credentials: "include",
    cache: "no-store",
    signal: init.signal ?? AbortSignal.timeout(15000),
    headers: {
      Accept: "application/json",
      ...(body !== undefined && !multipart ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: multipart ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json: unknown = await response.json().catch(() => null);

  if (response.status === 401 && retryAuth && (!path.startsWith("/auth/") || path === "/auth/me")) {
    // 401 cũ có thể về sau khi refresh đã xong; không consume refresh token lần nữa.
    if (sentVersion !== sessionVersion) return request<T>(method, path, options, false);
    refreshInFlight ??= fetch(buildUrl("/auth/refresh"), { method: "POST", credentials: "include", signal: AbortSignal.timeout(15000), headers: { Accept: "application/json" } })
      .then((refresh) => { if (refresh.ok) sessionVersion++; return refresh.ok; })
      .catch(() => false)
      .finally(() => { refreshInFlight = null; });
    if (await refreshInFlight) return request<T>(method, path, options, false);
  }

  if (!response.ok) {
    throw new ApiError(response.status, json as ApiErrorBody | null);
  }
  return (json as ApiSuccess<T>).data;
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, options),
};
