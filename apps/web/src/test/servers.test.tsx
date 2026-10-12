import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HomeRailItem } from "@/features/servers/components/HomeRailItem";
import { ServerRailItem } from "@/features/servers/components/ServerRailItem";
import { RailActionItem } from "@/features/servers/components/RailActionItem";
import { RailSeparator } from "@/features/servers/components/RailSeparator";
import type { ServerListItem } from "@discord-clone/shared";

describe("ServerRail Components", () => {
  describe("HomeRailItem", () => {
    it("renders home rail item and shows active pill when active", () => {
      const onHover = vi.fn();
      render(<HomeRailItem isActive={true} isHovered={false} onHover={onHover} />);

      const pill = screen.getByTestId("home-rail-pill");
      expect(pill).toHaveClass("h-10");
      expect(pill).toHaveClass("opacity-100");

      const icon = screen.getByTestId("home-discord-icon");
      expect(icon).toBeInTheDocument();
    });

    it("triggers onHover callback on mouse enter and leave", () => {
      const onHover = vi.fn();
      render(<HomeRailItem isActive={false} isHovered={true} onHover={onHover} />);

      const container = screen.getByTestId("home-rail-item");
      fireEvent.mouseEnter(container);
      expect(onHover).toHaveBeenCalledWith(true);

      fireEvent.mouseLeave(container);
      expect(onHover).toHaveBeenCalledWith(false);
    });
  });

  describe("ServerRailItem", () => {
    const mockServer: ServerListItem = {
      id: "srv_1",
      name: "Bravechat HQ",
      iconUrl: null,
      hasUnread: true,
      mentionCount: 5,
    };

    it("renders server item with initials and mention badge", () => {
      const onHover = vi.fn();
      render(
        <ServerRailItem
          server={mockServer}
          isActive={false}
          isHovered={false}
          onHover={onHover}
        />
      );

      // Initials: BH
      expect(screen.getByText("BH")).toBeInTheDocument();

      // Mention badge
      const badge = screen.getByTestId("server-badge-srv_1");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent("5");

      // Unread pill: h-2
      const pill = screen.getByTestId("server-pill-srv_1");
      expect(pill).toHaveClass("h-2");
    });

    it("renders active pill when server is active", () => {
      const onHover = vi.fn();
      render(
        <ServerRailItem
          server={mockServer}
          isActive={true}
          isHovered={false}
          onHover={onHover}
        />
      );

      const pill = screen.getByTestId("server-pill-srv_1");
      expect(pill).toHaveClass("h-10");
    });
  });

  describe("RailActionItem", () => {
    it("renders button and handles onClick", () => {
      const onClick = vi.fn();
      const onHover = vi.fn();

      render(
        <RailActionItem
          id="test-action"
          tooltip="Thêm máy chủ"
          ariaLabel="Add server"
          isHovered={false}
          onHover={onHover}
          onClick={onClick}
          variant="emerald"
        >
          <span data-testid="action-icon">+</span>
        </RailActionItem>
      );

      const button = screen.getByRole("button", { name: "Add server" });
      expect(button).toBeInTheDocument();

      fireEvent.click(button);
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("RailSeparator", () => {
    it("renders separator correctly", () => {
      render(<RailSeparator />);
      expect(screen.getByRole("separator")).toBeInTheDocument();
    });
  });
});
