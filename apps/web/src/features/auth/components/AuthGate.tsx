"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/services/http";
import { userService } from "@/services/user.service";
import { workspaceStore } from "@/stores/workspace.store";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setError("");
    userService.getCurrentUser().then((currentUser) => {
      if (active) { workspaceStore.set({ currentUser }); setReady(true); }
    }).catch((reason) => {
      if (!active) return;
      if (reason instanceof ApiError && reason.status === 401) window.location.replace("/login");
      else setError("Không thể kết nối máy chủ. Kiểm tra API và database rồi thử lại.");
    });
    return () => { active = false; };
  }, [retry]);
  if (!ready) return <main className="h-screen bg-ocean-dark-bg text-ocean-light flex flex-col gap-4 items-center justify-center"><p role={error ? "alert" : "status"}>{error || "Đang kiểm tra phiên đăng nhập..."}</p>{error ? <button onClick={() => setRetry((value) => value + 1)} className="btn-primary">Thử lại</button> : null}</main>;
  return <>{children}</>;
}
