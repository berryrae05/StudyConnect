import axios from "axios";

// Base axios instance, reads the backend URL from .env
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Automatically attach the JWT token to every request if one exists in localStorage. This runs before
// every single API call made through this API instance.
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
})

// SIGNUP
export const signup = async ({ fullName, email, password, gender }) => {
    const response = await API.post("/auth/signup", {
        full_name: fullName,
        email,
        password,
        gender,
    });
    return response.data;
};

// LOGIN
export const login = async ({ email, password }) => {
    const response = await API.post("/auth/login", {
        email,
        password,
    });
    return response.data;
};

//VERIFY EMAIL
export const verifyEmail = async (token) => {

    const response = await API.get(`/auth/verify-email?token=${token}`);
    return response.data;
};

// FORGOT PASSWORD
export const forgotPassword = async ({ email }) => {
  const response = await API.post("/auth/forgot-password", {
    email,
  });
  return response.data;
};

// RESET PASSWORD
export const resetPassword = async ({ token, newPassword }) => {
  const response = await API.post("/auth/reset-password", {
    token,
    new_password: newPassword
  });
  return response.data;
};

// GET CURRENT USER
// Returns logged in user data — requires JWT token
export const getCurrentUser = async () => {
  const response = await API.get("/auth/me");
  return response.data;
};

// LOGOUT
// Clears the token from localStorage
export const logout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  window.location.href = "/login";
};

// POST /auth/refresh — exchanges a refresh token for a new
// access token and a new refresh token (rotation)
export const refreshToken = async () => {
  const token = localStorage.getItem("refresh_token");

  if (!token) throw new Error("No refresh token available");

  const response = await API.post("/auth/refresh", {
    refresh_token: token,
  });

  // Save both new tokens — backend rotates the refresh token too
  localStorage.setItem("access_token", response.data.access_token);
  localStorage.setItem("refresh_token", response.data.refresh_token);

  return response.data;
};

// ── RESPONSE INTERCEPTOR ─────────────────────────────────────
// Runs on every API response. If we get a 401 (expired token),
// we automatically try to refresh and retry the original request.
// If the refresh also fails, we log the user out.

let isRefreshing = false;
// Queue of requests that failed while a refresh was in progress.
// They all retry once the new token is ready.
let failedQueue = [];

// Resolve or reject all queued requests after refresh completes
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

API.interceptors.response.use(
  // Success — just return the response unchanged
  (response) => response,

  // Error — check if it is a 401 and handle accordingly
  async (error) => {
    const originalRequest = error.config;

    // Only intercept 401 errors that have not already been retried
    if (error.response?.status === 401 && !originalRequest._retry) {

      // If a refresh is already in progress, queue this request
      // until the refresh completes rather than firing multiple
      // refresh calls at the same time
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return API(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // Mark this request so it does not get retried more than once
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to get a new access token using the refresh token
        const data = await refreshToken();

        // Update the Authorization header on the original request
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;

        // Let all queued requests know the new token is ready
        processQueue(null, data.access_token);

        // Retry the original request with the new token
        return API(originalRequest);

      } catch (refreshError) {
        // Refresh failed — token is invalid or expired after 7 days.
        // Clear everything and send the user back to login.
        processQueue(refreshError, null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);

      } finally {
        isRefreshing = false;
      }
    }

    // For any other error (404, 422, 500 etc.) just reject normally
    return Promise.reject(error);
  }
);