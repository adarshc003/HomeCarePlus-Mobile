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
  phone: string,
) => {
  return API.post(
    '/auth/firebase-login',
    {
      phone,
    },
  );
};