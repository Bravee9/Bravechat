"use client";

import { useSyncExternalStore } from "react";

type Listener = () => void;

/**
 * Store tối giản dựa trên useSyncExternalStore (không cần thêm dependency).
 * Component chỉ re-render khi giá trị mà selector trả về thay đổi (so sánh ===),
 * nên một thay đổi nhỏ (vd. unread của 1 server) không làm re-render cả danh sách.
 */
export interface Store<T> {
  get: () => T;
  set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
  subscribe: (listener: Listener) => () => void;
}

export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<Listener>();

  return {
    get: () => state,
    set: (partial) => {
      const next = typeof partial === "function" ? partial(state) : partial;
      state = { ...state, ...next };
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export function useStore<T, S>(store: Store<T>, selector: (state: T) => S): S {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.get()),
    () => selector(store.get())
  );
}
