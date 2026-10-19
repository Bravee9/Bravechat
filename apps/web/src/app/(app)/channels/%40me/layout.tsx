import { DmSidebar } from "@/features/channels/components/DmSidebar";

/** LAYER 2 — nhánh @me (Bạn bè & DMs). Thư mục `%40me` = URL `/channels/@me`. */
export default function DmLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DmSidebar />
      {children}
    </>
  );
}
