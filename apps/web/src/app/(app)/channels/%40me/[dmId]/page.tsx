import { ChatView } from "@/features/messages/components/ChatView";

export default function DirectMessagePage({ params }: { params: { dmId: string } }) {
  return <ChatView serverId="@me" channelId={decodeURIComponent(params.dmId)} />;
}
