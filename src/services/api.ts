import axios from 'axios';
import * as Keychain from 'react-native-keychain';

import {navigationRef} from '../navigation/navigationRef';
import {showError} from '../utils/showToast';
import {useLanguageStore} from '../store/languageStore';
import {t} from '../i18n';

const API = axios.create({
  baseURL: 'https://api.hcare.plus/api',
  timeout: 30000,
});

API.interceptors.request.use(
  async config => {
    // Keychain/Keystore-backed secure storage, not AsyncStorage — matches
    // authStore.ts's login()/logout()/loadUser(), which already migrates
    // an already-logged-in user's legacy AsyncStorage token across on
    // next app boot. A legacy-token fallback isn't needed here: loadUser()
    // always runs before any authenticated request could be made.
    const credentials =
      await Keychain.getGenericPassword();

    const token = credentials
      ? credentials.password
      : null;

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Guards against handling the same session-expiry once per in-flight
// request — several screens can have requests in flight at once, and a
// stale token would make all of them fail with 401 around the same time.
let isHandlingUnauthorized = false;

API.interceptors.response.use(
  response => response,
  async error => {
    // Lazy require, not a top-level import: authStore.ts already imports
    // notificationService.ts (for unregisterCurrentToken), which imports
    // this same api.ts — a top-level import here would be circular.
    // Deferring the require to when it's actually needed (well after
    // module init) sidesteps that entirely.
    const {useAuthStore} = require('../store/authStore');

    const wasLoggedIn = useAuthStore.getState().isLoggedIn;

    if (
      error?.response?.status === 401 &&
      wasLoggedIn &&
      !isHandlingUnauthorized
    ) {
      isHandlingUnauthorized = true;

      try {
        await useAuthStore.getState().logout();
      } catch (logoutError) {
        console.log(logoutError);
      }

      if (navigationRef.isReady()) {
        navigationRef.navigate('Login');
      }

      showError(
        t('sessionExpired', useLanguageStore.getState().language) ||
          'Your session has expired. Please log in again.',
      );

      isHandlingUnauthorized = false;
    }

    return Promise.reject(error);
  },
);

export default API;