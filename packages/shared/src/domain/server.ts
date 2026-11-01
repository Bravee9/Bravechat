import type { Channel, ChannelCategory } from "./channel";

/** One icon in the server rail (left-most vertical bar). */
export interface ServerListItem {
  id: string;
  name: string;
  /** Public R2 URL resolved from `iconKey`. null → rail shows the name's initials. */
  iconUrl: string | null;
  /** Per-user read state: small pill on the left of the icon. */
  hasUnread: boolean;
  /** Red badge on the icon. 0 = hidden. */
  mentionCount: number;
}

/** `GET /servers/:serverId` — everything the channel sidebar needs in one call. */
export interface ServerDetail {
  id: string;
  name: string;
  iconUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  ownerId: string;
  categories: ChannelCategory[];
  channels: Channel[];
}

/** Public member row returned by GET /servers/:serverId/members. */
export interface ServerMemberSummary {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  status: import("./user").UserStatus;
  customStatus: string | null;
  role: "OWNER" | "ADMIN" | "MEMBER" | "BOT";
}
