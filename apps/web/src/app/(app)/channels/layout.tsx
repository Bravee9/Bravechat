import { ServerRail } from "@/features/servers/components/ServerRail";
import { PersistentUserBar } from "@/features/channels/components/PersistentUserBar";
import { WorkspaceBootstrap } from "@/stores/WorkspaceBootstrap";
import { WorkspaceRealtime } from "@/stores/WorkspaceRealtime";

/**
 * LAYER 1 — Persistent shell. Không bao giờ unmount khi chuyển server/kênh:
 *  - WorkspaceBootstrap: tải servers / DMs / current user một lần vào store.
 *  - ServerRail: cột server bên trái.
 *  - PersistentUserBar: thanh profile nổi dưới cùng (rail + sidebar).
 * Layer 2 (sidebar) & Layer 3 (chat) render qua `children`.
 */
export default function ChannelsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-ocean-dark-bg text-ocean-light font-sans flex select-none">
      <WorkspaceBootstrap />
      <WorkspaceRealtime />
      <ServerRail />
      <div className="flex-1 flex min-w-0 h-full overflow-hidden">{children}</div>
      <PersistentUserBar />
    </div>
  );
}
