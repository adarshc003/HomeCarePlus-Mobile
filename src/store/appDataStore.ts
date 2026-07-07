import {create} from 'zustand';

interface AppDataState {
  packages: Record<string, any[]>;

  addOns: Record<string, any[]>;

  addresses: any[];

    offers: any[];

  offersLoading: boolean;

  setPackages: (
    serviceId: string,
    packages: any[],
  ) => void;

  setAddOns: (
    serviceId: string,
    addOns: any[],
  ) => void;

  setAddresses: (
    addresses: any[],
  ) => void;

  setOffers: (
    offers: any[],
  ) => void;

   clearOffers: () => void;

  setOffersLoading: (
    loading: boolean,
  ) => void;
}

export const useAppDataStore =
  create<AppDataState>(set => ({
    packages: {},

    addOns: {},

    addresses: [],

    offers: [],

offersLoading: false,

    setPackages: (
      serviceId,
      packages,
    ) =>
      set(state => ({
        packages: {
          ...state.packages,
          [serviceId]: packages,
        },
      })),

    setAddOns: (
      serviceId,
      addOns,
    ) =>
      set(state => ({
        addOns: {
          ...state.addOns,
          [serviceId]: addOns,
        },
      })),

    setAddresses: addresses =>
      set({
        addresses,
      }),

      setOffers: offers =>
  set({
    offers,
  }),

clearOffers: () =>
  set({
    offers: [],
  }),

setOffersLoading: loading =>
  set({
    offersLoading: loading,
  }),
  }));