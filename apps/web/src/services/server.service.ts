import type { ServerDetail, ServerListItem, ServerMemberSummary } from "@discord-clone/shared";
import { env } from "@/config/env";
import { serverAdapter } from "@/services/adapters";
import { MOCK_SERVER_DETAILS, MOCK_SERVER_LIST } from "@/services/mock/mockData";

export const serverService = {
  /**
   * Lấy danh sách server của user hiện tại (hiển thị trên ServerRail)
   */
  async getMyServers(): Promise<ServerListItem[]> {
    if (env.useMocks) {
      return MOCK_SERVER_LIST;
    }
    return serverAdapter.listMyServers();
  },

  /**
   * Lấy thông tin chi tiết của server kèm theo categories & channels
   */
  async getServerDetail(serverId: string): Promise<ServerDetail | null> {
    if (env.useMocks) {
      return (
        MOCK_SERVER_DETAILS[serverId] || {
          id: serverId,
          name: `Server #${serverId}`,
          iconUrl: null,
          bannerUrl: null,
          description: null,
          ownerId: "unknown",
          categories: [
            { id: `cat_${serverId}_1`, serverId, name: "KÊNH CHAT", position: 0 },
          ],
          channels: [
            {
              id: "general",
              serverId,
              categoryId: `cat_${serverId}_1`,
              name: "general",
              type: "TEXT",
              topic: "Kênh trò chuyện chính",
              position: 0,
              hasUnread: false,
              mentionCount: 0,
            },
          ],
        }
      );
    }

    return serverAdapter.getDetail(serverId);
  },

  async getServerMembers(serverId: string): Promise<ServerMemberSummary[]> {
    const response = await serverAdapter.listMembers(serverId);
    return response.members;
  },
};
