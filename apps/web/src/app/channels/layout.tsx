import { ServerSidebar } from "@/components/chat/ServerSidebar";

export default function ChannelsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-ocean-dark-bg text-ocean-light font-sans flex">
      <ServerSidebar />
      {children}
    </div>
  );
}
