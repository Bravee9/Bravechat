import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChatHeader } from "@/features/messages/components/ChatHeader";
import { MessageItem, type ChatMessage } from "@/features/messages/components/MessageItem";
import { TypingIndicator } from "@/features/messages/components/TypingIndicator";
import { ChatInput } from "@/features/messages/components/ChatInput";

describe("Message Components", () => {
  describe("ChatHeader", () => {
    it("renders channel title, status badge, and handles member list toggle", () => {
      const onChangeUsername = vi.fn();
      const onReconnectWs = vi.fn();
      const onToggleMemberList = vi.fn();

      render(
        <ChatHeader
          channelName="general"
          isMe={false}
          isChannelTopic={true}
          currentUser="Bravee9"
          connectionStatus="connected"
          showMemberList={true}
          onChangeUsername={onChangeUsername}
          onReconnectWs={onReconnectWs}
          onToggleMemberList={onToggleMemberList}
        />
      );

      expect(screen.getByText("general")).toBeInTheDocument();
      expect(screen.getByText("Live")).toBeInTheDocument();
      expect(screen.getByText("Bravee9")).toBeInTheDocument();

      const toggleBtn = screen.getByTestId("toggle-member-list-btn");
      fireEvent.click(toggleBtn);
      expect(onToggleMemberList).toHaveBeenCalledTimes(1);

      const usernameBtn = screen.getByTestId("change-username-btn");
      fireEvent.click(usernameBtn);
      expect(onChangeUsername).toHaveBeenCalledTimes(1);
    });
  });

  describe("MessageItem", () => {
    const mockMessage: ChatMessage = {
      id: "msg_1",
      avatar: "B9",
      user: "Bravee9",
      time: "10:30",
      content: "Xin chào thế giới!",
      isHighlighted: true,
    };

    it("renders message with content, user, and highlight border", () => {
      render(<MessageItem message={mockMessage} isCurrentUser={true} />);

      expect(screen.getByText("Bravee9")).toBeInTheDocument();
      expect(screen.getByText("Bạn")).toBeInTheDocument();
      expect(screen.getByText("Xin chào thế giới!")).toBeInTheDocument();
      expect(screen.getByText("10:30")).toBeInTheDocument();

      const container = screen.getByTestId("chat-message-msg_1");
      expect(container).toHaveClass("border-l-2");
    });
  });

  describe("TypingIndicator", () => {
    it("renders typing text when users are typing", () => {
      render(<TypingIndicator typingUsers={["Shuji", "Châu"]} />);
      expect(screen.getByTestId("typing-indicator")).toHaveTextContent("Shuji, Châu đang gõ tin nhắn...");
    });

    it("renders nothing when no one is typing", () => {
      const { container } = render(<TypingIndicator typingUsers={[]} />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("ChatInput", () => {
    it("handles input change and submit", () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn((e) => e?.preventDefault());

      const { rerender } = render(
        <ChatInput
          value=""
          placeholder="Nhắn tin..."
          onChange={onChange}
          onSubmit={onSubmit}
        />
      );

      const input = screen.getByTestId("chat-input-field");
      expect(input).toHaveAttribute("placeholder", "Nhắn tin...");

      const sendBtn = screen.getByTestId("send-message-btn");
      expect(sendBtn).toBeDisabled();

      // Khi có chữ
      rerender(
        <ChatInput
          value="Xin chào"
          placeholder="Nhắn tin..."
          onChange={onChange}
          onSubmit={onSubmit}
        />
      );

      expect(sendBtn).not.toBeDisabled();
      fireEvent.click(sendBtn);
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });
});
