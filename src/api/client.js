import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  withCredentials: true,
});

const AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/refresh"];
let refreshPromise = null;

// Add a response interceptor to handle 401 errors and refresh the token
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const config = err.config;
    const isAuthPath = AUTH_PATHS.some((path) => config?.url?.includes(path));

    if (err.response?.status !== 401 || isAuthPath || config._retry) {
      return Promise.reject(err);
    }
    config._retry = true;

    try {
      // share one refresh between all requests that failed at the same time
      refreshPromise ??= api.post("/auth/refresh").finally(() => {
        refreshPromise = null;
      });
      await refreshPromise;
      return api(config); // retry the original request
    } catch (refreshErr) {
      // /auth/me failing is handled by ProtectedRoute, so don't redirect for it
      if (!config.url.includes("/auth/me")) {
        window.location.href = "/login";
      }
      return Promise.reject(refreshErr);
    }
  },
);

export default api;
