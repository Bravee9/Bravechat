/**
 * config/env.ts — typed access to public env vars. Import this, never `process.env` directly.
 * Supports polyglot service decomposition (e.g., Java Spring Boot for Auth/Core, Rust for Realtime WS).
 */

const defaultApiUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export const env = {
  /** Default REST base URL, already includes the `/api` prefix. */
  apiUrl: defaultApiUrl,
  /** Optional dedicated Auth/Identity service base URL (e.g. Java Spring Boot). */
  authApiUrl: process.env.NEXT_PUBLIC_AUTH_API_URL ?? defaultApiUrl,
  /** Optional dedicated Core Guild/Channel/Message service base URL. */
  coreApiUrl: process.env.NEXT_PUBLIC_CORE_API_URL ?? defaultApiUrl,
  /** Dedicated Realtime WebSocket Gateway URL (e.g. Rust Axum/Tokio or Node WS). */
  wsUrl:
    process.env.NEXT_PUBLIC_REALTIME_WS_URL ??
    process.env.NEXT_PUBLIC_WS_URL ??
    "ws://localhost:4000/api/ws",
  /**
   * true → services return data from `services/mock`.
   * Set NEXT_PUBLIC_USE_MOCKS=false once the matching backend endpoint exists.
   */
  useMocks: process.env.NEXT_PUBLIC_USE_MOCKS === "true",
} as const;
