import API from './api';

export const createBooking = async (
  bookingData: any,
) => {
  const response = await API.post(
    '/bookings',
    bookingData,
  );

  return response.data;
};

export const getBookings =
  async () => {
    const response =
      await API.get(
        '/bookings/my',
      );

    return response.data;
  };

  export const getBookingById = async (
  bookingId: string,
) => {
  const response = await API.get(
    `/bookings/${bookingId}`,
  );

  return response.data;
};

export const getBookingNumberById = async (
  id: string,
) => {
  const response = await API.get(
    `/bookings/by-id/${id}`,
  );

  return response.data;
};

export const getInvoice = async (
  bookingId: string,
) => {
  const response = await API.get(
    `/bookings/${bookingId}/invoice`,
  );

  return response.data;
};

export const cancelBooking = async (
  bookingId: string,
) => {
  const response = await API.put(
    `/bookings/${bookingId}/cancel`,
  );

  return response.data;
};

export const submitReview = async (
  bookingId: string,
  rating: number,
  review: string,
) => {

  const response = await API.post(

    `/bookings/${bookingId}/review`,

    {
      rating,
      review,
    },

  );

  return response.data;

};