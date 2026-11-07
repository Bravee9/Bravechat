import React from "react";
import { render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Analytics } from "@/components/consent/Analytics";
declare global { interface Window { gtag?: (...args: unknown[]) => void } }

vi.mock("@/lib/site", () => ({ GA_MEASUREMENT_ID: "G-TEST", CONSENT_STORAGE_KEY: "consent" }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/reset-password",
  useSearchParams: () => new URLSearchParams({ token: "fake-secret-reset-token" }),
}));
vi.mock("next/script", () => ({ default: (props: React.ScriptHTMLAttributes<HTMLScriptElement>) => <script {...props} /> }));
afterEach(() => { localStorage.clear(); delete window.gtag; });

it("never loads browser analytics or emits reset URLs, even after consent", () => {
  localStorage.setItem("consent", "granted");
  window.gtag = vi.fn();
  const { container } = render(<Analytics />);
  expect(container.querySelectorAll("script")).toHaveLength(0);
  expect(window.gtag).not.toHaveBeenCalled();
});
