import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import auth from '@react-native-firebase/auth';
import {unregisterCurrentToken} from '../services/notificationService';
import {useBookingStore} from './bookingStore';
import {useNotificationStore} from './notificationStore';
import {useAppDataStore} from './appDataStore';
import {useOfferStore} from './offerStore';
import {resetBackgroundLoading} from '../init/backgroundLoader';

interface AuthState {
  isLoggedIn: boolean;
  token: string | null;
  user: any;
  primaryPhone: string;

login: (
  token: string,
  user: any,
  primaryPhone: string,
) => Promise<void>;

  logout: () => Promise<void>;

  loadUser: () => Promise<void>;

  updateUser: (user: any) => Promise<void>;
}

export const useAuthStore =
  create<AuthState>((set) => ({
isLoggedIn: false,
token: null,
user: null,
primaryPhone: '',

login: async (
  token,
  user,
  primaryPhone,
) => {
  // Keychain/Keystore-backed secure storage, not AsyncStorage — the JWT
  // authenticates every booking/payment/profile request for up to 30
  // days, and AsyncStorage is unencrypted at rest on both platforms.
  await Keychain.setGenericPassword(
    'token',
    String(token || ''),
  );

  // Keychain/Keystore-backed, same as the token above — profile/phone are
  // PII, not just app state, so they shouldn't sit in plaintext AsyncStorage.
  await Keychain.setGenericPassword(
    'user',
    JSON.stringify(user || {}),
    {service: 'user'},
  );

  await Keychain.setGenericPassword(
    'primaryPhone',
    primaryPhone,
    {service: 'primaryPhone'},
  );

  // Read by LoginScreen to show "Welcome Back" instead of "Welcome" for
  // returning users — was previously read but never written anywhere.
  await AsyncStorage.setItem('hasLoggedIn', 'true');

set({
  isLoggedIn: true,
  token,
  user,
  primaryPhone,
});

},

updateUser: async updatedUser => {

  await Keychain.setGenericPassword(
    'user',
    JSON.stringify(updatedUser),
    {service: 'user'},
  );

  set({
    user: updatedUser,
  });

},

    logout: async () => {
      // Detach this device's FCM token from the departing customer in ERP
      // before clearing the session — otherwise the token stays associated
      // with them indefinitely (register_fcm_token only re-associates it
      // on the NEXT login, via upsert-by-token, leaving a window where a
      // logged-out user's device is still a valid push target for their
      // old account). Best-effort: a failure here must never block logout.
      try {
        await unregisterCurrentToken();
      } catch (error) {
        console.log(error);
      }

      // The app's own session (JWT/user/stores below) is separate from
      // Firebase Auth's own native session, established during phone-number
      // OTP sign-in — without this, Firebase considers the user still
      // signed in after logout, which can leave stale verifier/session
      // state around for the next login's signInWithPhoneNumber() call.
      // Best-effort, same as unregisterCurrentToken above: must never block
      // logout.
      try {
        await auth().signOut();
      } catch (error) {
        console.log(error);
      }

      await Keychain.resetGenericPassword();
      await Keychain.resetGenericPassword({service: 'user'});
      await Keychain.resetGenericPassword({service: 'primaryPhone'});

      // Belt-and-suspenders: clears any leftover legacy AsyncStorage values
      // for a user who logged in on a pre-migration app build and never
      // reopened the app (so loadUser()'s migration below never ran)
      // before eventually logging out here.
      await AsyncStorage.removeItem(
        'token',
      );

await AsyncStorage.removeItem(
  'user',
);

await AsyncStorage.removeItem(
  'primaryPhone',
);

set({
  isLoggedIn: false,
  token: null,
  user: null,
  primaryPhone: '',
});

// Other stores hold the departing customer's data in memory (bookings,
// notifications, cached addresses/packages/offers) and are otherwise
// never reset — without this, a second person logging in on the same
// still-running app (a shared/family device) can briefly see the
// previous customer's data before a fresh fetch overwrites it.
useBookingStore.setState({bookings: []});

// clearBooking() resets the IN-PROGRESS booking draft (selected service/
// package/add-ons/address/schedule) — disjoint from `bookings` above (the
// completed-bookings history), so both are needed. Without this, an
// abandoned mid-booking draft (e.g. logging out from Profile instead of
// backing out through Service Details) survives into the next login on
// the same device: ScheduleScreen seeds its date/time straight from this
// store with no validation, so a stale date/time could be submitted by a
// DIFFERENT customer without them ever touching those fields.
useBookingStore.getState().clearBooking();

useOfferStore.getState().clearOffer();

useNotificationStore.setState({
  notifications: [],
  unreadCount: 0,
  bannerVisible: false,
  currentNotification: null,
});

useAppDataStore.setState({
  addresses: [],
  packages: {},
  addOns: {},
  offers: [],
});

// The cache above is now empty, but backgroundLoader.ts's one-shot guard
// would otherwise stay tripped for the rest of the app process — without
// this, every service's packages/add-ons silently stay empty for the next
// login in this same session (Home's mount effect calls
// startBackgroundLoading() again, but it would just no-op).
resetBackgroundLoading();
    },

    loadUser: async () => {
      let token: string | null = null;

      try {
        // Migrating the JWT off AsyncStorage (unencrypted at rest on both
        // platforms) onto Keychain/Keystore-backed secure storage. This
        // one-time migration moves an already-logged-in user's legacy
        // token across so the change doesn't force everyone to log in
        // again on update.
        const credentials =
          await Keychain.getGenericPassword();

        if (credentials) {
          token = credentials.password;
        } else {
          const legacyToken =
            await AsyncStorage.getItem('token');

          if (legacyToken) {
            await Keychain.setGenericPassword(
              'token',
              legacyToken,
            );
            await AsyncStorage.removeItem('token');
            token = legacyToken;
          }
        }
      } catch (error) {
        console.log(
          'Keychain read failed, falling back to AsyncStorage:',
          error,
        );
        token = await AsyncStorage.getItem('token');
      }

      let user: string | null = null;

      try {
        const userCredentials = await Keychain.getGenericPassword({
          service: 'user',
        });

        if (userCredentials) {
          user = userCredentials.password;
        } else {
          const legacyUser = await AsyncStorage.getItem('user');

          if (legacyUser) {
            await Keychain.setGenericPassword('user', legacyUser, {
              service: 'user',
            });
            await AsyncStorage.removeItem('user');
            user = legacyUser;
          }
        }
      } catch (error) {
        console.log(
          'Keychain read failed, falling back to AsyncStorage:',
          error,
        );
        user = await AsyncStorage.getItem('user');
      }

      let primaryPhone: string | null = null;

      try {
        const phoneCredentials = await Keychain.getGenericPassword({
          service: 'primaryPhone',
        });

        if (phoneCredentials) {
          primaryPhone = phoneCredentials.password;
        } else {
          const legacyPhone = await AsyncStorage.getItem('primaryPhone');

          if (legacyPhone) {
            await Keychain.setGenericPassword('primaryPhone', legacyPhone, {
              service: 'primaryPhone',
            });
            await AsyncStorage.removeItem('primaryPhone');
            primaryPhone = legacyPhone;
          }
        }
      } catch (error) {
        console.log(
          'Keychain read failed, falling back to AsyncStorage:',
          error,
        );
        primaryPhone = await AsyncStorage.getItem('primaryPhone');
      }

if (
  token &&
  user &&
  primaryPhone
) {

  // A corrupted stored blob (e.g. a prior session killed mid-write) must
  // not throw here — this runs inside Splash's boot sequence, and an
  // uncaught error this early has no recovery path for the user.
  let parsedUser;

  try {
    parsedUser = JSON.parse(user);
  } catch (error) {
    console.log('Corrupted stored user, ignoring:', error);
    return;
  }

  set({

    isLoggedIn: true,

    token,

    user: parsedUser,

    primaryPhone,

  });



}
    },
  }));