/**
 * config/env.ts — typed access to public env vars. Import this, never `process.env` directly.
 */

export const env = {
  /** REST base, already includes the `/api` prefix. */
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
  wsUrl: process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000/api/ws",
  /**
   * true → services return data from `services/mock`.
   * Set NEXT_PUBLIC_USE_MOCKS=false once the matching backend endpoint exists.
   */
  useMocks: process.env.NEXT_PUBLIC_USE_MOCKS === "true",
} as const;
