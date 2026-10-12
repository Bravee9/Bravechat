import { redirect } from "next/navigation";
import { ChatView } from "@/features/messages/components/ChatView";

interface PageProps {
  params: {
    serverId: string;
  };
}

export default function ServerIndexPage({ params }: PageProps) {
  const serverId = decodeURIComponent(params.serverId);

  // Với @me, hiển thị màn hình DM mặc định
  if (serverId === "@me") {
    return <ChatView />;
  }

  // Với Server thường, redirect trực tiếp vào kênh mặc định "#general"
  redirect(`/channels/${serverId}/general`);
}
