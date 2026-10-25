import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1",
  withCredentials: true,
});

export const AUTH_EXPIRED_EVENT = "auth:session-expired";
const AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/refresh"];
let refreshPromise = null;

// Add a response interceptor to handle 401 errors and refresh the token
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const config = err.config;
    const isAuthPath = AUTH_PATHS.some((path) => config?.url?.includes(path));
    // only an expired/missing access token is worth a refresh (not e.g. INVALID_TOKEN)
    const isAuthError = err.response?.data?.code === "AUTHENTICATION_ERROR";

    if (err.response?.status !== 401 || !isAuthError || isAuthPath || config._retry) {
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
      // Let ProtectedRoute redirect with React Router state so the destination
      // survives the login round-trip (including query strings and hashes).
      if (!config.url.includes("/auth/me")) {
        window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
      }
      return Promise.reject(refreshErr);
    }
  },
);

export default api;
