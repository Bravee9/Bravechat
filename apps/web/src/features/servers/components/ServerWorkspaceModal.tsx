"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  API_ROUTES,
  type AuditLogEntry,
  type RoleSummary,
  type SearchMessageResult,
  type ServerAnalytics,
} from "@discord-clone/shared";
import { http } from "@/services/http";
import { serverService } from "@/services/server.service";
import { CheckIcon, CloseIcon, LockIcon, SearchIcon, VolumeIcon } from "@/components/ui/Icons";
import {
  loadServerDetail,
  loadServers,
  useCurrentUser,
  useServerDetail,
} from "@/stores/workspace.store";
import {
  closeWorkspaceModal,
  JETBRAINS_PALETTE,
  openWorkspaceModal,
  setPreviewAsRole,
  updateServerWorkspaceConfig,
  useActiveWorkspaceModal,
  usePreviewAsRoleId,
  useServerWorkspaceConfig,
  type PermissionKey,
  type WorkspaceModalTab,
} from "@/stores/ide-workspace.store";
import type { Member } from "@/features/members/components/MemberItem";

const PERMISSION_GROUPS: Array<{
  group: string;
  items: Array<{ key: PermissionKey; label: string; desc: string }>;
}> = [
  {
    group: "Quản trị máy chủ",
    items: [
      {
        key: "manage_server",
        label: "Quản lý thông tin máy chủ",
        desc: "Cho phép đổi tên, mô tả, màu nhận diện và chế độ hiển thị của máy chủ.",
      },
      {
        key: "manage_channels",
        label: "Quản lý kênh & danh mục",
        desc: "Tạo, đổi tên, xóa kênh và bật/tắt chế độ Kênh riêng tư.",
      },
      {
        key: "manage_roles",
        label: "Quản lý vai trò & phân quyền",
        desc: "Tạo vai trò mới, chỉnh sửa màu sắc và thay đổi bảng phân quyền.",
      },
      {
        key: "view_audit_log",
        label: "Xem nhật ký hoạt động",
        desc: "Theo dõi lịch sử thay đổi cấu hình, kênh và thành viên.",
      },
    ],
  },
  {
    group: "Quản lý thành viên",
    items: [
      {
        key: "invite_members",
        label: "Tạo liên kết mời",
        desc: "Tạo mã mời người dùng mới tham gia vào máy chủ.",
      },
      {
        key: "kick_members",
        label: "Mời ra khỏi máy chủ (Kick)",
        desc: "Xóa thành viên khỏi danh sách máy chủ.",
      },
      {
        key: "ban_members",
        label: "Chặn truy cập (Ban)",
        desc: "Chặn tài khoản truy cập vào máy chủ và thu hồi quyền xem kênh.",
      },
    ],
  },
  {
    group: "Kênh văn bản & Phòng thoại",
    items: [
      {
        key: "access_private_channels",
        label: "Truy cập kênh riêng tư mặc định",
        desc: "Cho phép xem các kênh được đánh dấu riêng tư trong máy chủ.",
      },
      {
        key: "send_messages",
        label: "Gửi tin nhắn văn bản",
        desc: "Đăng tin nhắn và phản hồi trong các kênh văn bản được phép xem.",
      },
      {
        key: "attach_files",
        label: "Đính kèm tệp & hình ảnh",
        desc: "Tải lên ảnh, tài liệu và phương tiện trong hội thoại.",
      },
      {
        key: "manage_messages",
        label: "Quản lý tin nhắn của thành viên khác",
        desc: "Xóa hoặc thu hồi tin nhắn vi phạm quy tắc trong kênh.",
      },
      {
        key: "pin_messages",
        label: "Ghim tin nhắn quan trọng",
        desc: "Ghim hoặc bỏ ghim các thông báo trong kênh.",
      },
      {
        key: "connect_voice",
        label: "Tham gia phòng thoại",
        desc: "Kết nối vào các kênh thoại và video trong máy chủ.",
      },
      {
        key: "speak_voice",
        label: "Phát âm thanh trong phòng thoại",
        desc: "Sử dụng micro để trò chuyện trong phòng thoại.",
      },
      {
        key: "share_screen",
        label: "Chia sẻ màn hình & camera",
        desc: "Phát trực tiếp màn hình làm việc hoặc video trong phòng thoại.",
      },
    ],
  },
];

export function ServerWorkspaceModal() {
  const modalState = useActiveWorkspaceModal();
  if (!modalState) return null;
  return (
    <ServerWorkspaceDialogContent
      serverId={modalState.serverId}
      initialTab={modalState.tab}
    />
  );
}

function ServerWorkspaceDialogContent({
  serverId,
  initialTab,
}: {
  serverId: string;
  initialTab: WorkspaceModalTab;
}) {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const serverDetail = useServerDetail(serverId);
  const config = useServerWorkspaceConfig(serverId);
  const previewAsRoleId = usePreviewAsRoleId();

  const [activeTab, setActiveTab] = useState<WorkspaceModalTab>(initialTab);
  const [settingsSearch, setSettingsSearch] = useState("");
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const isOwner = Boolean(
    currentUser?.id && serverDetail?.ownerId && currentUser.id === serverDetail.ownerId
  );
  const actorHighestPosition = isOwner
    ? 1000
    : serverDetail?.highestRolePosition ?? 1000;

  // Overview state
  const [serverName, setServerName] = useState(serverDetail?.name ?? "");
  const [serverDesc, setServerDesc] = useState(
    serverDetail?.description ?? config.description ?? ""
  );
  const [selectedColor, setSelectedColor] = useState(
    serverDetail?.badgeColor ?? config.badgeColor ?? "#087CFA"
  );
  const [isPublic, setIsPublic] = useState(Boolean(serverDetail?.isPublic));
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState("");

  useEffect(() => {
    if (serverDetail?.name) setServerName(serverDetail.name);
    if (serverDetail?.description !== undefined) {
      setServerDesc(serverDetail.description ?? "");
    }
    if (serverDetail?.badgeColor) setSelectedColor(serverDetail.badgeColor);
    if (serverDetail?.isPublic !== undefined) setIsPublic(serverDetail.isPublic);
  }, [serverDetail]);

  // Channels state
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelType, setNewChannelType] = useState<"TEXT" | "VOICE">("TEXT");
  const [newChannelCategory, setNewChannelCategory] = useState<string>("");
  const [newChannelPrivate, setNewChannelPrivate] = useState(false);

  // Members state
  const [members, setMembers] = useState<Array<Member & { roleIds?: string[] }>>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState<string>("ALL");
  const [inviteLink, setInviteLink] = useState("");

  // Roles state (backed by PostgreSQL /api/servers/:id/roles)
  const [dbRoles, setDbRoles] = useState<RoleSummary[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [newRoleName, setNewRoleName] = useState("");

  // Analytics & Search state
  const [analytics, setAnalytics] = useState<ServerAnalytics | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchMessageResult[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const loadRoles = async () => {
    try {
      const res = await http.get<{ roles: RoleSummary[] }>(
        API_ROUTES.servers.roles(serverId)
      );
      setDbRoles(res.roles);
      if (!selectedRoleId && res.roles.length > 0) {
        setSelectedRoleId(res.roles[0].id);
      }
    } catch {
      // ignore if unauthorized
    }
  };

  const loadMembers = async () => {
    try {
      const rows = await serverService.getServerMembers(serverId);
      setMembers(
        rows.map((r) => ({
          id: r.id,
          name: r.displayName || r.username,
          role: r.role,
          roleIds: r.roleIds ?? [],
          status: r.status,
          customStatus: r.customStatus ?? undefined,
          avatarUrl: r.avatarUrl,
        }))
      );
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    void loadRoles();
    void loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId]);

  useEffect(() => {
    if (activeTab !== "analytics") return;
    let active = true;
    setAnalyticsLoading(true);
    Promise.all([
      http.get<ServerAnalytics>(API_ROUTES.servers.analytics(serverId)),
      http
        .get<{ logs: AuditLogEntry[] }>(API_ROUTES.servers.auditLogs(serverId))
        .catch(() => ({ logs: [] })),
    ])
      .then(([statsRes, logsRes]) => {
        if (!active) return;
        setAnalytics(statsRes);
        setAuditLogs(logsRes.logs);
      })
      .catch((err) => {
        if (active) {
          setErrorMsg(
            err instanceof Error ? err.message : "Không thể tải thống kê máy chủ."
          );
        }
      })
      .finally(() => {
        if (active) setAnalyticsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeTab, serverId]);

  const selectedRole = useMemo(
    () => dbRoles.find((r) => r.id === selectedRoleId) ?? dbRoles[0],
    [dbRoles, selectedRoleId]
  );

  const isOverviewDirty =
    serverName.trim() !== (serverDetail?.name ?? "").trim() ||
    serverDesc.trim() !== (serverDetail?.description ?? config.description ?? "").trim() ||
    selectedColor !== (serverDetail?.badgeColor ?? config.badgeColor ?? "#087CFA") ||
    isPublic !== Boolean(serverDetail?.isPublic);

  const persistOverviewChanges = async (): Promise<boolean> => {
    if (!serverName.trim()) return false;
    setBusy(true);
    setErrorMsg("");
    setStatusMsg("");
    try {
      await http.patch(API_ROUTES.servers.detail(serverId), {
        name: serverName.trim(),
        description: serverDesc.trim() || null,
        badgeColor: selectedColor,
        isPublic,
      });
      updateServerWorkspaceConfig(serverId, (prev) => ({
        ...prev,
        badgeColor: selectedColor,
        description: serverDesc.trim(),
      }));
      await Promise.all([loadServerDetail(serverId, true), loadServers(true)]);
      setStatusMsg("Đã lưu thay đổi máy chủ.");
      return true;
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Không thể cập nhật máy chủ."
      );
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleSaveOverview = async (e: React.FormEvent) => {
    e.preventDefault();
    await persistOverviewChanges();
  };

  const handleDialogOk = async () => {
    if (isOverviewDirty) {
      const ok = await persistOverviewChanges();
      if (!ok) return;
    }
    closeWorkspaceModal();
  };

  const handleDeleteServer = async () => {
    setBusy(true);
    setErrorMsg("");
    try {
      await http.delete(API_ROUTES.servers.detail(serverId));
      await loadServers(true);
      closeWorkspaceModal();
      router.replace("/channels/@me");
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Không thể xóa máy chủ."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newChannelName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9_-]/g, "");
    if (!cleanName) return;
    setBusy(true);
    setErrorMsg("");
    setStatusMsg("");
    try {
      const categoryId =
        newChannelCategory || serverDetail?.categories[0]?.id || undefined;
      const defaultAllowed = dbRoles
        .filter((r) => ["OWNER", "ADMIN"].includes(r.name.toUpperCase()))
        .map((r) => r.id);

      await http.post(API_ROUTES.servers.channels(serverId), {
        name: cleanName,
        type: newChannelType,
        categoryId,
        isPrivate: newChannelPrivate,
        allowedRoleIds: newChannelPrivate ? defaultAllowed : [],
      });
      await loadServerDetail(serverId, true);
      setNewChannelName("");
      setNewChannelPrivate(false);
      setStatusMsg(`Đã tạo kênh #${cleanName}.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Không thể tạo kênh.");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteChannel = async (channelId: string, channelName: string) => {
    setBusy(true);
    setErrorMsg("");
    try {
      await http.delete(API_ROUTES.servers.channelDetail(serverId, channelId));
      await loadServerDetail(serverId, true);
      setStatusMsg(`Đã xóa kênh #${channelName}.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Không thể xóa kênh.");
    } finally {
      setBusy(false);
    }
  };

  const toggleChannelPrivacy = async (
    channelId: string,
    currentPrivate: boolean,
    currentAllowed: string[]
  ) => {
    setErrorMsg("");
    try {
      const nextPrivate = !currentPrivate;
      await http.patch(API_ROUTES.servers.channelDetail(serverId, channelId), {
        isPrivate: nextPrivate,
        allowedRoleIds: currentAllowed,
      });
      await loadServerDetail(serverId, true);
      setStatusMsg(
        nextPrivate ? "Đã khóa kênh riêng tư." : "Đã mở công khai kênh."
      );
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Không thể đổi trạng thái kênh."
      );
    }
  };

  const toggleChannelAllowedRole = async (
    channelId: string,
    currentAllowed: string[],
    roleId: string
  ) => {
    setErrorMsg("");
    const exists = currentAllowed.includes(roleId);
    const nextRoles = exists
      ? currentAllowed.filter((r) => r !== roleId)
      : [...currentAllowed, roleId];
    try {
      await http.patch(API_ROUTES.servers.channelDetail(serverId, channelId), {
        isPrivate: true,
        allowedRoleIds: nextRoles,
      });
      await loadServerDetail(serverId, true);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Không thể cập nhật quyền kênh."
      );
    }
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newRoleName.trim();
    if (!trimmed) return;
    setErrorMsg("");
    try {
      const randomColor =
        JETBRAINS_PALETTE[dbRoles.length % JETBRAINS_PALETTE.length].hex;
      const res = await http.post<{ role: RoleSummary }>(
        API_ROUTES.servers.roles(serverId),
        {
          name: trimmed,
          color: randomColor,
          permissions: {
            invite_members: true,
            send_messages: true,
            attach_files: true,
            connect_voice: true,
            speak_voice: true,
            share_screen: true,
          },
        }
      );
      await loadRoles();
      setSelectedRoleId(res.role.id);
      setNewRoleName("");
      setStatusMsg(`Đã tạo vai trò "${trimmed}".`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Không thể tạo vai trò.");
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    setErrorMsg("");
    try {
      await http.delete(API_ROUTES.servers.roleDetail(serverId, roleId));
      await loadRoles();
      setSelectedRoleId("");
      setStatusMsg("Đã xóa vai trò.");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Không thể xóa vai trò.");
    }
  };

  const toggleRolePermission = async (
    role: RoleSummary,
    permKey: PermissionKey
  ) => {
    const nextPerms = {
      ...role.permissions,
      [permKey]: !role.permissions[permKey],
    };
    setDbRoles((prev) =>
      prev.map((r) => (r.id === role.id ? { ...r, permissions: nextPerms } : r))
    );
    try {
      await http.patch(API_ROUTES.servers.roleDetail(serverId, role.id), {
        permissions: nextPerms,
      });
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Không thể cập nhật quyền."
      );
      await loadRoles();
    }
  };

  const updateRoleMeta = async (
    role: RoleSummary,
    patch: { name?: string; color?: string }
  ) => {
    setDbRoles((prev) =>
      prev.map((r) => (r.id === role.id ? { ...r, ...patch } : r))
    );
    try {
      await http.patch(API_ROUTES.servers.roleDetail(serverId, role.id), patch);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Không thể cập nhật vai trò."
      );
    }
  };

  const handleAssignMemberRole = async (userId: string, roleId: string) => {
    setErrorMsg("");
    try {
      await http.put(API_ROUTES.servers.memberRoles(serverId, userId), {
        roleIds: [roleId],
      });
      await Promise.all([loadMembers(), loadRoles()]);
      setStatusMsg("Đã cập nhật vai trò thành viên.");
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Không thể gán vai trò."
      );
    }
  };

  const handleKickMember = async (member: Member) => {
    setErrorMsg("");
    try {
      await http.post(API_ROUTES.servers.kickMember(serverId, member.id));
      await loadMembers();
      setStatusMsg(`Đã mời ${member.name} rời khỏi máy chủ.`);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Không thể kick thành viên."
      );
    }
  };

  const handleBanMember = async (member: Member) => {
    setErrorMsg("");
    try {
      await http.post(API_ROUTES.servers.banMember(serverId, member.id), {});
      await loadMembers();
      setStatusMsg(`Đã chặn ${member.name} khỏi máy chủ.`);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Không thể chặn thành viên."
      );
    }
  };

  const handleSearchMessages = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const res = await http.get<{ results: SearchMessageResult[] }>(
        API_ROUTES.servers.searchMessages(serverId),
        { query: { q: searchQuery.trim() } }
      );
      setSearchResults(res.results);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Không thể tìm kiếm tin nhắn."
      );
    }
  };

  const visibleMembers = useMemo(() => {
    return members.filter((m) => {
      if (memberRoleFilter !== "ALL") {
        const hasRole = (m.roleIds ?? []).includes(memberRoleFilter);
        if (!hasRole) return false;
      }
      if (
        memberSearch.trim() &&
        !m.name.toLowerCase().includes(memberSearch.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [members, memberRoleFilter, memberSearch]);

  const generateQuickInvite = async () => {
    setErrorMsg("");
    try {
      const { invite } = await http.post<{
        invite: { code: string; expiresAt: string };
      }>(API_ROUTES.servers.createInvite(serverId));
      setInviteLink(
        `${window.location.origin}/invite/${encodeURIComponent(invite.code)}`
      );
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Không thể tạo liên kết mời."
      );
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Cấu hình Máy chủ & Phân quyền"
      data-testid="server-workspace-modal"
    >
      <div className="w-full max-w-[1060px] h-[86vh] max-h-[780px] bg-[#1E1F22] border border-[#2B2D30] rounded-[6px] shadow-[0_24px_80px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-[#E6EDF3]">
        {/* Top IDE Window Header */}
        <div className="h-11 bg-[#18181B] border-b border-[#2B2D30] px-4 flex items-center justify-between select-none shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-5 h-5 rounded-[4px] flex items-center justify-center text-[10px] font-mono font-bold text-[#0B0B0D] shrink-0"
              style={{ backgroundColor: selectedColor }}
            >
              {(serverDetail?.name || "SV").slice(0, 2).toUpperCase()}
            </span>
            <span className="text-xs font-mono text-[#7D7D7D]">Cài đặt /</span>
            <span className="text-xs font-semibold text-white truncate">
              {serverDetail?.name || "Máy chủ"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-[#141417] border border-[#2B2D30] rounded-[4px] px-2.5 py-1">
              <span className="text-[11px] font-mono text-[#A8A8B0]">
                Xem thử dưới quyền:
              </span>
              <select
                aria-label="Xem thử dưới quyền"
                value={previewAsRoleId ?? "DEFAULT"}
                onChange={(e) =>
                  setPreviewAsRole(
                    e.target.value === "DEFAULT" ? null : e.target.value
                  )
                }
                data-testid="preview-role-select"
                className="bg-transparent text-[11px] font-mono font-semibold text-[#07C3F2] focus:outline-none cursor-pointer"
              >
                <option value="DEFAULT" className="bg-[#18181B] text-white">
                  Mặc định (Toàn quyền)
                </option>
                {dbRoles.map((r) => (
                  <option
                    key={r.id}
                    value={r.id}
                    className="bg-[#18181B] text-white"
                  >
                    {r.name}
                  </option>
                ))}
                <option value="GUEST" className="bg-[#18181B] text-white">
                  Khách (Chưa có quyền)
                </option>
              </select>
            </div>

            <button
              type="button"
              onClick={closeWorkspaceModal}
              data-testid="close-workspace-modal-btn"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border border-[#2B2D30] bg-[#2B2D30]/50 hover:bg-[#393B40] text-xs font-mono text-[#CDCDCD] hover:text-white transition-colors cursor-pointer"
            >
              <span>ESC</span>
              <CloseIcon className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Main IDE Split Layout (Reference Image 5) */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Navigation Tree with Search Box */}
          <aside className="w-56 bg-[#1E1F22] border-r border-[#2B2D30] p-2.5 flex flex-col justify-between shrink-0 select-none overflow-y-auto">
            <div className="space-y-3">
              {/* IDE Settings Search Bar */}
              <div className="relative flex items-center">
                <SearchIcon className="w-3.5 h-3.5 text-[#6F737A] absolute left-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={settingsSearch}
                  onChange={(e) => setSettingsSearch(e.target.value)}
                  placeholder="Tìm cài đặt..."
                  aria-label="Tìm mục cài đặt"
                  data-testid="workspace-settings-search"
                  className="w-full h-7 pl-7 pr-2 rounded-[4px] bg-[#1E1F22] border border-[#4E5157] focus:border-[#3574F0] focus:outline-none text-xs text-[#DFE1E5] placeholder:text-[#6F737A]"
                />
              </div>

              <div className="space-y-0.5">
                {(
                  [
                    {
                      id: "overview",
                      label: "Tổng quan",
                      keywords: "tong quan ten may chu mau",
                    },
                    {
                      id: "channels",
                      label: "Kênh & Quyền riêng tư",
                      keywords: "kenh rieng tu khoa voice text",
                    },
                    {
                      id: "members",
                      label: "Thành viên",
                      keywords: "thanh vien moi kick ban",
                    },
                    {
                      id: "roles",
                      label: "Vai trò & Phân quyền",
                      keywords: "vai tro phan quyen role",
                    },
                    {
                      id: "analytics",
                      label: "Thống kê & Tìm kiếm",
                      keywords: "thong ke tim kiem nhat ky",
                    },
                  ] as const
                )
                  .filter((item) => {
                    const q = settingsSearch.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      item.label.toLowerCase().includes(q) ||
                      item.keywords.includes(q)
                    );
                  })
                  .map((item) => {
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id);
                          openWorkspaceModal(serverId, item.id);
                          setStatusMsg("");
                          setErrorMsg("");
                        }}
                        data-testid={`workspace-tab-${item.id}`}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-[4px] text-xs font-medium transition-colors cursor-pointer text-left ${
                          active
                            ? "bg-[#2E436E] text-white font-semibold"
                            : "text-[#DFE1E5] hover:bg-[#2B2D30]/60"
                        }`}
                      >
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            <div className="pt-2.5 px-1 border-t border-[#2B2D30] flex items-center justify-between text-[11px] text-[#7D7D7D]">
              <span className="truncate">{serverDetail?.name || "Máy chủ"}</span>
              <span className="text-[#21D789] font-medium">Đang hoạt động</span>
            </div>
          </aside>

          {/* Right Inspector Content */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#1E1F22]">
            {statusMsg && (
              <div
                role="status"
                className="mb-5 px-4 py-2.5 rounded-[4px] bg-[#21D789]/15 border border-[#21D789]/40 text-[#21D789] text-xs font-medium flex items-center justify-between"
              >
                <span>{statusMsg}</span>
                <button
                  type="button"
                  onClick={() => setStatusMsg("")}
                  aria-label="Đóng thông báo"
                  className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
                >
                  <CloseIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {errorMsg && (
              <div
                role="alert"
                className="mb-5 px-4 py-2.5 rounded-[4px] bg-[#FE2857]/15 border border-[#FE2857]/40 text-[#FE2857] text-xs font-medium"
              >
                {errorMsg}
              </div>
            )}

            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-8 max-w-2xl">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Tổng quan máy chủ
                  </h2>
                  <p className="text-xs text-[#A8A8B0] mt-1">
                    Chỉnh sửa thông tin nhận diện, bảng màu huy hiệu và phạm vi truy cập của máy chủ.
                  </p>
                </div>

                <form onSubmit={handleSaveOverview} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-4">
                    <div>
                      <label
                        htmlFor="ide-server-name"
                        className="block text-xs font-mono uppercase text-[#CDCDCD] mb-1.5"
                      >
                        Tên máy chủ
                      </label>
                      <input
                        id="ide-server-name"
                        type="text"
                        required
                        minLength={2}
                        maxLength={100}
                        value={serverName}
                        onChange={(e) => setServerName(e.target.value)}
                        className="w-full h-9 px-3 rounded-[4px] bg-[#141417] border border-[#393B40] focus:border-[#087CFA] focus:outline-none text-sm text-white"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="ide-server-visibility"
                        className="block text-xs font-mono uppercase text-[#CDCDCD] mb-1.5"
                      >
                        Chế độ truy cập
                      </label>
                      <select
                        id="ide-server-visibility"
                        value={isPublic ? "PUBLIC" : "INVITE_ONLY"}
                        onChange={(e) =>
                          setIsPublic(e.target.value === "PUBLIC")
                        }
                        className="w-full h-9 px-3 rounded-[4px] bg-[#141417] border border-[#393B40] focus:border-[#087CFA] focus:outline-none text-sm text-white"
                      >
                        <option value="INVITE_ONLY">Chỉ qua mã mời</option>
                        <option value="PUBLIC">Công khai</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="ide-server-desc"
                      className="block text-xs font-mono uppercase text-[#CDCDCD] mb-1.5"
                    >
                      Mô tả không gian làm việc
                    </label>
                    <textarea
                      id="ide-server-desc"
                      rows={2}
                      maxLength={300}
                      value={serverDesc}
                      onChange={(e) => setServerDesc(e.target.value)}
                      className="w-full p-3 rounded-[4px] bg-[#141417] border border-[#393B40] focus:border-[#087CFA] focus:outline-none text-sm text-white"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-mono uppercase text-[#CDCDCD] mb-2">
                      Màu huy hiệu máy chủ
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {JETBRAINS_PALETTE.map((swatch) => (
                        <button
                          key={swatch.hex}
                          type="button"
                          onClick={() => setSelectedColor(swatch.hex)}
                          title={`${swatch.name} (${swatch.hex})`}
                          className={`w-7 h-7 rounded-[4px] border transition-transform cursor-pointer flex items-center justify-center ${
                            selectedColor === swatch.hex
                              ? "border-white scale-110 ring-2 ring-[#087CFA]"
                              : "border-black/40 hover:scale-105"
                          }`}
                          style={{ backgroundColor: swatch.hex }}
                        >
                          {selectedColor === swatch.hex && (
                            <span className="w-2 h-0.5 bg-black rounded-full" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={busy}
                      data-testid="save-server-overview-btn"
                      className="px-4 py-2 rounded-[4px] bg-[#087CFA] hover:bg-[#07C3F2] hover:text-[#0B0B0D] text-white font-semibold text-xs transition-colors cursor-pointer"
                    >
                      {busy ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </form>

                {/* Danger Zone */}
                <div className="pt-6 border-t border-[#2B2D30]">
                  <h3 className="text-sm font-bold text-[#FE2857] mb-1">
                    Vùng nguy hiểm · Xóa máy chủ
                  </h3>
                  <p className="text-xs text-[#A8A8B0] mb-3">
                    Nhập tên máy chủ ({serverDetail?.name}) để xác nhận xóa vĩnh viễn máy chủ và toàn bộ nội dung bên trong.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      placeholder={`Nhập "${serverDetail?.name || "tên máy chủ"}"`}
                      value={confirmDeleteText}
                      onChange={(e) => setConfirmDeleteText(e.target.value)}
                      className="flex-1 h-9 px-3 rounded-[4px] bg-[#141417] border border-[#393B40] text-xs text-white focus:border-[#FE2857] focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={
                        busy ||
                        confirmDeleteText.trim() !==
                          (serverDetail?.name ?? "").trim()
                      }
                      onClick={() => void handleDeleteServer()}
                      className="px-4 py-2 rounded-[4px] bg-[#FE2857]/20 border border-[#FE2857]/50 text-[#FE2857] hover:bg-[#FE2857] hover:text-white text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      Xóa máy chủ
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CHANNELS & PRIVACY */}
            {activeTab === "channels" && (
              <div className="space-y-6">
                <div className="pb-4 border-b border-[#2B2D30]">
                  <h2 className="text-lg font-bold text-white">
                    Quản lý Kênh & Quyền riêng tư
                  </h2>
                  <p className="text-xs text-[#A8A8B0] mt-1">
                    Tạo kênh mới, xóa kênh hoặc giới hạn quyền xem cho từng vai trò trong máy chủ.
                  </p>
                </div>

                <form
                  onSubmit={handleCreateChannel}
                  className="p-4 rounded-[4px] bg-[#18181B] border border-[#2B2D30] space-y-3"
                >
                  <p className="text-xs font-mono font-semibold uppercase text-[#07C3F2]">
                    + Thêm kênh mới
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_180px_auto] gap-2.5 items-center">
                    <input
                      type="text"
                      required
                      placeholder="Tên kênh (vd: noi-bo-nhom)"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      data-testid="modal-new-channel-input"
                      className="h-9 px-3 rounded-[4px] bg-[#141417] border border-[#393B40] text-xs text-white focus:border-[#087CFA] focus:outline-none"
                    />
                    <select
                      value={newChannelType}
                      onChange={(e) =>
                        setNewChannelType(e.target.value as "TEXT" | "VOICE")
                      }
                      className="h-9 px-2.5 rounded-[4px] bg-[#141417] border border-[#393B40] text-xs text-white"
                    >
                      <option value="TEXT"># Kênh văn bản</option>
                      <option value="VOICE">Phòng thoại (Voice)</option>
                    </select>
                    <select
                      value={newChannelCategory}
                      onChange={(e) => setNewChannelCategory(e.target.value)}
                      className="h-9 px-2.5 rounded-[4px] bg-[#141417] border border-[#393B40] text-xs text-white"
                    >
                      {(serverDetail?.categories ?? []).map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={busy}
                      data-testid="modal-create-channel-btn"
                      className="h-9 px-4 rounded-[4px] bg-[#087CFA] hover:bg-[#07C3F2] hover:text-[#0B0B0D] text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Tạo kênh
                    </button>
                  </div>
                  <label className="inline-flex items-center gap-2 text-xs text-[#CDCDCD] cursor-pointer select-none pt-1">
                    <input
                      type="checkbox"
                      checked={newChannelPrivate}
                      onChange={(e) => setNewChannelPrivate(e.target.checked)}
                      className="rounded border-[#393B40] bg-[#141417]"
                    />
                    <span>
                      Đặt làm <strong>Kênh riêng tư (Private)</strong> — chỉ các vai trò được phép mới xem được
                    </span>
                  </label>
                </form>

                <div className="border border-[#2B2D30] rounded-[4px] divide-y divide-[#2B2D30] bg-[#18181B]">
                  {(serverDetail?.channels ?? []).map((ch) => {
                    const isPrivate = Boolean(ch.isPrivate);
                    const allowedRoles = ch.allowedRoleIds ?? [];
                    return (
                      <div
                        key={ch.id}
                        className="p-4 flex flex-col gap-3 hover:bg-[#24262B]/40 transition-colors"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-sm text-[#7D7D7D] flex items-center">
                              {ch.type === "VOICE" ? <VolumeIcon className="w-3.5 h-3.5" /> : "#"}
                            </span>
                            <span className="text-sm font-semibold text-white">
                              {ch.name}
                            </span>
                            {isPrivate ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-[#FDB60D]/15 border border-[#FDB60D]/40 text-[#FDB60D] text-[10px] font-mono font-semibold">
                                <LockIcon className="w-3 h-3" />
                                <span>Kênh riêng tư</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-[2px] bg-[#2B2D30] text-[#A8A8B0] text-[10px] font-mono">
                                Mọi thành viên
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                void toggleChannelPrivacy(
                                  ch.id,
                                  isPrivate,
                                  allowedRoles
                                )
                              }
                              data-testid={`toggle-privacy-${ch.id}`}
                              className={`px-3 py-1 rounded-[4px] border text-xs font-medium transition-colors cursor-pointer ${
                                isPrivate
                                  ? "border-[#FDB60D]/50 bg-[#FDB60D]/15 text-[#FDB60D] hover:bg-[#FDB60D]/25"
                                  : "border-[#393B40] bg-[#1E1F22] text-[#CDCDCD] hover:text-white"
                              }`}
                            >
                              {isPrivate
                                ? "Mở công khai kênh"
                                : "Khóa kênh riêng tư"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void handleDeleteChannel(ch.id, ch.name)
                              }
                              className="px-2.5 py-1 rounded-[4px] border border-[#FE2857]/40 text-[#FE2857] hover:bg-[#FE2857] hover:text-white text-xs transition-colors cursor-pointer"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>

                        {isPrivate && (
                          <div className="pl-6 pt-2 border-t border-[#2B2D30]/60 flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-mono text-[#A8A8B0] mr-1">
                              Vai trò được phép truy cập:
                            </span>
                            {dbRoles.map((role) => {
                              const allowed = allowedRoles.includes(role.id);
                              return (
                                <button
                                  key={role.id}
                                  type="button"
                                  onClick={() =>
                                    void toggleChannelAllowedRole(
                                      ch.id,
                                      allowedRoles,
                                      role.id
                                    )
                                  }
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] border text-[11px] font-mono transition-colors cursor-pointer ${
                                    allowed
                                      ? "bg-[#214283]/60 border-[#087CFA] text-white"
                                      : "bg-[#141417] border-[#2B2D30] text-[#7D7D7D] hover:text-[#CDCDCD]"
                                  }`}
                                >
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: role.color }}
                                  />
                                  <span>{role.name}</span>
                                  <span>{allowed ? <CheckIcon className="w-3 h-3" /> : "+"}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: MEMBERS */}
            {activeTab === "members" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2B2D30]">
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Quản lý Thành viên ({visibleMembers.length})
                    </h2>
                    <p className="text-xs text-[#A8A8B0] mt-1">
                      Gán vai trò, tạo liên kết mời hoặc thu hồi quyền truy cập của thành viên.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void generateQuickInvite()}
                    className="px-3.5 py-2 rounded-[4px] bg-[#087CFA] hover:bg-[#07C3F2] hover:text-[#0B0B0D] text-white text-xs font-semibold transition-colors cursor-pointer self-start"
                  >
                    + Tạo liên kết mời
                  </button>
                </div>

                {inviteLink && (
                  <div className="p-3.5 rounded-[4px] bg-[#18181B] border border-[#087CFA]/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-mono text-[#07C3F2] uppercase">
                        Liên kết mời tham gia máy chủ
                      </p>
                      <code className="text-xs font-mono text-white truncate block mt-0.5">
                        {inviteLink}
                      </code>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard?.writeText(inviteLink);
                        setStatusMsg("Đã sao chép liên kết mời.");
                      }}
                      className="px-3 py-1.5 rounded-[4px] bg-[#2B2D30] hover:bg-[#393B40] text-xs font-mono text-white shrink-0 cursor-pointer"
                    >
                      Sao chép
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-3">
                  <input
                    type="text"
                    placeholder="Tìm kiếm thành viên theo tên..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="h-9 px-3 rounded-[4px] bg-[#141417] border border-[#393B40] text-xs text-white focus:border-[#087CFA] focus:outline-none"
                  />
                  <select
                    value={memberRoleFilter}
                    onChange={(e) => setMemberRoleFilter(e.target.value)}
                    className="h-9 px-3 rounded-[4px] bg-[#141417] border border-[#393B40] text-xs text-white"
                  >
                    <option value="ALL">Tất cả vai trò</option>
                    {dbRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border border-[#2B2D30] rounded-[4px] divide-y divide-[#2B2D30] bg-[#18181B]">
                  {visibleMembers.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#7D7D7D]">
                      Không tìm thấy thành viên phù hợp.
                    </div>
                  ) : (
                    visibleMembers.map((member) => {
                      const assignedRoleId =
                        member.roleIds?.[0] ?? dbRoles[dbRoles.length - 1]?.id ?? "";
                      const roleObj = dbRoles.find(
                        (r) => r.id === assignedRoleId
                      );

                      return (
                        <div
                          key={member.id}
                          className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 hover:bg-[#24262B]/40 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-8 h-8 rounded-[4px] flex items-center justify-center text-xs font-mono font-bold text-[#0B0B0D] shrink-0"
                              style={{
                                backgroundColor: roleObj?.color ?? "#087CFA",
                              }}
                            >
                              {member.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate">
                                {member.name}
                              </p>
                              <p className="text-[11px] font-mono text-[#7D7D7D]">
                                {member.status === "ONLINE"
                                  ? "● Trực tuyến"
                                  : "○ Ngoại tuyến"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            {(() => {
                              const targetPosition =
                                member.role === "OWNER"
                                  ? 1000
                                  : roleObj?.position ?? 0;
                              const cannotActOnTarget =
                                !isOwner && targetPosition >= actorHighestPosition;
                              return (
                                <>
                                  <select
                                    aria-label={`Vai trò của ${member.name}`}
                                    value={assignedRoleId}
                                    disabled={cannotActOnTarget}
                                    onChange={(e) =>
                                      void handleAssignMemberRole(
                                        member.id,
                                        e.target.value
                                      )
                                    }
                                    className="h-8 px-2.5 rounded-[4px] bg-[#141417] border border-[#393B40] text-xs font-mono text-white disabled:opacity-40"
                                  >
                                    {dbRoles.map((r) => (
                                      <option
                                        key={r.id}
                                        value={r.id}
                                        disabled={!isOwner && r.position >= actorHighestPosition}
                                      >
                                        {r.name}
                                      </option>
                                    ))}
                                  </select>

                                  {member.role !== "OWNER" && !cannotActOnTarget && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => void handleKickMember(member)}
                                        className="px-2.5 py-1 rounded-[4px] border border-[#FDB60D]/40 text-[#FDB60D] hover:bg-[#FDB60D] hover:text-[#0B0B0D] text-xs transition-colors cursor-pointer"
                                      >
                                        Kick
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => void handleBanMember(member)}
                                        className="px-2.5 py-1 rounded-[4px] border border-[#FE2857]/40 text-[#FE2857] hover:bg-[#FE2857] hover:text-white text-xs transition-colors cursor-pointer"
                                      >
                                        Ban
                                      </button>
                                    </>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: ROLES & PERMISSIONS */}
            {activeTab === "roles" && (
              <div className="space-y-6">
                <div className="pb-4 border-b border-[#2B2D30]">
                  <h2 className="text-lg font-bold text-white">
                    Vai trò & Phân quyền
                  </h2>
                  <p className="text-xs text-[#A8A8B0] mt-1">
                    Tạo vai trò mới và thiết lập quyền hạn cho từng nhóm thành viên trong máy chủ.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-5">
                  <div className="space-y-3">
                    <form onSubmit={handleAddRole} className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Tên vai trò mới..."
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        data-testid="new-role-input"
                        className="flex-1 min-w-0 h-8 px-2.5 rounded-[4px] bg-[#141417] border border-[#393B40] text-xs text-white focus:border-[#087CFA] focus:outline-none"
                      />
                      <button
                        type="submit"
                        data-testid="add-role-btn"
                        className="h-8 px-2.5 rounded-[4px] bg-[#087CFA] hover:bg-[#07C3F2] hover:text-[#0B0B0D] text-white text-xs font-bold cursor-pointer shrink-0"
                      >
                        + Thêm
                      </button>
                    </form>

                    <div className="border border-[#2B2D30] rounded-[4px] bg-[#18181B] divide-y divide-[#2B2D30]">
                      {dbRoles.map((role) => {
                        const active = role.id === selectedRole?.id;
                        return (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => setSelectedRoleId(role.id)}
                            className={`w-full px-3 py-2.5 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                              active
                                ? "bg-[#214283] text-white font-semibold"
                                : "text-[#CDCDCD] hover:bg-[#2B2D30]/50"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className="w-2.5 h-2.5 rounded-[2px] shrink-0"
                                style={{ backgroundColor: role.color }}
                              />
                              <span className="truncate">{role.name}</span>
                            </div>
                            <span className="text-[10px] font-mono text-[#7D7D7D]">
                              {role.memberCount}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedRole && (
                    <div className="space-y-5 bg-[#18181B] border border-[#2B2D30] rounded-[4px] p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#2B2D30]">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-4 h-4 rounded-[3px]"
                            style={{ backgroundColor: selectedRole.color }}
                          />
                          <input
                            type="text"
                            value={selectedRole.name}
                            onChange={(e) =>
                              void updateRoleMeta(selectedRole, {
                                name: e.target.value,
                              })
                            }
                            className="bg-[#141417] border border-[#393B40] rounded-[4px] px-2.5 py-1 text-sm font-bold text-white focus:border-[#087CFA] focus:outline-none"
                          />
                        </div>

                        {!selectedRole.isManaged && (
                          <button
                            type="button"
                            onClick={() => void handleDeleteRole(selectedRole.id)}
                            className="px-2.5 py-1 rounded-[4px] border border-[#FE2857]/40 text-[#FE2857] hover:bg-[#FE2857] hover:text-white text-xs cursor-pointer"
                          >
                            Xóa vai trò
                          </button>
                        )}
                      </div>

                      <div>
                        <p className="text-[11px] font-mono uppercase text-[#A8A8B0] mb-2">
                          Màu sắc vai trò
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {JETBRAINS_PALETTE.map((swatch) => (
                            <button
                              key={swatch.hex}
                              type="button"
                              onClick={() =>
                                void updateRoleMeta(selectedRole, {
                                  color: swatch.hex,
                                })
                              }
                              className={`w-6 h-6 rounded-[3px] border cursor-pointer ${
                                selectedRole.color === swatch.hex
                                  ? "border-white scale-110 ring-1 ring-[#087CFA]"
                                  : "border-black/40"
                              }`}
                              style={{ backgroundColor: swatch.hex }}
                              title={swatch.name}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-5 pt-2">
                        {PERMISSION_GROUPS.map((grp) => (
                          <div key={grp.group} className="space-y-2">
                            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#07C3F2]">
                              {grp.group}
                            </h3>
                            <div className="divide-y divide-[#2B2D30] border border-[#2B2D30] rounded-[4px] bg-[#141417]">
                              {grp.items.map((perm) => {
                                const enabled =
                                  selectedRole.permissions[perm.key];
                                return (
                                  <div
                                    key={perm.key}
                                    className="p-3 flex items-center justify-between gap-4"
                                  >
                                    <div>
                                      <p className="text-xs font-semibold text-white">
                                        {perm.label}
                                      </p>
                                      <p className="text-[11px] text-[#A8A8B0] mt-0.5">
                                        {perm.desc}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      role="switch"
                                      aria-checked={enabled}
                                      onClick={() =>
                                        void toggleRolePermission(
                                          selectedRole,
                                          perm.key
                                        )
                                      }
                                      className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                                        enabled
                                          ? "bg-[#21D789]"
                                          : "bg-[#393B40]"
                                      }`}
                                    >
                                      <span
                                        className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                                          enabled
                                            ? "translate-x-5"
                                            : "translate-x-0"
                                        }`}
                                      />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: ANALYTICS & SEARCH */}
            {activeTab === "analytics" && (
              <div className="space-y-6">
                <div className="pb-4 border-b border-[#2B2D30]">
                  <h2 className="text-lg font-bold text-white">
                    Thống kê & Tìm kiếm tin nhắn
                  </h2>
                  <p className="text-xs text-[#A8A8B0] mt-1">
                    Theo dõi mức độ hoạt động và tìm kiếm tin nhắn trong các kênh bạn có quyền truy cập.
                  </p>
                </div>

                {analyticsLoading ? (
                  <p className="text-xs text-[#7D7D7D]">
                    Đang tải thống kê máy chủ...
                  </p>
                ) : analytics ? (
                  <>
                    {/* Summary KPIs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        {
                          label: "Thành viên",
                          value: `${analytics.summary.totalMembers} (${analytics.summary.onlineMembers} online)`,
                          color: "#21D789",
                        },
                        {
                          label: "Kênh (Riêng tư)",
                          value: `${analytics.summary.totalChannels} (${analytics.summary.privateChannels} riêng tư)`,
                          color: "#FDB60D",
                        },
                        {
                          label: "Tổng tin nhắn",
                          value: `${analytics.summary.totalMessages}`,
                          color: "#087CFA",
                        },
                        {
                          label: "Tệp đính kèm",
                          value: `${analytics.summary.totalAttachments} (${formatBytes(analytics.summary.totalAttachmentBytes)})`,
                          color: "#AF1DF5",
                        },
                      ].map((kpi) => (
                        <div
                          key={kpi.label}
                          className="p-3.5 rounded-[4px] bg-[#18181B] border border-[#2B2D30]"
                        >
                          <p className="text-[11px] font-mono text-[#A8A8B0]">
                            {kpi.label}
                          </p>
                          <p
                            className="text-base font-bold font-mono mt-1"
                            style={{ color: kpi.color }}
                          >
                            {kpi.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Search Messages */}
                    <div className="p-4 rounded-[4px] bg-[#18181B] border border-[#2B2D30] space-y-3">
                      <p className="text-xs font-semibold text-[#07C3F2]">
                        Tìm kiếm nội dung tin nhắn
                      </p>
                      <form onSubmit={handleSearchMessages} className="flex gap-2">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Nhập từ khóa cần tìm trong tin nhắn..."
                          className="flex-1 h-9 px-3 rounded-[4px] bg-[#141417] border border-[#393B40] text-xs text-white focus:border-[#087CFA] focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="h-9 px-4 rounded-[4px] bg-[#087CFA] hover:bg-[#07C3F2] hover:text-[#0B0B0D] text-white text-xs font-semibold cursor-pointer"
                        >
                          Tìm kiếm
                        </button>
                      </form>
                      {searchResults.length > 0 && (
                        <div className="divide-y divide-[#2B2D30] border border-[#2B2D30] rounded-[4px] bg-[#141417] max-h-48 overflow-y-auto">
                          {searchResults.map((r) => (
                            <div key={r.id} className="p-2.5 text-xs space-y-1">
                              <div className="flex items-center justify-between text-[#7D7D7D] font-mono">
                                <span>
                                  #{r.channelName} ·{" "}
                                  <strong className="text-[#E6EDF3]">
                                    {r.author.displayName || r.author.username}
                                  </strong>
                                </span>
                                <span>
                                  {new Date(r.createdAt).toLocaleString("vi-VN")}
                                </span>
                              </div>
                              <p className="text-[#CDCDCD]">{r.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Two-column breakdown: Channels & Top Contributors */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="p-4 rounded-[4px] bg-[#18181B] border border-[#2B2D30] space-y-3">
                        <p className="text-xs font-semibold text-[#07C3F2]">
                          Hoạt động theo từng kênh
                        </p>
                        <div className="divide-y divide-[#2B2D30] text-xs">
                          {analytics.messagesByChannel.map((ch) => (
                            <div
                              key={ch.channelId}
                              className="py-2 flex items-center justify-between"
                            >
                              <span className="text-[#E6EDF3] font-mono inline-flex items-center gap-1.5">
                                <span>#{ch.channelName}</span>
                                {ch.isPrivate && (
                                  <LockIcon className="w-3 h-3 text-[#FDB60D]" />
                                )}
                              </span>
                              <span className="font-mono text-[#21D789]">
                                {ch.messageCount} tin nhắn
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 rounded-[4px] bg-[#18181B] border border-[#2B2D30] space-y-3">
                        <p className="text-xs font-semibold text-[#07C3F2]">
                          Thành viên tích cực
                        </p>
                        {analytics.topContributors.length === 0 ? (
                          <p className="text-xs text-[#7D7D7D]">
                            Chưa có dữ liệu tin nhắn.
                          </p>
                        ) : (
                          <div className="divide-y divide-[#2B2D30] text-xs">
                            {analytics.topContributors.map((u) => (
                              <div
                                key={u.userId}
                                className="py-2 flex items-center justify-between"
                              >
                                <span className="text-[#E6EDF3]">
                                  <span className="font-mono text-[#FDB60D] mr-2">
                                    #{u.rank}
                                  </span>
                                  {u.displayName || u.username}
                                </span>
                                <span className="font-mono text-[#07C3F2]">
                                  {u.messageCount} tin nhắn
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Audit Logs */}
                    <div className="p-4 rounded-[4px] bg-[#18181B] border border-[#2B2D30] space-y-3">
                      <p className="text-xs font-semibold text-[#07C3F2]">
                        Nhật ký hoạt động
                      </p>
                      {auditLogs.length === 0 ? (
                        <p className="text-xs text-[#7D7D7D]">
                          Chưa có bản ghi nhật ký quản trị nào.
                        </p>
                      ) : (
                        <div className="divide-y divide-[#2B2D30] text-xs max-h-48 overflow-y-auto">
                          {auditLogs.map((log) => (
                            <div
                              key={log.id}
                              className="py-2 flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <span className="font-mono text-[#21D789] mr-2">
                                  [{log.action}]
                                </span>
                                <span className="text-[#E6EDF3]">
                                  {log.detail || log.targetType}
                                </span>
                                <span className="text-[#7D7D7D] ml-2">
                                  — bởi {log.actor.displayName || log.actor.username}
                                </span>
                              </div>
                              <span className="text-[11px] font-mono text-[#7D7D7D] shrink-0">
                                {new Date(log.createdAt).toLocaleString("vi-VN")}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Sticky Bottom IDE Dialog Footer: OK / Cancel / Apply (Reference Image 5) */}
        <footer
          data-testid="workspace-modal-footer"
          className="h-12 bg-[#1E1F22] border-t border-[#2B2D30] px-4 flex items-center justify-between shrink-0 select-none"
        >
          <span className="text-[11px] text-[#7D7D7D] truncate">
            {isOverviewDirty
              ? "Có thay đổi chưa lưu trong mục Tổng quan."
              : "Cài đặt máy chủ đã được đồng bộ."}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleDialogOk()}
              data-testid="workspace-modal-ok-btn"
              className="ide-btn-primary min-w-[72px]"
            >
              OK
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={closeWorkspaceModal}
              data-testid="workspace-modal-cancel-btn"
              className="ide-btn-secondary min-w-[72px]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!isOverviewDirty || busy}
              onClick={() => void persistOverviewChanges()}
              data-testid="workspace-modal-apply-btn"
              className="ide-btn-secondary min-w-[72px]"
            >
              Apply
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
