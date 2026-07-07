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