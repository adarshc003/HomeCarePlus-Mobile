import API from './api';

export const getEligibleOffers = async (
  serviceId: string,
  bookingAmount: number,
) => {

  const response = await API.get('/offers/eligible', {
  params: {
    serviceId,
    bookingAmount,
  },
});

  return response.data;
};

export const applyOffer = async ({
  offerId,
  couponCode,
  serviceId,
  bookingAmount,
}: {
  offerId?: string;
  couponCode?: string;
  serviceId: string;
  bookingAmount: number;
}) => {

  const response = await API.post(
    '/offers/apply',
    {
      offerId,
      couponCode,
      serviceId,
      bookingAmount,
    },
  );

  return response.data;
};