import { redirect } from "next/navigation";

export default function ChannelsIndexPage() {
  redirect("/channels/@me");
}
