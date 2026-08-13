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

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  registerFCMToken,
  unregisterFCMToken,
} from './notificationApi';

import {useNotificationStore} from '../store/notificationStore';

import {getString} from '../utils/notificationParser';

import {
  navigationRef,
} from '../navigation/navigationRef';

import {
  getBookingNumberById,
} from './bookingService';

const messaging = getMessaging(getApp());

// Some ERP-dispatched notification types (cancelled, assigned, etc.) send
// the booking's internal numeric id in bookingId rather than its
// bookingNumber (e.g. "HCP-000102") — same inconsistency already worked
// around in NotificationCard.tsx for in-app taps. Background/killed-state
// taps go through this same resolution so cold-start opens don't 404.
export const navigateToBookingFromPush = async (bookingId: string) => {
  try {
    const bookingNumber = /^\d+$/.test(bookingId)
      ? (await getBookingNumberById(bookingId)).bookingNumber
      : bookingId;

    if (!bookingNumber) {
      return;
    }

    // On a cold start from a killed-state notification tap, navigationRef
    // may not have finished its initial state hydration yet. Several
    // awaited native calls (permission request, getToken(),
    // registerFCMToken()) already precede this call, which narrows the
    // race in practice, but doesn't structurally guarantee it — silently
    // dropping the navigation here previously had no retry at all. Poll
    // briefly (up to ~3s) instead of giving up on the very first check.
    for (let attempt = 0; attempt < 20; attempt++) {
      if (navigationRef.isReady()) {
        navigationRef.navigate('BookingDetails', {bookingNumber});
        return;
      }

      await new Promise<void>(resolve => setTimeout(() => resolve(), 150));
    }

    console.log(
      'navigationRef never became ready; dropping push navigation to',
      bookingNumber,
    );
  } catch (error) {
    console.log(error);
  }
};

// FCM's own dedup (below, in onMessage) only checked the in-memory
// notifications list — which gets fully REPLACED on every NotificationScreen
// load (paginated, 20 items) and resets to [] on app restart. A genuine FCM
// redelivery (guaranteed at-least-once, can resend the same push) arriving
// after either of those had already happened slipped through as a new
// notification. This persists a small bounded set of recently-seen
// notificationId values across restarts.
const RECENT_NOTIFICATION_IDS_KEY = 'recentPushNotificationIds';
const MAX_RECENT_NOTIFICATION_IDS = 50;

const wasNotificationRecentlySeen = async (id: string) => {
  try {
    const raw = await AsyncStorage.getItem(RECENT_NOTIFICATION_IDS_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    return ids.includes(id);
  } catch (error) {
    console.log(error);
    return false;
  }
};

const rememberNotificationId = async (id: string) => {
  try {
    const raw = await AsyncStorage.getItem(RECENT_NOTIFICATION_IDS_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];

    const updated = [
      id,
      ...ids.filter(existing => existing !== id),
    ].slice(0, MAX_RECENT_NOTIFICATION_IDS);

    await AsyncStorage.setItem(
      RECENT_NOTIFICATION_IDS_KEY,
      JSON.stringify(updated),
    );
  } catch (error) {
    console.log(error);
  }
};

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
    // getToken() failing (no Play Services, no network, etc.) previously
    // aborted this entire function via the single try/catch that used to
    // wrap everything below — which meant onMessage/onTokenRefresh/
    // onNotificationOpenedApp were never registered either, permanently
    // disabling all push handling for the session even though those
    // listeners have nothing to do with whether getToken() itself
    // succeeded. Isolating it here lets listener registration proceed
    // regardless.
    try {
      currentToken = await getToken(messaging);
    } catch (error) {
      console.log('FCM getToken failed', error);
      currentToken = null;
    }

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

    try {

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
  // Now forwarded by the backend (services/notificationService.js) —
  // without a stable id, the FlatList keyExtractor fell back to
  // Date.now(), which is unstable across renders and can collide when
  // multiple notifications arrive in the same millisecond.
  _id: getString(
    remoteMessage.data?.notificationId,
    '',
  ) || undefined,

  createdAt: getString(
    remoteMessage.data?.createdAt,
    '',
  ) || new Date().toISOString(),

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
// to the same device. The backend now forwards a stable notificationId
// (see notificationItem._id above), so prefer matching on that when
// present — the type/title/body/data heuristic stays as a fallback for
// any payload that happens to omit it. Checking the in-memory list alone
// isn't enough: it gets fully replaced on every NotificationScreen load
// (paginated) and resets on app restart, so a redelivery arriving after
// either of those also needs the persisted recently-seen check below.
const isDuplicateInMemory = store.notifications.some(
  item =>
    (notificationItem._id && item._id === notificationItem._id) ||
    (item.type === notificationItem.type &&
      item.title.en === notificationItem.title.en &&
      item.body.en === notificationItem.body.en &&
      JSON.stringify(item.data ?? {}) ===
        JSON.stringify(notificationItem.data ?? {})),
);

const isDuplicatePersisted =
  notificationItem._id
    ? await wasNotificationRecentlySeen(notificationItem._id)
    : false;

if (isDuplicateInMemory || isDuplicatePersisted) {
  return;
}

if (notificationItem._id) {
  await rememberNotificationId(notificationItem._id);
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
  async remoteMessage => {
const bookingId = getString(
  remoteMessage.data?.bookingId,
);

    if (bookingId) {
      await navigateToBookingFromPush(bookingId);
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

if (initialBookingId) {
  await navigateToBookingFromPush(initialBookingId);
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
  // currentToken is populated by initializeNotifications()'s getToken() call,
  // which races against a user rushing through a mid-booking login (Schedule
  // -> Login -> Otp) on a fresh/logged-out app start. If that race hasn't
  // resolved yet, currentToken is still null here — silently returning meant
  // the token registered with the backend after login could permanently stay
  // stale/missing for the rest of the session. Fetch it directly instead of
  // assuming it's already been obtained elsewhere.
  let token = currentToken;

  if (!token) {
    try {
      token = await getToken(messaging);
      currentToken = token;
    } catch (error) {
      console.log('FCM getToken failed during reregister', error);
      return;
    }
  }

  try {
    await registerFCMToken(token);
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