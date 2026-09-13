import API from './api';

export const getProfile = async () => {
  const response = await API.get('/users/profile');

  return response.data;
};

export const updateEmail = async (
  email: string,
) => {

  const response =
    await API.put(
      '/users/email',
      {
        email,
      },
    );

  return response.data;

};

export const updateName = async (
  customerName: string,
) => {

  const response =
    await API.put(
      '/users/name',
      {
        customerName,
      },
    );

  return response.data;

};

export const deleteAccount = async () => {
  const response = await API.delete('/users/account');
  return response.data;
};