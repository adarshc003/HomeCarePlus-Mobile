import React, {
  useEffect,
  ReactNode,
} from 'react';

import {
  registerForPushNotifications,
} from '../services/notificationService';

import NotificationBanner from '../components/common/NotificationBanner';

import {getUnreadCount} from '../services/notificationApi';

import {useNotificationStore} from '../store/notificationStore';

import {AppState} from 'react-native';

interface Props {
  children: ReactNode;
}

const NotificationProvider = ({
  children,
}: Props) => {
  const setUnreadCount =
    useNotificationStore(
      state => state.setUnreadCount,
    );
    const refreshUnreadCount = async () => {
  try {
    const response =
      await getUnreadCount();

    setUnreadCount(
      response.data.count || 0,
    );
  } catch (error) {
    console.log(error);
  }
};

  useEffect(() => {
    const init = async () => {
      try {
        await registerForPushNotifications();

await refreshUnreadCount();
      } catch (error) {
        console.log(error);
      }
    };

    init();
  }, []);

  useEffect(() => {
  const subscription =
    AppState.addEventListener(
      'change',
      state => {
        if (state === 'active') {
          refreshUnreadCount();
        }
      },
    );

  return () => subscription.remove();
}, []);

  return (
    <>
      {children}

      <NotificationBanner />
    </>
  );
};

export default NotificationProvider;