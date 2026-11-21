import type { CurrentUser } from "@discord-clone/shared";
import { env } from "@/config/env";
import { authAdapter } from "@/services/adapters";
import { MOCK_CURRENT_USER } from "@/services/mock/mockData";

export const userService = {
  /**
   * Lấy thông tin user hiện tại (cho profile bar dưới cùng)
   */
  async getCurrentUser(): Promise<CurrentUser> {
    if (env.useMocks) {
      return MOCK_CURRENT_USER;
    }
    const response = await authAdapter.getCurrentUser();
    return response.user;
  },
};
