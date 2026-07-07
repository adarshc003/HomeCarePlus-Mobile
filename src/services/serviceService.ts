import API from './api';

export const getServices =
  async () => {
    const response =
      await API.get('/services');

    return response.data;
  };

export const getPackages =
  async (
    serviceId: string,
  ) => {
    const response =
      await API.get(
        `/packages/${serviceId}`,
      );

    return response.data;
  };

export const getAddOns =
  async (
    serviceId: string,
  ) => {
    const response =
      await API.get(
        `/addons/${serviceId}`,
      );

    return response.data;
  };