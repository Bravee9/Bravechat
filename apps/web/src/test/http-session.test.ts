import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/config/env", () => ({ env: { apiUrl: "http://localhost:4000/api" } }));
const response = (status: number) => ({ status, ok: status === 200, json: async () => ({ data: { ok: true } }) }) as Response;
afterEach(() => { vi.unstubAllGlobals(); });

describe("Session refresh coordination", () => {
  it("refreshes an expired session and retries the complete multipart upload", async () => {
    vi.resetModules();
    const { http } = await import("@/services/http");
    const form = new FormData();
    form.append("file", new File(["attachment"], "note.txt", { type: "text/plain" }));
    let uploads = 0;
    const fetcher = vi.fn((url: string) => {
      if (url.endsWith("/auth/refresh")) return Promise.resolve(response(200));
      return Promise.resolve(response(++uploads === 1 ? 401 : 200));
    });
    vi.stubGlobal("fetch", fetcher);
    await http.post("/uploads", form);
    const uploadCalls = fetcher.mock.calls.filter(([url]) => url.endsWith("/uploads"));
    expect(uploadCalls).toHaveLength(2);
    for (const call of uploadCalls) {
      const init = (call as unknown as [string, RequestInit])[1];
      expect(init.body).toBe(form);
      expect(new Headers(init.headers).has("Content-Type")).toBe(false);
      expect(init.credentials).toBe("include");
    }
    expect(fetcher.mock.calls.filter(([url]) => url.endsWith("/auth/refresh"))).toHaveLength(1);
  });

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
