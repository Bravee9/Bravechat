import { ServerChannelSidebar } from "@/features/channels/components/ServerChannelSidebar";
import { DmSidebar } from "@/features/channels/components/DmSidebar";

/** LAYER 2 — nhánh server. Sidebar đọc từ store nên đổi server không bị nhấp nháy. */
export default function ServerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { serverId: string };
}) {
  return (
    <>
      {decodeURIComponent(params.serverId) === "@me" ? <DmSidebar /> : <ServerChannelSidebar serverId={decodeURIComponent(params.serverId)} />}
      {children}
    </>
  );
}
