import {create} from 'zustand';

import {getServices} from '../services/serviceService';

import {
  useLanguageStore,
} from '../store/languageStore';

// Applies the currently-selected category AND the currently-typed search
// text together — previously each filter was applied independently from
// the full `services` list, so whichever action ran last silently
// discarded the other's constraint (e.g. selecting a category, then
// searching, would search across every category, not just the selected
// one, while the chip still showed as selected).
const applyFilters = (
  services: any[],
  selectedCategory: string,
  searchText: string,
  language: 'en' | 'ar',
) => {
  let result = services;

  if (selectedCategory !== 'all') {
    result = result.filter(
      service => service.category?.code === selectedCategory,
    );
  }

  const trimmed = searchText.toLowerCase().trim();

  if (trimmed) {
    result = result.filter(service => {
      const serviceName =
        typeof service.name === 'string'
          ? service.name
          : language === 'ar'
          ? service.name?.ar || ''
          : service.name?.en || '';

      return (serviceName ?? '').toLowerCase().includes(trimmed);
    });
  }

  return result;
};

interface ServiceState {
  services: any[];

  filteredServices: any[];

  selectedCategory: string;

  searchText: string;

  loading: boolean;

  // Distinguishes "the request failed" from "there are genuinely no
  // services" — without this, FeaturedSection had no way to tell the two
  // apart and silently rendered an empty section either way.
  error: boolean;

  loadServices: () => Promise<void>;

  setServices: (
    services: any[],
  ) => void;

  searchServices: (
    text: string,
  ) => void;

  setCategory: (
    category: string,
  ) => void;
}

export const useServiceStore =
  create<ServiceState>((set, get) => ({

    services: [],

    filteredServices: [],

    selectedCategory: 'all',

    searchText: '',

    loading: false,

    error: false,

    loadServices: async () => {

      try {

        set({
          loading: true,
          error: false,
        });

        const data =
          await getServices();

        set({

          services:
            data.services || [],

          filteredServices:
            data.services || [],

        });

      } catch (error) {

        console.log(error);

        set({
          error: true,
        });

      } finally {

        set({
          loading: false,
        });

      }

    },

    setServices: services =>

      set({

        services,

        filteredServices:
          services,

      }),

    searchServices: text => {

      const {services, selectedCategory} = get();

      const language =
        useLanguageStore.getState().language;

      set({

        searchText: text,

        filteredServices: applyFilters(
          services,
          selectedCategory,
          text,
          language,
        ),

      });

    },

    setCategory: category => {

      const {services, searchText} = get();

      const language =
        useLanguageStore.getState().language;

      set({

        selectedCategory: category,

        filteredServices: applyFilters(
          services,
          category,
          searchText,
          language,
        ),

      });

    },

  }));