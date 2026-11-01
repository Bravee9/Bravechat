import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/config/env", () => ({ env: { apiUrl: "http://localhost:4000/api" } }));
const response = (status: number) => ({ status, ok: status === 200, json: async () => ({ data: { ok: true } }) }) as Response;
afterEach(() => { vi.unstubAllGlobals(); });

describe("Session refresh coordination", () => {
  it("retries a late 401 with the refreshed cookie instead of rotating again", async () => {
    vi.resetModules();
    const { http } = await import("@/services/http");
    let late!: (value: Response) => void;
    let calls = 0;
    const fetcher = vi.fn((url: string) => {
      if (url.endsWith("/auth/refresh")) return Promise.resolve(response(200));
      calls++;
      if (calls === 1) return Promise.resolve(response(401));
      if (calls === 2) return new Promise<Response>(resolve => { late = resolve; });
      return Promise.resolve(response(200));
    });
    vi.stubGlobal("fetch", fetcher);
    const first = http.get("/first");
    const second = http.get("/second");
    await first;
    late(response(401));
    await second;
    expect(fetcher.mock.calls.filter(([url]) => url.endsWith("/auth/refresh"))).toHaveLength(1);
    expect(calls).toBe(4);
  });

  it("waits for an active refresh before sending a new protected request", async () => {
    vi.resetModules();
    const { http } = await import("@/services/http");
    let refresh!: (value: Response) => void;
    let started!: () => void;
    const refreshing = new Promise<void>(resolve => { started = resolve; });
    let first = true;
    const fetcher = vi.fn((url: string) => {
      if (url.endsWith("/auth/refresh")) { started(); return new Promise<Response>(resolve => { refresh = resolve; }); }
      if (first) { first = false; return Promise.resolve(response(401)); }
      return Promise.resolve(response(200));
    });
    vi.stubGlobal("fetch", fetcher);
    const initial = http.get("/first");
    await refreshing;
    const next = http.get("/next");
    expect(fetcher.mock.calls.some(([url]) => url.endsWith("/next"))).toBe(false);
    refresh(response(200));
    await Promise.all([initial, next]);
    expect(fetcher.mock.calls.filter(([url]) => url.endsWith("/auth/refresh"))).toHaveLength(1);
  });
});
