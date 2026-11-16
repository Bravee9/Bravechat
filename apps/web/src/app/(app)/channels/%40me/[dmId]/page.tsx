import { ChatView } from "@/features/messages/components/ChatView";

export default async function DirectMessagePage({ params }: { params: Promise<{ dmId: string }> }) {
  const { dmId } = await params;
  return <ChatView serverId="@me" channelId={decodeURIComponent(dmId)} />;
}
