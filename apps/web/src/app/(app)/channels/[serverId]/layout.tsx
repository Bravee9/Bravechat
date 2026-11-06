import { ServerChannelSidebar } from "@/features/channels/components/ServerChannelSidebar";
import { DmSidebar } from "@/features/channels/components/DmSidebar";

/** LAYER 2 — nhánh server. Sidebar đọc từ store nên đổi server không bị nhấp nháy. */
export default async function ServerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ serverId: string }>;
}) {
  const { serverId } = await params;
  return (
    <>
      {decodeURIComponent(serverId) === "@me" ? <DmSidebar /> : <ServerChannelSidebar serverId={decodeURIComponent(serverId)} />}
      {children}
    </>
  );
}
