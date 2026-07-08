import API from './api';

export const sendOtp = async (
  phone: string,
) => {
  return API.post(
    '/auth/send-otp',
    {phone},
  );
};

export const verifyOtp = async (
  phone: string,
  otp: string,
) => {
  return API.post(
    '/auth/verify-otp',
    {
      phone,
      otp,
    },
  );
};

export const firebaseLogin = (
  idToken: string,
  phone?: string,
) => {
  return API.post(
    '/auth/firebase-login',
    {
      idToken,
      // Sent for logging/debugging only — the backend derives the
      // authenticated phone number from the verified idToken, never from
      // this field.
      phone,
    },
  );
};