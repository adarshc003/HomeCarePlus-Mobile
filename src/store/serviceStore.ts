import {create} from 'zustand';

import {getServices} from '../services/serviceService';

import {
  useLanguageStore,
} from '../store/languageStore';

interface ServiceState {
  services: any[];

  filteredServices: any[];

  selectedCategory: string;

  loading: boolean;

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

    loading: false,

    loadServices: async () => {

      try {

        set({
          loading: true,
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

      const services =
        get().services;

const language =
useLanguageStore.getState().language;

const filtered =
services.filter(service => {

const serviceName =
  typeof service.name === 'string'
    ? service.name
    : language === 'ar'
    ? service.name?.ar || ''
    : service.name?.en || '';

return (
  serviceName ?? ''
)
  .toLowerCase()
  .includes(
    text.toLowerCase().trim(),
  );

});

      set({

        filteredServices:
          filtered,

      });

    },

    setCategory: category => {

      const services =
        get().services;

if (
  category === 'all'
) {

        set({

          filteredServices:
            services,

          selectedCategory:
            category,

        });

        return;

      }

      const filtered =
        services.filter(
          service =>
          service.category?.code === category,
        );

      set({

        filteredServices:
          filtered,

        selectedCategory:
          category,

      });

    },

  }));