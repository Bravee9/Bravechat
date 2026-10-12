import { ServerRail } from "@/features/servers/components/ServerRail";

export default function ChannelsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-ocean-dark-bg text-ocean-light font-sans flex select-none">
      {/* Layer 1: Persistent Server Rail (never unmounts across server switches) */}
      <ServerRail />
      {/* Layer 2 & 3: Channel Sidebar & Chat View */}
      <div className="flex-1 flex min-w-0 h-full overflow-hidden">
        {children}
      </div>
    </div>
  );
}
