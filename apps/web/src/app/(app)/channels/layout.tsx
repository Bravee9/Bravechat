import { ServerRail } from "@/features/servers/components/ServerRail";
import { PersistentUserBar } from "@/features/channels/components/PersistentUserBar";
import { ServerWorkspaceModal } from "@/features/servers/components/ServerWorkspaceModal";
import { WorkspaceBootstrap } from "@/stores/WorkspaceBootstrap";
import { WorkspaceRealtime } from "@/stores/WorkspaceRealtime";
import { AuthGate } from "@/features/auth/components/AuthGate";

/**
 * LAYER 1 — Persistent shell. Không bao giờ unmount khi chuyển server/kênh:
 *  - WorkspaceBootstrap: tải servers / DMs / current user một lần vào store.
 *  - ServerRail: cột server bên trái (giữ cố định vị trí cuộn như Discord / JetBrains IDE).
 *  - PersistentUserBar: thanh profile nổi dưới cùng (rail + sidebar).
 *  - ServerWorkspaceModal: trung tâm quản trị máy chủ, kênh, thành viên & phân quyền (RBAC).
 * Layer 2 (sidebar) & Layer 3 (chat) render qua `children`.
 */
export default function ChannelsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="discord-app relative h-screen w-screen overflow-hidden bg-[#1E1F22] text-[#E6EDF3] font-sans flex">
        <WorkspaceBootstrap />
        <WorkspaceRealtime />
        <ServerRail />
        <div className="flex-1 flex min-w-0 h-full overflow-hidden">{children}</div>
        <PersistentUserBar />
        <ServerWorkspaceModal />
      </div>
    </AuthGate>
  );
}
