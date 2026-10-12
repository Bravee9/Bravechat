import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemberItem, type Member } from "@/features/members/components/MemberItem";
import { MemberGroup } from "@/features/members/components/MemberGroup";
import { MemberList } from "@/features/members/components/MemberList";

describe("MemberList Components", () => {
  describe("MemberItem", () => {
    it("renders member with bot badge and role color", () => {
      const botMember: Member = {
        id: "m_bot",
        name: "Antigravity",
        role: "BOT",
        status: "ONLINE",
        customStatus: "AI Assistant",
      };

      render(<MemberItem member={botMember} />);

      expect(screen.getByText("Antigravity")).toBeInTheDocument();
      expect(screen.getByTestId("bot-badge")).toBeInTheDocument();
      expect(screen.getByText("AI Assistant")).toBeInTheDocument();
      expect(screen.getByTestId("member-presence-ONLINE")).toHaveClass("bg-emerald-500");
    });
  });

  describe("MemberGroup", () => {
    it("renders group title and count", () => {
      const members: Member[] = [
        { id: "1", name: "Bravee9", role: "OWNER", status: "ONLINE" },
        { id: "2", name: "Shuji", role: "ADMIN", status: "IDLE" },
      ];

      render(<MemberGroup title="Trực tuyến" members={members} />);

      expect(screen.getByText("Trực tuyến — 2")).toBeInTheDocument();
      expect(screen.getByText("Bravee9")).toBeInTheDocument();
      expect(screen.getByText("Shuji")).toBeInTheDocument();
    });
  });

  describe("MemberList", () => {
    it("renders member list when visible and returns null when hidden", () => {
      const { rerender } = render(<MemberList isVisible={true} />);
      expect(screen.getByTestId("member-list")).toBeInTheDocument();

      rerender(<MemberList isVisible={false} />);
      expect(screen.queryByTestId("member-list")).not.toBeInTheDocument();
    });
  });
});
