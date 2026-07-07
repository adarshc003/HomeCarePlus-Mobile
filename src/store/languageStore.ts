import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LanguageState {
  language: 'en' | 'ar';

  setLanguage: (
    lang: 'en' | 'ar',
  ) => Promise<void>;

  loadLanguage: () => Promise<void>;
}

export const useLanguageStore =
  create<LanguageState>(set => ({
    language: 'en',

    setLanguage: async lang => {
      await AsyncStorage.setItem(
        'language',
        lang,
      );

      set({
        language: lang,
      });
    },

    loadLanguage: async () => {
      const saved =
        await AsyncStorage.getItem(
          'language',
        );

      if (
        saved === 'en' ||
        saved === 'ar'
      ) {
        set({
          language: saved,
        });
      }
    },
  }));