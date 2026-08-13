import API from './api';

export const getAddresses =
  async () => {
    try {
      return await API.get(
        '/users/addresses',
      );
    } catch (error: any) {
      throw error;
    }
  };

export const addAddress =
  async (data: any) => {
    return API.post(
      '/users/address',
      data,
    );
  };

 export const deleteAddress = (
  addressId: string,
) => {
  return API.delete(
    `/users/address/${addressId}`,
  );
};

export const updateAddress = (
  addressId: string,
  data: any,
) => {
  return API.put(
    `/users/address/${addressId}`,
    data,
  );
};

// Standalone check — does not create/modify an address. Used to re-confirm
// a saved address's location is still inside an active service zone (ERP's
// zones can change after the address was originally saved).
export const validateAddressZone = (
  latitude: number,
  longitude: number,
) => {
  return API.post(
    '/users/address/validate-zone',
    {latitude, longitude},
  );
};