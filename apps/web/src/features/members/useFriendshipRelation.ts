"use client";

import { useCallback, useEffect, useState } from "react";
import type { FriendLists, FriendshipEntry } from "@discord-clone/shared";
import { friendAdapter } from "@/services/adapters";

export type RelationKind = "none" | "friends" | "incoming" | "outgoing" | "blocked";

export interface FriendshipRelation {
  kind: RelationKind;
  entry: FriendshipEntry | null;
}

const SYNC_EVENT = "bravechat:friends-sync";
const EMPTY_LISTS: FriendLists = {
  friends: [],
  incoming: [],
  outgoing: [],
  blocked: [],
};

export function resolveFriendshipRelation(
  lists: FriendLists,
  targetUserId?: string
): FriendshipRelation {
  if (!targetUserId) return { kind: "none", entry: null };
  const blocked = lists.blocked.find((item) => item.user.id === targetUserId);
  if (blocked) return { kind: "blocked", entry: blocked };
  const friend = lists.friends.find((item) => item.user.id === targetUserId);
  if (friend) return { kind: "friends", entry: friend };
  const incoming = lists.incoming.find((item) => item.user.id === targetUserId);
  if (incoming) return { kind: "incoming", entry: incoming };
  const outgoing = lists.outgoing.find((item) => item.user.id === targetUserId);
  if (outgoing) return { kind: "outgoing", entry: outgoing };
  return { kind: "none", entry: null };
}

export function emitFriendsSync() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SYNC_EVENT));
  }
}

export function useFriendshipRelation(targetUserId?: string) {
  const [lists, setLists] = useState<FriendLists>(EMPTY_LISTS);
  const [loading, setLoading] = useState(Boolean(targetUserId));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    if (!targetUserId) return;
    try {
      const next = await friendAdapter.listAll();
      setLists(next);
    } catch {
      // ignore background fetch errors until explicit action
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void refresh();
    const onRealtime = (event: Event) => {
      if ((event as CustomEvent<{ type?: string }>).detail?.type === "friends_update") {
        void refresh();
      }
    };
    const onSync = () => void refresh();
    window.addEventListener("bravechat:realtime", onRealtime);
    window.addEventListener(SYNC_EVENT, onSync);
    return () => {
      window.removeEventListener("bravechat:realtime", onRealtime);
      window.removeEventListener(SYNC_EVENT, onSync);
    };
  }, [targetUserId, refresh]);

  const runAction = async (work: () => Promise<unknown>, successMessage: string) => {
    if (busy) return false;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await work();
      await refresh();
      emitFriendsSync();
      setNotice(successMessage);
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể thực hiện thao tác.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const relation = resolveFriendshipRelation(lists, targetUserId);

  const sendFriendRequest = (username: string) =>
    runAction(
      () => friendAdapter.sendRequest(username),
      "Đã gửi lời mời kết bạn."
    );

  const acceptFriendRequest = () => {
    if (relation.kind !== "incoming" || !relation.entry) return Promise.resolve(false);
    const entryId = relation.entry.id;
    return runAction(
      () => friendAdapter.respondRequest(entryId, "accept"),
      "Đã chấp nhận lời mời kết bạn."
    );
  };

  const rejectFriendRequest = () => {
    if (relation.kind !== "incoming" || !relation.entry) return Promise.resolve(false);
    const entryId = relation.entry.id;
    return runAction(
      () => friendAdapter.respondRequest(entryId, "reject"),
      "Đã từ chối lời mời kết bạn."
    );
  };

  const removeFriendship = (successMessage = "Đã cập nhật danh sách bạn bè.") => {
    if (!relation.entry) return Promise.resolve(false);
    const entryId = relation.entry.id;
    return runAction(
      () => friendAdapter.removeOrUnblock(entryId),
      successMessage
    );
  };

  const blockUser = () => {
    if (!targetUserId) return Promise.resolve(false);
    return runAction(
      () => friendAdapter.blockUser(targetUserId),
      "Đã chặn người dùng."
    );
  };

  const unblockUser = () => removeFriendship("Đã bỏ chặn người dùng.");

  return {
    relation,
    loading,
    busy,
    error,
    notice,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriendship,
    blockUser,
    unblockUser,
  };
}
