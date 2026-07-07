import {useColorScheme} from 'react-native';

import {useThemeStore} from '../store/themeStore';

import {
  DARK_COLORS,
  LIGHT_COLORS,
  ThemeColors,
} from '../constants/theme';

// Centralized theme resolver: combines the user's stored preference
// ('light' | 'dark' | 'system') with the device's current color scheme when
// 'system' is selected. Every screen/component that wants theme-aware
// colors should read them from here rather than hardcoding hex values.
export const useTheme = (): {
  mode: 'light' | 'dark' | 'system';
  isDark: boolean;
  colors: ThemeColors;
} => {
  const mode = useThemeStore(state => state.mode);
  const systemScheme = useColorScheme();

  const isDark =
    mode === 'dark' ||
    (mode === 'system' && systemScheme === 'dark');

  return {
    mode,
    isDark,
    colors: isDark ? DARK_COLORS : LIGHT_COLORS,
  };
};
