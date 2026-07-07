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