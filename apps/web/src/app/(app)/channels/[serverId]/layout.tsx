import { ServerChannelSidebar } from "@/features/channels/components/ServerChannelSidebar";

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
      <ServerChannelSidebar serverId={decodeURIComponent(params.serverId)} />
      {children}
    </>
  );
}
