import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {unregisterCurrentToken} from '../services/notificationService';

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
  await AsyncStorage.setItem(
    'token',
    String(token || ''),
  );

  await AsyncStorage.setItem(
    'user',
    JSON.stringify(user || {}),
  );

  await AsyncStorage.setItem(
  'primaryPhone',
  primaryPhone,
);

set({
  isLoggedIn: true,
  token,
  user,
  primaryPhone,
});

},

updateUser: async updatedUser => {

  await AsyncStorage.setItem(
    'user',
    JSON.stringify(updatedUser),
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

      await AsyncStorage.removeItem(
        'token',
      );

await AsyncStorage.removeItem(
  'user',
);

await AsyncStorage.removeItem(
  'primaryPhone',
);



await AsyncStorage.clear();

set({
  isLoggedIn: false,
  token: null,
  user: null,
  primaryPhone: '',
});
    },

    loadUser: async () => {
      const token =
        await AsyncStorage.getItem(
          'token',
        );

      const user =
        await AsyncStorage.getItem(
          'user',
        );

        const primaryPhone =
  await AsyncStorage.getItem(
    'primaryPhone',
  );

if (
  token &&
  user &&
  primaryPhone
) {

  set({

    isLoggedIn: true,

    token,

    user: JSON.parse(user),

    primaryPhone,

  });



}
    },
  }));