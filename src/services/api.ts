import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API = axios.create({
  baseURL: 'https://home-care-plus-app.onrender.com/api',
});

API.interceptors.request.use(
  async config => {
    const token =
      await AsyncStorage.getItem(
        'token',
      );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

export default API;