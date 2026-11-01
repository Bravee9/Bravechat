"use client";
import { createStore } from "@/lib/store";
// Thanh hồ sơ và phòng LiveKit chia sẻ cùng trạng thái thay vì bật/tắt icon riêng lẻ.
export const audioStore = createStore({ muted: false, deafened: false });
