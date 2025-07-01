import axios from 'axios';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from './tokenService';
// eslint-disable-next-line import/no-mutable-exports
let axiosInstance;
// eslint-disable-next-line import/no-mutable-exports
let axiosAuthInstance;
// eslint-disable-next-line import/no-mutable-exports
let BACKEND_API_URL;

const fetchConfig = async () => {
  try {
    const response = await fetch(`${process.env.PUBLIC_URL}/backend.json`);
    const data = await response.json();
    BACKEND_API_URL = data.BACKEND_API_URL;
  } catch (error) {
    console.error('Error fetching BACKEND_API_URL:', error);
  }

  axiosInstance = axios.create({
    baseURL: BACKEND_API_URL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
  });

  const getNewAccessToken = async () => {
    const existingRefreshToken = getRefreshToken();
    if (!existingRefreshToken) {
      return null;
    }
    try {
      const response = await axiosInstance.post('/user/token/refresh', {
        refresh_token: existingRefreshToken,
      });
      const data = await response.data;
      if (!data) {
        return null;
      }
      saveTokens({ accessToken: data.access_token, refreshToken: existingRefreshToken });
      return data.access_token;
    } catch (error) {
      return null;
    }
  };

  axiosAuthInstance = axios.create({
    baseURL: BACKEND_API_URL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
  });

  axiosAuthInstance.interceptors.request.use(async (config) => {
    const accessToken = await getAccessToken();
    if (accessToken) {
      return {
        ...config,
        headers: { ...config.headers, Authorization: `Bearer ${accessToken}` },
      };
    }
    return config;
  });

  axiosAuthInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      // Check if the error is due to an expired access token
      // eslint-disable-next-line no-underscore-dangle
      if (error.response.status === 403 && !originalRequest._retry) {
      // eslint-disable-next-line no-underscore-dangle
      originalRequest._retry = true;
        try {
          const newAccessToken = await getNewAccessToken();
          // eslint-disable-next-line no-underscore-dangle
          alert(`Session expired. Trying to refresh access token. Retry: ${originalRequest._retry}`);
          if (newAccessToken) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axiosAuthInstance(originalRequest);
          }
        } catch (refreshError) {
          alert('Session expired. Please login again in catch block');
          console.error('Error refreshing access token:', refreshError);
        }
        alert('Session expired. Please login again');
        clearTokens();
        window.location.reload();
      }
      return Promise.reject(error);
    }
  );
};

const isAxiosReady = fetchConfig();

export { axiosInstance, axiosAuthInstance, BACKEND_API_URL, isAxiosReady };