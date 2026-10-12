import type { CurrentUser } from "@discord-clone/shared";
import { API_ROUTES } from "@discord-clone/shared";
import { env } from "@/config/env";
import { http } from "@/services/http";
import { MOCK_CURRENT_USER } from "@/services/mock/mockData";

export const userService = {
  /**
   * Lấy thông tin user hiện tại (cho profile bar dưới cùng)
   */
  async getCurrentUser(): Promise<CurrentUser> {
    if (env.useMocks) {
      return MOCK_CURRENT_USER;
    }
    try {
      return await http.get<CurrentUser>(API_ROUTES.auth.me);
    } catch {
      return MOCK_CURRENT_USER;
    }
  },
};
