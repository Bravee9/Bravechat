import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ServerHeader } from "@/features/channels/components/ServerHeader";
import { ChannelItem } from "@/features/channels/components/ChannelItem";
import { CategorySection } from "@/features/channels/components/CategorySection";
import { DirectMessageItem } from "@/features/channels/components/DirectMessageItem";
import { UserProfileBar } from "@/features/channels/components/UserProfileBar";
import type { Channel, ChannelCategory, CurrentUser, DirectConversation } from "@discord-clone/shared";

describe("Channel Sidebar Components", () => {
  describe("ServerHeader", () => {
    it("renders server name and toggles dropdown menu", () => {
      const onToggle = vi.fn();
      const onClose = vi.fn();

      const { rerender } = render(
        <ServerHeader
          serverName="Bravechat HQ"
          isMe={false}
          isOpen={false}
          onToggle={onToggle}
          onClose={onClose}
        />
      );

      expect(screen.getByText("Bravechat HQ")).toBeInTheDocument();
      expect(screen.queryByTestId("server-dropdown-menu")).not.toBeInTheDocument();

      const button = screen.getByTestId("server-header-btn");
      fireEvent.click(button);
      expect(onToggle).toHaveBeenCalledTimes(1);

      // Khi isOpen = true
      rerender(
        <ServerHeader
          serverName="Bravechat HQ"
          isMe={false}
          isOpen={true}
          onToggle={onToggle}
          onClose={onClose}
        />
      );

      expect(screen.getByTestId("server-dropdown-menu")).toBeInTheDocument();
      expect(screen.getByText("Cài đặt máy chủ")).toBeInTheDocument();
    });
  });

  describe("ChannelItem", () => {
    const mockChannel: Channel = {
      id: "ch_general",
      serverId: "srv_1",
      categoryId: "cat_1",
      name: "general",
      type: "TEXT",
      topic: "General chat",
      position: 0,
      hasUnread: false,
      mentionCount: 3,
    };

    it("renders text channel with # and mention badge", () => {
      render(
        <ChannelItem channel={mockChannel} serverId="srv_1" isActive={true} />
      );

      expect(screen.getByText("general")).toBeInTheDocument();
      expect(screen.getByText("#")).toBeInTheDocument();

      const badge = screen.getByTestId("channel-mention-ch_general");
      expect(badge).toHaveTextContent("3");

      const link = screen.getByTestId("channel-item-ch_general");
      expect(link).toHaveAttribute("href", "/channels/srv_1/ch_general");
    });
  });

  describe("CategorySection", () => {
    const mockCategory: ChannelCategory = {
      id: "cat_text",
      serverId: "srv_1",
      name: "KÊNH CHAT",
      position: 0,
    };

    const mockChannels: Channel[] = [
      {
        id: "ch_1",
        serverId: "srv_1",
        categoryId: "cat_text",
        name: "general",
        type: "TEXT",
        topic: null,
        position: 0,
        hasUnread: false,
        mentionCount: 0,
      },
      {
        id: "ch_2",
        serverId: "srv_1",
        categoryId: "cat_text",
        name: "dev-room",
        type: "TEXT",
        topic: null,
        position: 1,
        hasUnread: false,
        mentionCount: 0,
      },
    ];

    it("renders category name and toggles collapse state", () => {
      render(
        <CategorySection
          category={mockCategory}
          channels={mockChannels}
          serverId="srv_1"
          currentChannelId="ch_1"
        />
      );

      expect(screen.getByText("KÊNH CHAT")).toBeInTheDocument();
      expect(screen.getByText("general")).toBeInTheDocument();
      expect(screen.getByText("dev-room")).toBeInTheDocument();

      // Click to collapse
      const toggle = screen.getByTestId("category-toggle-cat_text");
      fireEvent.click(toggle);

      expect(screen.queryByText("general")).not.toBeInTheDocument();
    });
  });

  describe("DirectMessageItem", () => {
    const mockDM: DirectConversation = {
      id: "dm_shuji",
      recipient: {
        id: "user_shuji",
        username: "shuji",
        displayName: "Shuji",
        avatarUrl: null,
        status: "ONLINE",
      },
      lastMessageAt: new Date().toISOString(),
      hasUnread: true,
    };

    it("renders DM friend with presence badge and unread dot", () => {
      render(<DirectMessageItem conversation={mockDM} isActive={false} />);

      expect(screen.getByText("Shuji")).toBeInTheDocument();
      expect(screen.getByTestId("dm-status-ONLINE")).toHaveClass("bg-emerald-500");
      expect(screen.getByTestId("dm-unread-dot")).toBeInTheDocument();
    });
  });

  describe("UserProfileBar", () => {
    const mockUser: CurrentUser = {
      id: "u_me",
      username: "bravee9",
      displayName: "Bravee9",
      discriminator: "0001",
      email: "bravee9@test.com",
      avatarUrl: null,
      status: "ONLINE",
      customStatus: "Coding",
    };

    it("renders user information and toggles mic/audio buttons", () => {
      render(<UserProfileBar currentUser={mockUser} />);

      expect(screen.getByText("Bravee9")).toBeInTheDocument();
      expect(screen.getByText("#0001")).toBeInTheDocument();

      const micBtn = screen.getByTestId("mute-mic-btn");
      fireEvent.click(micBtn);
      expect(micBtn).toHaveClass("text-rose-400");

      const audioBtn = screen.getByTestId("deafen-audio-btn");
      fireEvent.click(audioBtn);
      expect(audioBtn).toHaveClass("text-rose-400");
    });
  });
});
