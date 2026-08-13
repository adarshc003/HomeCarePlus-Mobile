import {useLanguageStore} from '../store/languageStore';
import {useThemeStore} from '../store/themeStore';
import {useAuthStore} from '../store/authStore';

// Application bootstrap — SplashScreen awaits this, and only this, before
// its first navigation decision. Scope is intentionally minimal: theme,
// language, and authentication/JWT state, so Splash stays fast (target:
// under 700ms). Screen-owned data (categories, services, packages,
// add-ons, addresses, bookings, notifications, ...) must NOT be added
// here — each screen is responsible for loading its own data lazily,
// after Home has already rendered.
//
// This is the extension point for future *global, pre-navigation* concerns
// only (e.g. a remote config/feature-flag fetch) — not a place to route
// per-screen data loading back through.
export const initializeApp = async () => {
  await Promise.all([
    useLanguageStore.getState().loadLanguage(),
    useThemeStore.getState().loadThemeMode(),
    useAuthStore.getState().loadUser(),
  ]);
};
