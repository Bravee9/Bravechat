import React from "react";
import { act, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import {
  WorkspaceRealtime,
  hasActiveWorkspaceRealtime,
  joinWorkspaceRealtimeChannel,
  leaveWorkspaceRealtimeChannel,
} from "@/stores/WorkspaceRealtime";

vi.mock("next/navigation", () => ({ usePathname: () => "/channels/@me" }));
vi.mock("@/config/env", () => ({ env: { wsUrl: "ws://localhost/api/ws", useMocks: false } }));
vi.mock("@/stores/workspace.store", () => ({
  useServers: () => Array.from({ length: 50 }, (_, i) => ({ id: `server-${i}` })),
  useCurrentUser: () => ({ id: "u", username: "alice" }),
  loadConversations: vi.fn(), loadServers: vi.fn(), loadCurrentUser: vi.fn(),
  loadServerDetail: vi.fn(), markChannelRead: vi.fn(), applyChannelActivity: vi.fn(),
}));

class Socket {
  static current: Socket;
  onopen?: () => void;
  onmessage?: (event: { data: string }) => void;
  onclose?: () => void;
  sent: Array<{ type: string; serverId?: string; channelId?: string }> = [];
  readyState = 1;
  constructor() { Socket.current = this; }
  send(raw: string) { this.sent.push(JSON.parse(raw)); }
  close() {}
}

afterEach(() => vi.unstubAllGlobals());

it("subscribes to 50 servers one at a time, skips unavailable membership, and resubscribes on reconnect", () => {
  vi.stubGlobal("WebSocket", Socket);
  const view = render(<WorkspaceRealtime />);
  const socket = Socket.current;
  act(() => socket.onopen?.());
  expect(socket.sent).toHaveLength(1);
  for (let i = 0; i < 50; i++) {
    const { serverId } = socket.sent[i];
    act(() => socket.onmessage?.({ data: JSON.stringify({ type: i === 5 ? "server_unavailable" : "server_joined", serverId }) }));
    expect(socket.sent).toHaveLength(Math.min(i + 2, 50));
  }
  expect(new Set(socket.sent.map((event) => event.serverId)).size).toBe(50);
  act(() => socket.onopen?.());
  expect(socket.sent).toHaveLength(51);
  expect(socket.sent[50]).toEqual(socket.sent[0]);
  view.unmount();
});

it("multiplexes channel join and leave frames over the single shared workspace socket and rejoins active channel on reconnect", () => {
  vi.stubGlobal("WebSocket", Socket);
  const view = render(<WorkspaceRealtime />);
  const socket = Socket.current;
  expect(hasActiveWorkspaceRealtime()).toBe(true);
  act(() => socket.onopen?.());

  act(() => joinWorkspaceRealtimeChannel("ch-general"));
  expect(socket.sent[socket.sent.length - 1]).toEqual({
    type: "join_channel",
    channelId: "ch-general",
  });

  // Reconnect automatically re-subscribes to the active channel
  act(() => socket.onopen?.());
  expect(
    socket.sent.some(
      (f, idx) => idx > 1 && f.type === "join_channel" && f.channelId === "ch-general"
    )
  ).toBe(true);

  act(() => leaveWorkspaceRealtimeChannel("ch-general"));
  expect(socket.sent[socket.sent.length - 1]).toEqual({
    type: "leave_channel",
    channelId: "ch-general",
  });

  view.unmount();
  expect(hasActiveWorkspaceRealtime()).toBe(false);
});
