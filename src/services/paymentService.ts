import API from './api';

export const createTamaraCheckout = async (
  bookingId: string,
) => {
  const response = await API.post(
    '/payment/create-checkout',
    {
      bookingId,
    },
  );

  return response.data;
};

export const verifyTamaraPayment = async (
  bookingId: string,
) => {
  const response = await API.post(
    '/payment/verify',
    {
      bookingId,
    },
  );

  return response.data;
};
