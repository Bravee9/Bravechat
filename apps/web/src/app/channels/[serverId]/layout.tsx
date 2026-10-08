import { ChannelSidebar } from "@/components/chat/ChannelSidebar";

export default function ServerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ChannelSidebar />
      {children}
    </>
  );
}
