import { ChannelSidebar } from "@/features/channels/components/ChannelSidebar";

export default function ServerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ChannelSidebar />
      {children}
    </>
  );
}
