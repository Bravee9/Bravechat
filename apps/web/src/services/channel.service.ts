import type { DirectConversation } from "@discord-clone/shared";
import { API_ROUTES } from "@discord-clone/shared";
import { env } from "@/config/env";
import { http } from "@/services/http";
import { MOCK_DIRECT_CONVERSATIONS } from "@/services/mock/mockData";

export const channelService = {
  /**
   * Lấy danh sách bạn bè / direct messages tại route `/channels/@me`
   */
  async getDirectConversations(): Promise<DirectConversation[]> {
    if (env.useMocks) {
      return MOCK_DIRECT_CONVERSATIONS;
    }
    return http.get<DirectConversation[]>(API_ROUTES.users.myConversations);
  },
};
