import {
  getMessaging,
  getToken,
  onTokenRefresh,
  requestPermission,
  AuthorizationStatus,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
} from '@react-native-firebase/messaging';

import {getApp} from '@react-native-firebase/app';

import {PermissionsAndroid, Platform} from 'react-native';

import {
  registerFCMToken,
  unregisterFCMToken,
} from './notificationApi';

import {useNotificationStore} from '../store/notificationStore';

import {getString} from '../utils/notificationParser';

import {
  navigationRef,
} from '../navigation/navigationRef';

const messaging = getMessaging(getApp());

let currentToken: string | null = null;

export const requestNotificationPermission =
  async () => {
    try {
      if (
        Platform.OS === 'android' &&
        Platform.Version >= 33
      ) {
        const granted =
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS
              .POST_NOTIFICATIONS,
          );

        if (
          granted !==
          PermissionsAndroid.RESULTS.GRANTED
        ) {
          return;
        }
      }

const status =
  await requestPermission(messaging);

if (
  status !== AuthorizationStatus.AUTHORIZED &&
  status !== AuthorizationStatus.PROVISIONAL
) {
  return;
}
    } catch (error) {
      console.log(error);
    }
  };

export const initializeNotifications =
  async () => {
    try {
      currentToken = await getToken(messaging);

      if (currentToken) {
  if (currentToken) {
  try {
    await registerFCMToken(currentToken);
  } catch (error) {
    console.log(
      'FCM registration skipped',
      error,
    );
  }
}
}

onMessage(
  messaging,
  async remoteMessage => {
const title = getString(
  remoteMessage.notification?.title,
  getString(
    remoteMessage.data?.title_en,
    '',
  ),
);

const body = getString(
  remoteMessage.notification?.body,
  getString(
    remoteMessage.data?.body_en,
    '',
  ),
);

const notificationItem = {
  type: getString(
    remoteMessage.data?.type,
    'general',
  ),

title: {
  en: title,

  ar: getString(
    remoteMessage.data?.title_ar,
    title,
  ),
},

body: {
  en: body,

  ar: getString(
    remoteMessage.data?.body_ar,
    body,
  ),
},
  data: remoteMessage.data,
};

const store =
  useNotificationStore.getState();

// FCM guarantees at-least-once delivery — it can redeliver the same push
// to the same device, and the payload carries no unique notification ID
// to correlate against. Treat an identical type/text/data arriving again
// as a redelivery of the same event, not a new one.
const isDuplicate = store.notifications.some(
  item =>
    item.type === notificationItem.type &&
    item.title.en === notificationItem.title.en &&
    item.body.en === notificationItem.body.en &&
    JSON.stringify(item.data ?? {}) ===
      JSON.stringify(notificationItem.data ?? {}),
);

if (isDuplicate) {
  return;
}

store.addNotification(
  notificationItem,
);

store.showBanner(
  notificationItem,
);
  },
);

onTokenRefresh(
  messaging,
  async token => {
    currentToken = token;

    await registerFCMToken(token);
  },
);

onNotificationOpenedApp(
  messaging,
  remoteMessage => {
const bookingId = getString(
  remoteMessage.data?.bookingId,
);

    if (
      bookingId &&
      navigationRef.isReady()
    ) {
      navigationRef.navigate(
        'BookingDetails',
        {
          bookingNumber: bookingId,
        },
      );
    }
  },
);

const initialNotification =
  await getInitialNotification(
    messaging,
  );

const initialBookingId =
  getString(
    initialNotification?.data?.bookingId,
  );

if (
  initialBookingId &&
  navigationRef.isReady()
) {
  navigationRef.navigate(
    'BookingDetails',
    {
      bookingNumber:
        initialBookingId,
    },
  );
}

    } catch (error) {
      console.error(
  'Notification Error:',
  error,
);
    }
  };

let registrationPromise: Promise<void> | null = null;

// Memoized so booking screens can await the SAME in-flight registration
// that NotificationProvider kicked off at app start, instead of re-running
// requestPermission/getToken/registerFCMToken (which would re-attach
// onMessage/onTokenRefresh listeners).
export const registerForPushNotifications = () => {
  if (!registrationPromise) {
    registrationPromise = (async () => {
      await requestNotificationPermission();
      await initializeNotifications();
    })();
  }

  return registrationPromise;
};

// Lets a booking flow wait for FCM token registration to reach the backend
// before creating a booking, without blocking indefinitely if permission is
// denied or registration is slow — bounded by timeoutMs.
export const waitForPushRegistration = async (timeoutMs = 6000) => {
  await Promise.race([
    registerForPushNotifications(),
    new Promise(resolve => setTimeout(resolve, timeoutMs)),
  ]);
};

// registerForPushNotifications() runs once at app cold start and is
// memoized — on a fresh install that first attempt happens BEFORE the user
// has logged in, so the backend rejects the register-token call (no JWT
// yet) and the memoized promise resolves having failed silently. Nothing
// ever retries it, which is why the token only ends up registered after a
// full app restart (a fresh process re-runs the app-start attempt, by
// which point a session already exists in AsyncStorage). Call this right
// after a successful login to re-send the SAME already-obtained token —
// no new permission prompt, no new getToken() call — now that a valid
// session exists.
export const reregisterFCMToken = async () => {
  if (!currentToken) {
    return;
  }

  try {
    await registerFCMToken(currentToken);
  } catch (error) {
    console.log('FCM registration skipped', error);
  }
};

export const getCurrentFCMToken = () =>
  currentToken;

export const unregisterCurrentToken =
  async () => {
    try {
      if (!currentToken) {
        return;
      }

      await unregisterFCMToken(
        currentToken,
      );

      currentToken = null;

    } catch (error) {
      console.log(error);
    }
  };