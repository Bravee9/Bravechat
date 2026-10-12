import type { ServerDetail, ServerListItem } from "@discord-clone/shared";
import { API_ROUTES } from "@discord-clone/shared";
import { env } from "@/config/env";
import { http } from "@/services/http";
import { MOCK_SERVER_DETAILS, MOCK_SERVER_LIST } from "@/services/mock/mockData";

export const serverService = {
  /**
   * Lấy danh sách server của user hiện tại (hiển thị trên ServerRail)
   */
  async getMyServers(): Promise<ServerListItem[]> {
    if (env.useMocks) {
      return MOCK_SERVER_LIST;
    }
    try {
      return await http.get<ServerListItem[]>(API_ROUTES.users.myServers);
    } catch {
      // Fallback graceful
      return MOCK_SERVER_LIST;
    }
  },

  /**
   * Lấy thông tin chi tiết của server kèm theo categories & channels
   */
  async getServerDetail(serverId: string): Promise<ServerDetail | null> {
    if (env.useMocks || MOCK_SERVER_DETAILS[serverId]) {
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

    try {
      return await http.get<ServerDetail>(API_ROUTES.servers.detail(serverId));
    } catch {
      return MOCK_SERVER_DETAILS[serverId] ?? null;
    }
  },
};
