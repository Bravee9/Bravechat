export type PermissionKey =
  | "manage_server"
  | "manage_channels"
  | "manage_roles"
  | "view_audit_log"
  | "invite_members"
  | "kick_members"
  | "ban_members"
  | "send_messages"
  | "attach_files"
  | "manage_messages"
  | "pin_messages"
  | "connect_voice"
  | "speak_voice"
  | "share_screen"
  | "access_private_channels";

export const PERMISSION_BITS: Record<PermissionKey, number> = {
  manage_server: 1 << 0,
  manage_channels: 1 << 1,
  manage_roles: 1 << 2,
  view_audit_log: 1 << 3,
  invite_members: 1 << 4,
  kick_members: 1 << 5,
  ban_members: 1 << 6,
  send_messages: 1 << 7,
  attach_files: 1 << 8,
  manage_messages: 1 << 9,
  pin_messages: 1 << 10,
  connect_voice: 1 << 11,
  speak_voice: 1 << 12,
  share_screen: 1 << 13,
  access_private_channels: 1 << 14,
};

export function permissionsToBitmask(
  perms: Partial<Record<PermissionKey, boolean>>
): string {
  let mask = 0;
  for (const [key, bit] of Object.entries(PERMISSION_BITS)) {
    if (perms[key as PermissionKey]) {
      mask |= bit;
    }
  }
  return String(mask);
}

export function bitmaskToPermissions(
  maskInput: string | number | bigint
): Record<PermissionKey, boolean> {
  const mask = Number(maskInput);
  const result = {} as Record<PermissionKey, boolean>;
  for (const [key, bit] of Object.entries(PERMISSION_BITS)) {
    result[key as PermissionKey] = (mask & bit) === bit;
  }
  return result;
}
