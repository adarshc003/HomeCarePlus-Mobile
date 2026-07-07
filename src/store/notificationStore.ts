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
    };
  }),

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