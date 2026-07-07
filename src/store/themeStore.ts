import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;

  setThemeMode: (
    mode: ThemeMode,
  ) => Promise<void>;

  loadThemeMode: () => Promise<void>;
}

// Mirrors languageStore.ts exactly — same persistence pattern, same shape.
export const useThemeStore =
  create<ThemeState>(set => ({
    mode: 'light',

    setThemeMode: async mode => {
      await AsyncStorage.setItem(
        'themeMode',
        mode,
      );

      set({
        mode,
      });
    },

    loadThemeMode: async () => {
      const saved =
        await AsyncStorage.getItem(
          'themeMode',
        );

      if (
        saved === 'light' ||
        saved === 'dark' ||
        saved === 'system'
      ) {
        set({
          mode: saved,
        });
      }
    },
  }));
