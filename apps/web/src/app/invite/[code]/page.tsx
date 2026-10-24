"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { API_ROUTES } from "@discord-clone/shared";
import { ApiError, http } from "@/services/http";
import { loadServers } from "@/stores/workspace.store";

export default function InvitePage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const [requiresLogin, setRequiresLogin] = useState(false);

  async function join() {
    setJoining(true); setError("");
    setRequiresLogin(false);
    try {
      const { serverId } = await http.post<{ serverId: string }>(API_ROUTES.invites.join(params.code));
      await loadServers(true);
      router.replace(`/channels/${encodeURIComponent(serverId)}`);
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) setRequiresLogin(true);
      setError(reason instanceof Error ? reason.message : "Không thể tham gia máy chủ.");
    } finally { setJoining(false); }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ocean-dark-bg p-4 text-ocean-light">
      <section className="w-full max-w-md border border-ocean-dark-border bg-[#061829] p-6">
        <h1 className="text-xl font-semibold">Lời mời tham gia máy chủ</h1>
        <p className="mt-2 text-sm text-ocean-light/65">Xác nhận để tham gia. Mã mời có thể hết hạn hoặc đã đạt giới hạn sử dụng.</p>
        {error ? <p role="alert" className="mt-4 text-sm text-rose-300">{error}</p> : null}
        {requiresLogin ? <Link href="/login" className="mt-3 inline-block text-sm text-ocean-secondary underline">Đăng nhập rồi mở lại liên kết này</Link> : null}
        <button type="button" disabled={joining} onClick={() => void join()} className="btn-primary mt-6 w-full disabled:opacity-60">{joining ? "Đang tham gia…" : "Tham gia máy chủ"}</button>
      </section>
    </main>
  );
}
