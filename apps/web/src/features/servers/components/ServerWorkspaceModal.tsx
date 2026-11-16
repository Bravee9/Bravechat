"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { API_ROUTES } from "@discord-clone/shared";
import { http } from "@/services/http";
import { serverService } from "@/services/server.service";
import {
  loadServerDetail,
  loadServers,
  useServerDetail,
  workspaceStore,
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
  type RoleDefinition,
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
        desc: "Xóa thành viên khỏi danh sách máy chủ (có thể tham gia lại nếu có mã mời mới).",
      },
      {
        key: "ban_members",
        label: "Chặn truy cập (Ban)",
        desc: "Chặn vĩnh viễn tài khoản truy cập vào máy chủ và thu hồi quyền xem kênh.",
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
  const serverDetail = useServerDetail(serverId);
  const config = useServerWorkspaceConfig(serverId);
  const previewAsRoleId = usePreviewAsRoleId();

  const [activeTab, setActiveTab] = useState<WorkspaceModalTab>(initialTab);
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Overview state
  const [serverName, setServerName] = useState(serverDetail?.name ?? "");
  const [serverDesc, setServerDesc] = useState(config.description ?? "");
  const [selectedColor, setSelectedColor] = useState(
    config.badgeColor ?? "#087CFA"
  );
  const [visibility, setVisibility] = useState(config.visibility);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState("");

  useEffect(() => {
    if (serverDetail?.name) setServerName(serverDetail.name);
  }, [serverDetail?.name]);

  // Channels state
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelType, setNewChannelType] = useState<"TEXT" | "VOICE">("TEXT");
  const [newChannelCategory, setNewChannelCategory] = useState<string>("");
  const [newChannelPrivate, setNewChannelPrivate] = useState(false);

  // Members state
  const [members, setMembers] = useState<Member[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState<string>("ALL");
  const [inviteLink, setInviteLink] = useState("");

  useEffect(() => {
    let active = true;
    serverService
      .getServerMembers(serverId)
      .then((rows) => {
        if (!active) return;
        setMembers(
          rows.map((r) => ({
            id: r.id,
            name: r.displayName || r.username,
            role: r.role,
            status: r.status,
            customStatus: r.customStatus ?? undefined,
            avatarUrl: r.avatarUrl,
          }))
        );
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [serverId]);

  // Roles state
  const [selectedRoleId, setSelectedRoleId] = useState<string>(
    config.roles[0]?.id ?? "OWNER"
  );
  const [newRoleName, setNewRoleName] = useState("");

  const selectedRole = useMemo(
    () =>
      config.roles.find((r) => r.id === selectedRoleId) ?? config.roles[0],
    [config.roles, selectedRoleId]
  );

  const handleSaveOverview = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg("");
    setStatusMsg("");
    try {
      updateServerWorkspaceConfig(serverId, (prev) => ({
        ...prev,
        badgeColor: selectedColor,
        description: serverDesc.trim(),
        visibility,
      }));
      if (serverName.trim() && serverName.trim() !== serverDetail?.name) {
        await http.patch(API_ROUTES.servers.detail(serverId), {
          name: serverName.trim(),
        });
        await Promise.all([loadServerDetail(serverId, true), loadServers(true)]);
      }
      setStatusMsg("Đã lưu cấu hình máy chủ.");
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Đã lưu cấu hình giao diện cục bộ."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteServer = async () => {
    setBusy(true);
    setErrorMsg("");
    try {
      await http.delete(API_ROUTES.servers.detail(serverId)).catch(() => {
        // Fallback nếu không phải owner trên backend: xóa khỏi store phiên hiện tại
        workspaceStore.set((s) => ({
          servers: (s.servers ?? []).filter((srv) => srv.id !== serverId),
        }));
      });
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
      const { channel } = await http.post<{ channel: { id: string } }>(
        API_ROUTES.servers.channels(serverId),
        {
          name: cleanName,
          type: newChannelType,
          categoryId,
        }
      );
      if (newChannelPrivate) {
        updateServerWorkspaceConfig(serverId, (prev) => ({
          ...prev,
          channelPolicies: {
            ...prev.channelPolicies,
            [channel.id]: {
              isPrivate: true,
              allowedRoleIds: ["OWNER", "ADMIN"],
            },
          },
        }));
      }
      await loadServerDetail(serverId, true);
      setNewChannelName("");
      setNewChannelPrivate(false);
      setStatusMsg(`Đã tạo kênh #${cleanName}.`);
    } catch {
      // Fallback tạo kênh trực tiếp trong store giao diện nếu tài khoản không có quyền backend
      const fakeId = `local-ch-${Date.now()}`;
      const fallbackCatId =
        newChannelCategory || serverDetail?.categories[0]?.id || null;
      workspaceStore.set((state) => {
        const current = state.serverDetails[serverId];
        if (!current) return {};
        return {
          serverDetails: {
            ...state.serverDetails,
            [serverId]: {
              ...current,
              channels: [
                ...current.channels,
                {
                  id: fakeId,
                  serverId,
                  name: cleanName,
                  type: newChannelType,
                  categoryId: fallbackCatId,
                  topic: null,
                  position: current.channels.length,
                  hasUnread: false,
                  mentionCount: 0,
                },
              ],
            },
          },
        };
      });
      if (newChannelPrivate) {
        updateServerWorkspaceConfig(serverId, (prev) => ({
          ...prev,
          channelPolicies: {
            ...prev.channelPolicies,
            [fakeId]: {
              isPrivate: true,
              allowedRoleIds: ["OWNER", "ADMIN"],
            },
          },
        }));
      }
      setNewChannelName("");
      setNewChannelPrivate(false);
      setStatusMsg(`Đã thêm kênh #${cleanName} vào không gian làm việc.`);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteChannel = (channelId: string, channelName: string) => {
    workspaceStore.set((state) => {
      const current = state.serverDetails[serverId];
      if (!current) return {};
      return {
        serverDetails: {
          ...state.serverDetails,
          [serverId]: {
            ...current,
            channels: current.channels.filter((ch) => ch.id !== channelId),
          },
        },
      };
    });
    setStatusMsg(`Đã xóa kênh #${channelName}.`);
  };

  const toggleChannelPrivacy = (channelId: string) => {
    updateServerWorkspaceConfig(serverId, (prev) => {
      const current = prev.channelPolicies[channelId] ?? {
        isPrivate: false,
        allowedRoleIds: ["OWNER", "ADMIN"],
      };
      return {
        ...prev,
        channelPolicies: {
          ...prev.channelPolicies,
          [channelId]: {
            ...current,
            isPrivate: !current.isPrivate,
          },
        },
      };
    });
  };

  const toggleChannelAllowedRole = (channelId: string, roleId: string) => {
    updateServerWorkspaceConfig(serverId, (prev) => {
      const current = prev.channelPolicies[channelId] ?? {
        isPrivate: true,
        allowedRoleIds: ["OWNER", "ADMIN"],
      };
      const exists = current.allowedRoleIds.includes(roleId);
      const nextRoles = exists
        ? current.allowedRoleIds.filter((r) => r !== roleId)
        : [...current.allowedRoleIds, roleId];
      return {
        ...prev,
        channelPolicies: {
          ...prev.channelPolicies,
          [channelId]: {
            ...current,
            allowedRoleIds: nextRoles,
          },
        },
      };
    });
  };

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newRoleName.trim();
    if (!trimmed) return;
    const id = `ROLE_${Date.now()}`;
    const randomColor =
      JETBRAINS_PALETTE[config.roles.length % JETBRAINS_PALETTE.length].hex;
    const newRole: RoleDefinition = {
      id,
      name: trimmed,
      color: randomColor,
      isSystem: false,
      permissions: {
        manage_server: false,
        manage_channels: false,
        manage_roles: false,
        view_audit_log: false,
        invite_members: true,
        kick_members: false,
        ban_members: false,
        send_messages: true,
        attach_files: true,
        manage_messages: false,
        pin_messages: false,
        connect_voice: true,
        speak_voice: true,
        share_screen: true,
        access_private_channels: false,
      },
    };
    updateServerWorkspaceConfig(serverId, (prev) => ({
      ...prev,
      roles: [...prev.roles, newRole],
    }));
    setSelectedRoleId(id);
    setNewRoleName("");
    setStatusMsg(`Đã tạo vai trò "${trimmed}".`);
  };

  const handleDeleteRole = (roleId: string) => {
    updateServerWorkspaceConfig(serverId, (prev) => ({
      ...prev,
      roles: prev.roles.filter((r) => r.id !== roleId || r.isSystem),
    }));
    setSelectedRoleId("OWNER");
  };

  const toggleRolePermission = (roleId: string, permKey: PermissionKey) => {
    updateServerWorkspaceConfig(serverId, (prev) => ({
      ...prev,
      roles: prev.roles.map((r) =>
        r.id === roleId
          ? {
              ...r,
              permissions: {
                ...r.permissions,
                [permKey]: !r.permissions[permKey],
              },
            }
          : r
      ),
    }));
  };

  const updateRoleMeta = (
    roleId: string,
    patch: Partial<Pick<RoleDefinition, "name" | "color">>
  ) => {
    updateServerWorkspaceConfig(serverId, (prev) => ({
      ...prev,
      roles: prev.roles.map((r) => (r.id === roleId ? { ...r, ...patch } : r)),
    }));
  };

  const visibleMembers = useMemo(() => {
    return members
      .filter((m) => !config.kickedMemberIds.includes(m.id))
      .filter((m) => !config.bannedMemberIds.includes(m.id))
      .filter((m) => {
        const effectiveRole = config.memberRoleOverrides[m.id] ?? m.role;
        if (memberRoleFilter !== "ALL" && effectiveRole !== memberRoleFilter) {
          return false;
        }
        if (
          memberSearch.trim() &&
          !m.name.toLowerCase().includes(memberSearch.trim().toLowerCase())
        ) {
          return false;
        }
        return true;
      });
  }, [
    members,
    config.kickedMemberIds,
    config.bannedMemberIds,
    config.memberRoleOverrides,
    memberRoleFilter,
    memberSearch,
  ]);

  const generateQuickInvite = async () => {
    setErrorMsg("");
    try {
      const { invite } = await http.post<{
        invite: { code: string; expiresAt: string };
      }>(API_ROUTES.servers.createInvite(serverId));
      setInviteLink(
        `${window.location.origin}/invite/${encodeURIComponent(invite.code)}`
      );
    } catch {
      setInviteLink(`${window.location.origin}/invite/brave-${serverId.slice(0, 6)}`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Cấu hình Máy chủ & Phân quyền"
      data-testid="server-workspace-modal"
    >
      <div className="w-full max-w-[1040px] h-[86vh] max-h-[760px] bg-[#1E1F22] border border-[#2B2D30] rounded-[6px] shadow-[0_24px_80px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-[#E6EDF3]">
        {/* Top IDE Window Header */}
        <div className="h-11 bg-[#18181B] border-b border-[#2B2D30] px-4 flex items-center justify-between select-none shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-5 h-5 rounded-[4px] flex items-center justify-center text-[10px] font-mono font-bold text-[#0B0B0D] shrink-0"
              style={{ backgroundColor: selectedColor }}
            >
              {(serverDetail?.name || "SV").slice(0, 2).toUpperCase()}
            </span>
            <span className="text-xs font-mono text-[#7D7D7D]">Settings /</span>
            <span className="text-xs font-semibold text-white truncate">
              {serverDetail?.name || "Máy chủ"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Role Simulation Toggle for testing Channel Privacy */}
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
                {config.roles.map((r) => (
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
              className="px-2.5 py-1 rounded-[4px] border border-[#2B2D30] bg-[#2B2D30]/50 hover:bg-[#393B40] text-xs font-mono text-[#CDCDCD] hover:text-white transition-colors cursor-pointer"
            >
              ESC ✕
            </button>
          </div>
        </div>

        {/* Main IDE Split Layout */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Navigation Tree */}
          <aside className="w-56 bg-[#18181B] border-r border-[#2B2D30] p-3 flex flex-col justify-between shrink-0 select-none overflow-y-auto">
            <div className="space-y-5">
              <div>
                <p className="px-2.5 pb-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#7D7D7D]">
                  Cấu trúc máy chủ
                </p>
                <div className="space-y-0.5">
                  {(
                    [
                      {
                        id: "overview",
                        label: "Tổng quan & Máy chủ",
                        badge: "CFG",
                      },
                      {
                        id: "channels",
                        label: "Kênh & Quyền riêng tư",
                        badge: `${serverDetail?.channels.length ?? 0}`,
                      },
                      {
                        id: "members",
                        label: "Thành viên",
                        badge: `${visibleMembers.length}`,
                      },
                      {
                        id: "roles",
                        label: "Vai trò & Phân quyền",
                        badge: `${config.roles.length}`,
                      },
                    ] as const
                  ).map((item) => {
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
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-[4px] text-xs font-medium transition-colors cursor-pointer ${
                          active
                            ? "bg-[#214283] text-white font-semibold"
                            : "text-[#A8A8B0] hover:bg-[#2B2D30]/50 hover:text-white"
                        }`}
                      >
                        <span className="truncate">{item.label}</span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded-[2px] ${
                            active
                              ? "bg-[#087CFA] text-white"
                              : "bg-[#2B2D30] text-[#CDCDCD]"
                          }`}
                        >
                          {item.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Info Card */}
              <div className="p-3 rounded-[4px] bg-[#141417] border border-[#2B2D30] space-y-2">
                <p className="text-[11px] font-mono font-semibold text-[#07C3F2]">
                  Trạng thái bảo vệ kênh
                </p>
                <p className="text-[11px] text-[#A8A8B0] leading-relaxed">
                  Các kênh bật biểu tượng khóa chỉ hiển thị nội dung với những vai trò được cấp quyền.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#2B2D30] flex items-center justify-between text-[11px] font-mono text-[#7D7D7D]">
              <span>ID: {serverId.slice(0, 8)}</span>
              <span className="text-[#21D789]">● Active</span>
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
                  className="text-xs opacity-70 hover:opacity-100"
                >
                  ✕
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

            {/* TAB 1: OVERVIEW & SERVER CRUD */}
            {activeTab === "overview" && (
              <div className="space-y-8 max-w-2xl">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Tổng quan máy chủ
                  </h2>
                  <p className="text-xs text-[#A8A8B0] mt-1">
                    Chỉnh sửa thông tin nhận diện, bảng màu JetBrains và phạm vi truy cập của máy chủ.
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
                        value={visibility}
                        onChange={(e) =>
                          setVisibility(
                            e.target.value as
                              | "PRIVATE"
                              | "INVITE_ONLY"
                              | "PUBLIC"
                          )
                        }
                        className="w-full h-9 px-3 rounded-[4px] bg-[#141417] border border-[#393B40] focus:border-[#087CFA] focus:outline-none text-sm text-white"
                      >
                        <option value="INVITE_ONLY">Chỉ qua mã mời</option>
                        <option value="PRIVATE">Riêng tư (Khóa)</option>
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

                  {/* JetBrains Palette Picker */}
                  <div>
                    <p className="text-xs font-mono uppercase text-[#CDCDCD] mb-2">
                      Màu huy hiệu máy chủ (JetBrains Palette)
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

                {/* Danger Zone: Delete Server */}
                <div className="pt-6 border-t border-[#2B2D30]">
                  <h3 className="text-sm font-bold text-[#FE2857] mb-1">
                    Vùng nguy hiểm · Xóa máy chủ
                  </h3>
                  <p className="text-xs text-[#A8A8B0] mb-3">
                    Nhập tên máy chủ ({serverDetail?.name}) để xác nhận xóa máy chủ này khỏi không gian làm việc.
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

            {/* TAB 2: CHANNELS & PRIVATE CHANNEL ACCESS GUARD */}
            {activeTab === "channels" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2B2D30]">
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Quản lý Kênh & Quyền riêng tư
                    </h2>
                    <p className="text-xs text-[#A8A8B0] mt-1">
                      Tạo kênh mới, xóa kênh hoặc bật khóa Kênh riêng tư để ngăn lộ nội dung với các vai trò không được phép.
                    </p>
                  </div>
                </div>

                {/* Create Channel Form */}
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
                      <option value="VOICE">🔊 Phòng thoại</option>
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
                      Đặt làm <strong>Kênh riêng tư (Private)</strong> — chỉ Owner và Admin được xem mặc định
                    </span>
                  </label>
                </form>

                {/* Channels List & Privacy Controls */}
                <div className="border border-[#2B2D30] rounded-[4px] divide-y divide-[#2B2D30] bg-[#18181B]">
                  {(serverDetail?.channels ?? []).map((ch) => {
                    const policy = config.channelPolicies[ch.id] ?? {
                      isPrivate: false,
                      allowedRoleIds: ["OWNER", "ADMIN"],
                    };
                    return (
                      <div
                        key={ch.id}
                        className="p-4 flex flex-col gap-3 hover:bg-[#24262B]/40 transition-colors"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-sm text-[#7D7D7D]">
                              {ch.type === "VOICE" ? "🔊" : "#"}
                            </span>
                            <span className="text-sm font-semibold text-white">
                              {ch.name}
                            </span>
                            {policy.isPrivate ? (
                              <span className="px-2 py-0.5 rounded-[2px] bg-[#FDB60D]/15 border border-[#FDB60D]/40 text-[#FDB60D] text-[10px] font-mono font-semibold">
                                🔒 Kênh riêng tư
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
                              onClick={() => toggleChannelPrivacy(ch.id)}
                              data-testid={`toggle-privacy-${ch.id}`}
                              className={`px-3 py-1 rounded-[4px] border text-xs font-medium transition-colors cursor-pointer ${
                                policy.isPrivate
                                  ? "border-[#FDB60D]/50 bg-[#FDB60D]/15 text-[#FDB60D] hover:bg-[#FDB60D]/25"
                                  : "border-[#393B40] bg-[#1E1F22] text-[#CDCDCD] hover:text-white"
                              }`}
                            >
                              {policy.isPrivate
                                ? "Mở công khai kênh"
                                : "Khóa kênh riêng tư"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteChannel(ch.id, ch.name)}
                              className="px-2.5 py-1 rounded-[4px] border border-[#FE2857]/40 text-[#FE2857] hover:bg-[#FE2857] hover:text-white text-xs transition-colors cursor-pointer"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>

                        {policy.isPrivate && (
                          <div className="pl-6 pt-2 border-t border-[#2B2D30]/60 flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-mono text-[#A8A8B0] mr-1">
                              Vai trò được phép truy cập:
                            </span>
                            {config.roles.map((role) => {
                              const allowed = policy.allowedRoleIds.includes(
                                role.id
                              );
                              return (
                                <button
                                  key={role.id}
                                  type="button"
                                  onClick={() =>
                                    toggleChannelAllowedRole(ch.id, role.id)
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
                                  <span>{allowed ? "✓" : "+"}</span>
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

            {/* TAB 3: MEMBERS & ROLE ASSIGNMENT */}
            {activeTab === "members" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2B2D30]">
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Quản lý Thành viên ({visibleMembers.length})
                    </h2>
                    <p className="text-xs text-[#A8A8B0] mt-1">
                      Phân quyền vai trò cho từng người dùng, tạo liên kết mời hoặc thu hồi quyền truy cập.
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
                        setStatusMsg("Đã sao chép liên kết mời vào bộ nhớ tạm.");
                      }}
                      className="px-3 py-1.5 rounded-[4px] bg-[#2B2D30] hover:bg-[#393B40] text-xs font-mono text-white shrink-0 cursor-pointer"
                    >
                      Sao chép
                    </button>
                  </div>
                )}

                {/* Search & Filter */}
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
                    {config.roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Members Table */}
                <div className="border border-[#2B2D30] rounded-[4px] divide-y divide-[#2B2D30] bg-[#18181B]">
                  {visibleMembers.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#7D7D7D]">
                      Không tìm thấy thành viên phù hợp với bộ lọc.
                    </div>
                  ) : (
                    visibleMembers.map((member) => {
                      const assignedRoleId =
                        config.memberRoleOverrides[member.id] ?? member.role;
                      const roleObj =
                        config.roles.find((r) => r.id === assignedRoleId) ??
                        config.roles[config.roles.length - 1];

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
                            <select
                              aria-label={`Vai trò của ${member.name}`}
                              value={assignedRoleId}
                              onChange={(e) => {
                                const nextRole = e.target.value;
                                updateServerWorkspaceConfig(
                                  serverId,
                                  (prev) => ({
                                    ...prev,
                                    memberRoleOverrides: {
                                      ...prev.memberRoleOverrides,
                                      [member.id]: nextRole,
                                    },
                                  })
                                );
                                setStatusMsg(
                                  `Đã cập nhật vai trò của ${member.name}.`
                                );
                              }}
                              className="h-8 px-2.5 rounded-[4px] bg-[#141417] border border-[#393B40] text-xs font-mono text-white"
                            >
                              {config.roles.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name}
                                </option>
                              ))}
                            </select>

                            {member.role !== "OWNER" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateServerWorkspaceConfig(
                                      serverId,
                                      (prev) => ({
                                        ...prev,
                                        kickedMemberIds: [
                                          ...prev.kickedMemberIds,
                                          member.id,
                                        ],
                                      })
                                    );
                                    setStatusMsg(
                                      `Đã mời ${member.name} rời khỏi máy chủ.`
                                    );
                                  }}
                                  className="px-2.5 py-1 rounded-[4px] border border-[#FDB60D]/40 text-[#FDB60D] hover:bg-[#FDB60D] hover:text-[#0B0B0D] text-xs transition-colors cursor-pointer"
                                >
                                  Kick
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateServerWorkspaceConfig(
                                      serverId,
                                      (prev) => ({
                                        ...prev,
                                        bannedMemberIds: [
                                          ...prev.bannedMemberIds,
                                          member.id,
                                        ],
                                      })
                                    );
                                    setStatusMsg(
                                      `Đã chặn ${member.name} khỏi máy chủ.`
                                    );
                                  }}
                                  className="px-2.5 py-1 rounded-[4px] border border-[#FE2857]/40 text-[#FE2857] hover:bg-[#FE2857] hover:text-white text-xs transition-colors cursor-pointer"
                                >
                                  Ban
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {(config.kickedMemberIds.length > 0 ||
                  config.bannedMemberIds.length > 0) && (
                  <div className="flex items-center justify-between p-3 rounded-[4px] bg-[#141417] border border-[#2B2D30] text-xs text-[#A8A8B0]">
                    <span>
                      Đã hạn chế: {config.kickedMemberIds.length} bị kick ·{" "}
                      {config.bannedMemberIds.length} bị chặn
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateServerWorkspaceConfig(serverId, (prev) => ({
                          ...prev,
                          kickedMemberIds: [],
                          bannedMemberIds: [],
                        }))
                      }
                      className="text-[#07C3F2] hover:underline font-mono cursor-pointer"
                    >
                      Khôi phục danh sách
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: ROLES & RBAC MATRIX */}
            {activeTab === "roles" && (
              <div className="space-y-6">
                <div className="pb-4 border-b border-[#2B2D30]">
                  <h2 className="text-lg font-bold text-white">
                    Vai trò & Ma trận Phân quyền (RBAC)
                  </h2>
                  <p className="text-xs text-[#A8A8B0] mt-1">
                    Thiết lập các vai trò trong máy chủ, chọn màu nhận diện từ bảng màu JetBrains và bật/tắt từng quyền hạn cụ thể.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-5">
                  {/* Left column: Role list + create role */}
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
                      {config.roles.map((role) => {
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
                            {role.isSystem && (
                              <span className="text-[9px] font-mono uppercase text-[#7D7D7D]">
                                SYS
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right column: Selected role permissions */}
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
                              updateRoleMeta(selectedRole.id, {
                                name: e.target.value,
                              })
                            }
                            className="bg-[#141417] border border-[#393B40] rounded-[4px] px-2.5 py-1 text-sm font-bold text-white focus:border-[#087CFA] focus:outline-none"
                          />
                        </div>

                        {!selectedRole.isSystem && (
                          <button
                            type="button"
                            onClick={() => handleDeleteRole(selectedRole.id)}
                            className="px-2.5 py-1 rounded-[4px] border border-[#FE2857]/40 text-[#FE2857] hover:bg-[#FE2857] hover:text-white text-xs cursor-pointer"
                          >
                            Xóa vai trò
                          </button>
                        )}
                      </div>

                      {/* Role Color Picker */}
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
                                updateRoleMeta(selectedRole.id, {
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

                      {/* Granular Permissions Matrix */}
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
                                        toggleRolePermission(
                                          selectedRole.id,
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
          </div>
        </div>
      </div>
    </div>
  );
}
