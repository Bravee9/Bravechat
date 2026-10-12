/**
 * User DTOs — what the API returns, not the Prisma row.
 * Never expose passwordHash, email of other users, ban info, etc.
 */

/** Mirrors `enum UserStatus` in packages/database/prisma/schema.prisma */
export type UserStatus = "ONLINE" | "IDLE" | "DO_NOT_DISTURB" | "INVISIBLE" | "OFFLINE";

/** Minimal public user shape, embedded in messages, members, DMs. */
export interface UserSummary {
  id: string;
  username: string;
  displayName: string | null;
  /** Public R2 URL resolved from `avatarKey` by the API. */
  avatarUrl: string | null;
  status: UserStatus;
}

/** `GET /auth/me` — the logged-in user. */
export interface CurrentUser extends UserSummary {
  email: string;
  discriminator: string;
  customStatus: string | null;
}
