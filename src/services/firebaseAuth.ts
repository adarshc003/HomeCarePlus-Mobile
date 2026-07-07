import auth from '@react-native-firebase/auth';

export const sendOTP = async (phone: string) => {
  try {
    const confirmation = await auth().signInWithPhoneNumber(phone);
    return confirmation;
  } catch (error) {
    console.log('Send OTP Error:', error);
    throw error;
  }
};

export const verifyOTP = async (
  confirmation: any,
  code: string,
) => {
  try {
    const result = await confirmation.confirm(code);
    return result;
  } catch (error) {
    console.log('Verify OTP Error:', error);
    throw error;
  }
};