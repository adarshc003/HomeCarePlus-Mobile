import {Platform} from 'react-native';

import API from './api';

export const registerFCMToken = (
  token: string,
) => {
  return API.post(
    '/notifications/register-token',
    {
      token,
      platform: Platform.OS,
    },
  );
};

export const unregisterFCMToken = (
  token: string,
) => {
  return API.post(
    '/notifications/unregister-token',
    {
      token,
    },
  );
};

export const getNotifications = (
  page = 1,
  limit = 20,
) => {
  return API.get(
    `/notifications?page=${page}&limit=${limit}`,
  );
};

export const getUnreadCount = () => {
  return API.get(
    '/notifications/unread-count',
  );
};

export const markNotificationRead = (
  id: string,
) => {
  return API.patch(
    `/notifications/${id}/read`,
  );
};

export const markAllNotificationsRead =
  () => {
    return API.patch(
      '/notifications/read-all',
    );
  };

export const deleteNotification = (
  id: string,
) => {
  return API.delete(
    `/notifications/${id}`,
  );
};