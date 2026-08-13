let initialized = false;
import {
  getPackages,
  getAddOns,
} from '../services/serviceService';

import {
  useServiceStore,
} from '../store/serviceStore';

import {
  useAppDataStore,
} from '../store/appDataStore';

export const startBackgroundLoading =
  async () => {

    if (initialized) {
      return;
    }

    initialized = true;

    const services =
      useServiceStore
        .getState()
        .services;

    const appStore =
      useAppDataStore.getState();

await Promise.all(
  services.map(async service => {
    const [packageResponse, addOnResponse] =
      await Promise.allSettled([
        getPackages(service.id),
        getAddOns(service.id),
      ]);

    if (packageResponse.status === 'fulfilled') {
      appStore.setPackages(
        service.id,
        packageResponse.value.packages || [],
      );
    }

    if (addOnResponse.status === 'fulfilled') {
      appStore.setAddOns(
        service.id,
        addOnResponse.value.addOns || [],
      );
    }
  }),
);

  };

// authStore.logout() wipes appDataStore's packages/addOns cache (so the
// next customer on a shared device never sees the previous one's data), but
// the one-shot guard above would otherwise stay tripped for the rest of the
// app process — leaving every service's packages permanently empty after a
// logout, even once the user logs back in. Call this alongside that reset
// so the next Home mount preloads again instead of silently no-op-ing.
export const resetBackgroundLoading = () => {
  initialized = false;
};