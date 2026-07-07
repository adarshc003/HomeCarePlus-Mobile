import Toast from 'react-native-toast-message';

export const showSuccess = (
  text1: string,
  text2?: string,
) => {
  Toast.show({
    type: 'success',
    text1,
    text2,
    position: 'top',
  });
};

export const showError = (
  text1: string,
  text2?: string,
) => {
  Toast.show({
    type: 'error',
    text1,
    text2,
    position: 'top',
  });
};

export const showInfo = (
  text1: string,
  text2?: string,
) => {
  Toast.show({
    type: 'info',
    text1,
    text2,
    position: 'top',
  });
};