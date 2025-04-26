import type { AxiosError } from "axios";
import type { AxiosResponse } from "axios";
import axios from "axios";

import { useAuthStore } from "@/stores/auth";

declare module "axios" {
  interface AxiosRequestConfig {
    cancelPreviousRequests?: boolean;
  }
}

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

const pendingRequests: { [key: string]: AbortController } = {};
const removePendingRequest = (url: string | undefined, abort = false): void => {
  if (url && pendingRequests[url]) {
    if (abort) {
      pendingRequests[url].abort();
    }
    delete pendingRequests[url];
  }
};

axiosInstance.interceptors.request.use((config) => {
  // Inject auth token
  const authStore = useAuthStore();
  const { authToken } = authStore;
  if (authToken) {
    config.headers["Authorization"] = `Bearer ${authToken}`;
  }

  // Cancel previous request
  if (config?.cancelPreviousRequests && config?.url && !config.signal) {
    removePendingRequest(config.url, true);

    const abortController = new AbortController();
    config.signal = abortController.signal;
    pendingRequests[config.url] = abortController;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    removePendingRequest(response.request.responseURL);
    return response;
  },
  (error: AxiosError) => {
    removePendingRequest(error.config?.url);

    if (error.response) {
      if (error.response.status === 401) {
        const { logout } = useAuthStore();
        logout();
        return;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
