"use client";
import { useParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { env } from "@/config/env";
import { ApiError, http } from "@/services/http";
import { useCurrentUser, loadConversations } from "@/stores/workspace.store";
import { MemberList } from "@/features/members/components/MemberList";
import { UserCard } from "@/features/members/components/UserCard";
import { FriendsPanel } from "@/features/members/components/FriendsPanel";
import { DialogFrame } from "@/components/ui/DialogFrame";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { TypingIndicator } from "./TypingIndicator";
import { ChatInput } from "./ChatInput";
import { VoiceRoom } from "./VoiceRoom";
import type { ChatMessage } from "./MessageItem";

type StoredMessage = ChatMessage & { id: string; createdAt: string };
type Page = { messages: StoredMessage[]; hasMore: boolean };
interface ChatViewProps { serverId?: string; channelId?: string }
export const mergeMessages = (existing: ChatMessage[], incoming: ChatMessage[]) => {
  const byId = new Map(existing.map((item) => [item.id, item]));
  incoming.forEach((item) => byId.set(item.id, item));
  return Array.from(byId.values()).sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime() || String(a.id).localeCompare(String(b.id)));
};
function applyEvent(previous: ChatMessage[], data: any): ChatMessage[] {
  if (data.type === "message_delete" || data.type === "dm_delete") return previous.filter((item) => item.id !== data.messageId).map((item) => item.replyTo && item.replyTo.id === data.messageId ? { ...item, replyTo: { ...item.replyTo, content: "Tin nhắn đã xóa" } } : item);
  if (data.message && typeof data.message.id === "string") return mergeMessages(previous, [data.message]).map((item) => item.replyTo && item.replyTo.id === data.message.id ? { ...item, replyTo: { ...item.replyTo, content: data.message.content } } : item);
  return previous;
}
export function ChatView({ serverId, channelId }: ChatViewProps = {}) {
  const params = useParams();
  const rawServerId = decodeURIComponent(serverId ?? (params?.serverId as string) ?? "@me");
  const rawChannelId = decodeURIComponent(channelId ?? (params?.channelId as string) ?? "general");
  // Reset ngay trong render khi đổi route, tránh hiển thị tên/tin nhắn của kênh cũ.
  return <ChannelChat key={`${rawServerId}:${rawChannelId}`} rawServerId={rawServerId} rawChannelId={rawChannelId} />;
}
function ChannelChat({ rawServerId, rawChannelId }: { rawServerId: string; rawChannelId: string }) {
  const isMe = rawServerId === "@me";
  const friends = isMe && rawChannelId === "friends";
  const user = useCurrentUser();
  const currentUser = user?.displayName || user?.username || "";
  const key = (isMe ? "dm:" : "channel:") + rawChannelId;
  // Request của kênh cũ có thể hoàn thành sau khi đổi route; không ghi vào draft/kênh mới.
  const routeRef = useRef(key); routeRef.current = key;
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [name, setName] = useState("Đang tải...");
  const [channelType, setChannelType] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [olderBusy, setOlderBusy] = useState(false);
  const [status, setStatus] = useState<"connected" | "connecting" | "disconnected">("connecting");
  const [typing, setTyping] = useState<string[]>([]);
  const [showMembers, setShowMembers] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [dialog, setDialog] = useState<{ type: "edit" | "delete"; message: ChatMessage } | null>(null);
  const [edited, setEdited] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [inspected, setInspected] = useState<string | null>(null);
  const [reconnectKey, setReconnectKey] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendingRef = useRef(false);
  const attemptRef = useRef<{ key: string; content: string; replyToId?: string; nonce: string } | null>(null);
  const historyPath = isMe ? "/messages/dm/" + encodeURIComponent(rawChannelId) : "/channels/" + encodeURIComponent(rawChannelId) + "/messages";
  const reconnect = useCallback(() => setReconnectKey((value) => value + 1), []);

  useEffect(() => {
    setMessage(""); setMessages([]); setReplyTo(null); setDialog(null); setError(""); setTyping([]); setHasMore(false); setChannelType(null); setName("Đang tải...");
    if (friends) return;
    let active = true; let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout>; let retries = 0; let version = 0;
    let readTimer: ReturnType<typeof setTimeout>;
    let fetching = false; let buffered: any[] = [];
    const abort = new AbortController();
    const markRead = () => {
      // Coalesce ACK trong 500ms và không đánh dấu đã đọc cho tab đang ẩn.
      if (isMe || document.visibilityState !== "visible") return;
      clearTimeout(readTimer);
      readTimer = setTimeout(() => { void http.post("/channels/" + encodeURIComponent(rawChannelId) + "/read").catch(() => undefined); }, 500);
    };
    const receive = (event: any) => { if (fetching) buffered.push(event); setMessages((previous) => applyEvent(previous, event)); if (!isMe && event.type === "message_create") markRead(); };
    const load = async () => {
      const current = ++version; fetching = true; buffered = [];
      try {
        const page = await http.get<Page>(historyPath, { signal: abort.signal, query: isMe ? { read: document.visibilityState === "visible" ? "true" : "false" } : undefined });
        if (!active || current !== version) return;
        const changes = buffered.slice(); fetching = false;
        // REST là lịch sử gốc; phát lại các sự kiện tới trong lúc chờ để không mất tin mới.
        setMessages((previous) => {
          const first = page.messages[0];
          const older = first && page.hasMore ? previous.filter((item) => new Date(item.createdAt ?? 0).getTime() < new Date(first.createdAt).getTime()) : [];
          return changes.reduce(applyEvent, mergeMessages(older, page.messages));
        });
        setHasMore(page.hasMore); setStatus("connected");
        markRead();
      } catch (reason) { if (active && current === version) { fetching = false; setError(reason instanceof Error ? reason.message : "Không thể tải lịch sử."); } }
    };
    void http.get<any>(isMe ? "/users/" + encodeURIComponent(rawChannelId) : "/channels/" + encodeURIComponent(rawChannelId), { signal: abort.signal })
      .then((result) => { if (active) { setName(isMe ? result.user.displayName || result.user.username : result.channel.name); if (!isMe) setChannelType(result.channel.type); } })
      .catch((reason) => { if (active) setError(reason.message); });
    const userEvent = (event: Event) => {
      const data = (event as CustomEvent).detail;
      if (data.type === "ready" && isMe) void load();
      if (isMe && data.type === "connection") setStatus(data.status);
      if (isMe && data.type?.startsWith("dm_") && (data.senderId === rawChannelId || data.receiverId === rawChannelId)) { receive(data); if (data.type === "dm_create" && document.visibilityState === "visible") void http.get(historyPath, { query: { limit: 1 } }).catch(() => undefined); }
    };
    window.addEventListener("bravechat:realtime", userEvent);
    const visible = () => { if (document.visibilityState === "visible") { if (isMe) void load(); else markRead(); } };
    document.addEventListener("visibilitychange", visible);
    const connect = () => {
      if (!active) return;
      setStatus("connecting"); socket = new WebSocket(env.wsUrl); wsRef.current = socket;
      const currentSocket = socket;
      currentSocket.onopen = () => currentSocket.send(JSON.stringify({ type: "join_channel", channelId: rawChannelId }));
      currentSocket.onmessage = (event) => {
        if (!active) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === "channel_joined") { retries = 0; void load(); }
          else if (data.channelId === rawChannelId && ["message_create", "message_update", "message_delete"].includes(data.type)) receive(data);
          else if (data.type === "typing_start" && data.username !== user?.username) setTyping((previous) => Array.from(new Set([...previous, data.username])));
          else if (data.type === "typing_stop") setTyping((previous) => previous.filter((value) => value !== data.username));
          else if (data.type === "error") setError(data.message);
        } catch { setError("Không đọc được cập nhật từ máy chủ."); }
      };
      currentSocket.onclose = (event) => {
        if (!active) return;
        setStatus("disconnected"); setTyping([]);
        if (event.code === 1008 && event.reason !== "Session expired") { setError("Bạn không còn quyền truy cập kênh này."); return; }
        retryTimer = setTimeout(() => {
          void http.get("/auth/me").then(() => { if (active) connect(); }).catch((reason) => {
            if (!active) return;
            if (reason instanceof ApiError && reason.status === 401) window.location.replace("/login");
            else retryTimer = setTimeout(connect, 5000);
          });
        }, Math.min(1000 * 2 ** retries++, 15000));
      };
      currentSocket.onerror = () => { if (active) setStatus("disconnected"); };
    };
    if (isMe) void load(); else connect();
    return () => { active = false; abort.abort(); clearTimeout(retryTimer); clearTimeout(readTimer); if (typingTimer.current) clearTimeout(typingTimer.current); socket?.close(); wsRef.current = null; window.removeEventListener("bravechat:realtime", userEvent); document.removeEventListener("visibilitychange", visible); };
  }, [key, historyPath, friends, isMe, rawChannelId, reconnectKey, user?.username]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);
  const sendTyping = (type: string) => { if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ type, channelId: rawChannelId })); };
  const handleSend = async (event?: React.FormEvent) => {
    event?.preventDefault(); const content = message.trim();
    if (!content || friends || sendingRef.current) return;
    const replyToId = replyTo ? String(replyTo.id) : undefined;
    // Giữ nonce khi thử lại cùng draft; chỉ xóa draft sau xác nhận đã lưu từ backend.
    if (!attemptRef.current || attemptRef.current.key !== key || attemptRef.current.content !== content || attemptRef.current.replyToId !== replyToId) attemptRef.current = { key, content, replyToId, nonce: crypto.randomUUID() };
    const attempt = attemptRef.current; sendingRef.current = true; setSending(true); setError("");
    try {
      const result = await http.post<{ message: StoredMessage }>(historyPath, { content, replyToId, nonce: attempt.nonce });
      if (routeRef.current === attempt.key) { setMessages((previous) => mergeMessages(previous, [result.message])); setMessage(""); setReplyTo(null); sendTyping("typing_stop"); }
      attemptRef.current = null; if (isMe) void loadConversations(true);
    } catch (reason) { if (routeRef.current === attempt.key) setError("Chưa xác nhận gửi thành công. Nội dung được giữ lại; nhấn Gửi để thử lại. " + (reason instanceof Error ? reason.message : "")); }
    finally { sendingRef.current = false; setSending(false); }
  };
  const handleFiles = async (files: File[]) => {
    if (isMe || sendingRef.current) return;
    sendingRef.current = true; setUploading(true); setError("");
    const savedKey = key; const uploaded: Array<{ filename: string; contentType: string; key: string }> = [];
    try {
      for (const file of files.slice(0, 10)) {
        const form = new FormData(); form.append("purpose", "attachment"); form.append("channelId", rawChannelId); form.append("file", file, file.name);
        const response = await fetch(env.apiUrl.replace(/\/$/, "") + "/uploads", { method: "POST", credentials: "include", body: form });
        const result = await response.json(); if (!response.ok) throw new Error(result.message || "Không thể tải tệp.");
        uploaded.push(result.data);
      }
      const result = await http.post<{ message: StoredMessage }>(historyPath, { content: message.trim(), attachments: uploaded, replyToId: replyTo ? String(replyTo.id) : undefined });
      if (routeRef.current === savedKey) { setMessages((previous) => mergeMessages(previous, [result.message])); setMessage(""); setReplyTo(null); }
    } catch (reason) { await Promise.all(uploaded.map(({ key: pending }) => http.delete("/uploads/pending", { body: { key: pending } }).catch(() => undefined))); if (routeRef.current === savedKey) setError(reason instanceof Error ? reason.message : "Không thể tải tệp."); }
    finally { sendingRef.current = false; setUploading(false); }
  };
  const loadOlder = async () => {
    if (!messages[0] || olderBusy) return;
    const savedKey = key; setOlderBusy(true);
    try { const page = await http.get<Page>(historyPath, { query: { before: String(messages[0].id), limit: 50 } }); if (routeRef.current === savedKey) { setMessages((previous) => mergeMessages(previous, page.messages)); setHasMore(page.hasMore); } }
    catch (reason) { if (routeRef.current === savedKey) setError(reason instanceof Error ? reason.message : "Không thể tải tin nhắn cũ."); }
    finally { setOlderBusy(false); }
  };
  const actionPath = (item: ChatMessage) => isMe ? "/messages/dm/" + encodeURIComponent(rawChannelId) + "/" + encodeURIComponent(String(item.id)) : "/messages/" + encodeURIComponent(String(item.id));
  const reaction = async (item: ChatMessage, emoji: string, remove: boolean) => {
    const savedKey = key; setError("");
    try {
      const path = actionPath(item) + "/reactions";
      const result = remove ? await http.delete<{ message: StoredMessage }>(path + "/" + encodeURIComponent(emoji)) : await http.post<{ message: StoredMessage }>(path, { emoji });
      if (routeRef.current === savedKey) setMessages((previous) => applyEvent(previous, { message: result.message }));
    } catch (reason) { if (routeRef.current === savedKey) setError(reason instanceof Error ? reason.message : "Không thể cập nhật emoji."); }
  };
  const submitAction = async (event: React.FormEvent) => {
    event.preventDefault(); if (!dialog || actionBusy) return;
    const savedKey = key; setActionBusy(true); setError("");
    try {
      if (dialog.type === "edit") {
        const result = await http.patch<{ message: StoredMessage }>(actionPath(dialog.message), { content: edited });
        if (routeRef.current === savedKey) setMessages((previous) => applyEvent(previous, { message: result.message }));
      } else {
        await http.delete(actionPath(dialog.message));
        if (routeRef.current === savedKey) setMessages((previous) => applyEvent(previous, { type: "message_delete", messageId: dialog.message.id }));
      }
      if (routeRef.current === savedKey) setDialog(null);
    } catch (reason) { if (routeRef.current === savedKey) setError(reason instanceof Error ? reason.message : "Không thể cập nhật tin nhắn."); }
    finally { setActionBusy(false); }
  };
  if (friends) return <FriendsPanel />;
  return <div className="flex-1 flex min-w-0 h-full overflow-hidden bg-ocean-dark-bg" data-testid="chat-view">
    <main className="flex-1 flex flex-col min-w-0 h-full relative">
      <ChatHeader channelName={name} isMe={isMe} isChannelTopic={!isMe} currentUser={currentUser} connectionStatus={status} showMemberList={showMembers} onChangeUsername={() => { if (user) setInspected(user.id); }} onReconnectWs={reconnect} onToggleMemberList={() => setShowMembers((value) => !value)} />
      {(channelType === "VOICE" || channelType === "VIDEO") && <VoiceRoom channelId={rawChannelId} channelType={channelType} />}
      <MessageList ref={bottomRef} channelName={name} messages={messages} currentUser={currentUser} currentUserId={user?.id} hasOlder={hasMore} isLoadingOlder={olderBusy} onLoadOlder={loadOlder}
        onReply={setReplyTo} onReaction={(item, emoji, remove) => void reaction(item, emoji, remove)} onEdit={(item) => { setEdited(item.content); setDialog({ type: "edit", message: item }); }} onDelete={(item) => setDialog({ type: "delete", message: item })} onInspect={setInspected} />
      <TypingIndicator typingUsers={typing} />
      {replyTo && <div className="mx-6 mb-2 flex justify-between gap-3 rounded border border-ocean-dark-border px-3 py-2 text-xs text-ocean-light/70"><span className="truncate">Trả lời {replyTo.user}: {replyTo.content}</span><button aria-label="Hủy trả lời" onClick={() => setReplyTo(null)}>✕</button></div>}
      <ChatInput value={message} placeholder={isMe ? "Nhắn tin tới " + name : "Nhắn tin tới #" + name} onChange={(event) => { setMessage(event.target.value); sendTyping("typing_start"); if (typingTimer.current) clearTimeout(typingTimer.current); typingTimer.current = setTimeout(() => sendTyping("typing_stop"), 1500); }} onSubmit={handleSend} onFiles={isMe ? undefined : handleFiles} isUploading={uploading} isSending={sending} />
      {sending && <p role="status" className="px-6 pb-2 text-xs text-ocean-light/60">Đang gửi...</p>}
      {error && <p role="alert" className="px-6 pb-2 text-xs text-rose-300">{error}</p>}
    </main>
    {!isMe && <MemberList isVisible={showMembers} serverId={rawServerId} />}
    {inspected && <UserCard userId={inspected} onClose={() => setInspected(null)} />}
    {dialog && <DialogFrame title={dialog.type === "edit" ? "Sửa tin nhắn" : "Xóa tin nhắn"} onClose={() => { if (!actionBusy) setDialog(null); }}><form onSubmit={submitAction} className="space-y-4">{dialog.type === "edit" ? <label className="block text-sm">Nội dung<textarea autoFocus className="input-ocean mt-2 w-full" value={edited} required maxLength={2000} onChange={(event) => setEdited(event.target.value)} /></label> : <p>Bạn muốn xóa tin nhắn này?</p>}<div className="flex justify-end gap-2"><button type="button" disabled={actionBusy} className="btn-secondary" onClick={() => setDialog(null)}>Hủy</button><button className="btn-primary" disabled={actionBusy || dialog.type === "edit" && !edited.trim()}>{actionBusy ? "Đang lưu..." : "Xác nhận"}</button></div></form></DialogFrame>}
  </div>;
}
export const ChatArea = ChatView;
