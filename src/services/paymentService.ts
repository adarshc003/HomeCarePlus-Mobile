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

export const createTelrCheckout = async (
  bookingId: string,
) => {
  const response = await API.post(
    '/payment/telr/create-checkout',
    {
      bookingId,
    },
  );

  return response.data;
};

export const verifyTelrPayment = async (
  bookingId: string,
) => {
  const response = await API.post(
    '/payment/telr/verify',
    {
      bookingId,
    },
  );

  return response.data;
};

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 20; // ~60s safety net for a redirect that stalls or never arrives

// The in-app browser's redirect back to the app (Tamara's direct scheme /
// Telr's https-bridge-then-deep-link) isn't guaranteed to fire promptly —
// real bank 3D-Secure delays or a dropped redirect would otherwise leave the
// UI stuck forever on a single verify call. Poll the gateway's own status
// instead, same safety net the website already relies on via its interval.
export const pollPaymentStatus = async (
  verifyFn: (bookingId: string) => Promise<any>,
  bookingId: string,
) => {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const result = await verifyFn(bookingId);

    if (result.paymentStatus !== 'pending') {
      return result;
    }

    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  return verifyFn(bookingId);
};
