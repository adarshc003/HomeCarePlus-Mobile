import {create} from 'zustand';

export interface NotificationItem {
  _id?: string;

  id?: string;

  type: string;

  title: {
    en: string;
    ar: string;
  };

  body: {
    en: string;
    ar: string;
  };

  data?: Record<
    string,
    unknown
  >;

  isRead?: boolean;

  createdAt?: string;
}

interface NotificationState {
  notifications: NotificationItem[];

  unreadCount: number;

  bannerVisible: boolean;

  currentNotification: NotificationItem | null;

  loading: boolean;

  refreshing: boolean;

  // Bumped by every local mutation (markRead, markAllRead). Screens use
  // this to detect whether a fetch that started before their mutation is
  // still in flight, and skip applying it if so — otherwise a slower,
  // earlier GET /notifications can resolve after the mutation and silently
  // overwrite the just-corrected read state with stale (pre-mutation) data.
  mutationVersion: number;

  setNotifications: (
    notifications: NotificationItem[],
  ) => void;

  addNotification: (
    notification: NotificationItem,
  ) => void;

  showBanner: (
    notification: NotificationItem,
  ) => void;

  hideBanner: () => void;

  setUnreadCount: (
    count: number,
  ) => void;

  markRead: (id: string) => void;

  markAllRead: () => void;

  removeNotification: (id: string) => void;

  setLoading: (
    value: boolean,
  ) => void;

  setRefreshing: (
    value: boolean,
  ) => void;
}

export const useNotificationStore =
  create<NotificationState>(set => ({
    notifications: [],

    unreadCount: 0,

    bannerVisible: false,

    currentNotification: null,

    loading: false,

    refreshing: false,

    mutationVersion: 0,

    setNotifications: notifications =>
      set({
        notifications,
      }),

    addNotification: notification =>
      set(state => ({
        notifications: [
          notification,
          ...state.notifications,
        ],

        unreadCount:
          state.unreadCount + 1,
      })),

    showBanner: currentNotification =>
      set({
        currentNotification,
        bannerVisible: true,
      }),

    hideBanner: () =>
      set({
        bannerVisible: false,
      }),

    setUnreadCount: unreadCount =>
      set({
        unreadCount,
      }),

markRead: id =>
  set(state => {
    const target = state.notifications.find(
      item => item.id === id || item._id === id,
    );

    const wasUnread = !!target && !target.isRead;

    return {
      notifications:
        state.notifications.map(item =>
          (item.id === id ||
            item._id === id)
            ? {
                ...item,
                isRead: true,
              }
            : item,
        ),

      unreadCount: wasUnread
        ? Math.max(0, state.unreadCount - 1)
        : state.unreadCount,

      mutationVersion: state.mutationVersion + 1,
    };
  }),

// One atomic state transition instead of the caller looping and calling
// markRead() per item — N sequential set() calls each produce their own
// FlatList re-render, and on Android that rapid render churn on elevated
// cards left some rows visually stuck mid-transition until the screen was
// remounted. A single array replacement + single re-render doesn't hit that.
markAllRead: () =>
  set(state => ({
    notifications: state.notifications.map(item =>
      item.isRead ? item : {...item, isRead: true},
    ),
    unreadCount: 0,
    mutationVersion: state.mutationVersion + 1,
  })),

removeNotification: id =>
  set(state => {
    const target = state.notifications.find(
      item => item.id === id || item._id === id,
    );

    const wasUnread = !!target && !target.isRead;

    return {
      notifications: state.notifications.filter(
        item => item.id !== id && item._id !== id,
      ),

      unreadCount: wasUnread
        ? Math.max(0, state.unreadCount - 1)
        : state.unreadCount,
    };
  }),

    setLoading: loading =>
      set({
        loading,
      }),

    setRefreshing: refreshing =>
      set({
        refreshing,
      }),
  }));