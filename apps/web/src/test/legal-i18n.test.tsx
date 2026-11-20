import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LegalLayout } from "@/components/marketing/legal/LegalLayout";

vi.mock("next/navigation", () => ({
  usePathname: () => "/cookies",
}));

describe("LegalLayout multi-language pack & dropdown selector", () => {
  it("renders pure Vietnamese content by default and switches cleanly across en, zh, ko, ja via select dropdown", () => {
    render(<LegalLayout pageKey="cookies" />);

    // Default: Vietnamese (no mixed bilingual slashes like "Loại / Type")
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Chính sách Cookie"
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "1. Cookie là gì?" })
    ).toBeInTheDocument();
    expect(screen.queryByText(/Loại \/ Type/i)).not.toBeInTheDocument();

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.options.length).toBe(5);

    // Switch to English -> content stays visible and translates completely
    fireEvent.change(select, { target: { value: "en" } });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Cookie Policy"
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "1. What Are Cookies?" })
    ).toBeInTheDocument();
    expect(screen.getByText("Strictly Necessary")).toBeInTheDocument();

    // Switch to Chinese
    fireEvent.change(select, { target: { value: "zh" } });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Cookie 政策"
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "1. 什么是 Cookie？" })
    ).toBeInTheDocument();

    // Switch to Korean
    fireEvent.change(select, { target: { value: "ko" } });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "쿠키 정책"
    );

    // Switch to Japanese
    fireEvent.change(select, { target: { value: "ja" } });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "クッキーポリシー"
    );
  });
});
