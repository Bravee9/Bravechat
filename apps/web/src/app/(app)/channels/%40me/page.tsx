import { ChatView } from "@/features/messages/components/ChatView";

export default function FriendsHomePage() {
  return <ChatView serverId="@me" channelId="friends" />;
}
