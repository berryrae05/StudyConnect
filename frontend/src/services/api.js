// Single shared Axios instance used by ALL service files.
// Request interceptor attaches the JWT token.
// Response interceptor handles token refresh on 401.

import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Attaches access token to every outgoing request
API.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        error ? prom.reject(error) : prom.resolve(token);
    });
    failedQueue = [];
};

// Response interceptor to handle 401 errors and refresh tokens
API.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {

            // Queue request if a refresh is already in progress
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

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem("refresh_token");
                if (!refreshToken) throw new Error("No refresh token");

                // Call refresh endpoint directly with axios (not API instance)
                // to avoid triggering this interceptor again on a 401 refresh fail
                const { data } = await axios.post(
                    `${import.meta.env.VITE_API_BASE_URL}auth/refresh`,
                    { refresh_token: refreshToken }
                );

                // Save both new tokens
                localStorage.setItem("access_token", data.access_token);
                localStorage.setItem("refresh_token", data.refresh_token);

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
                processQueue(null, data.access_token);
                return API(originalRequest);

            } catch (refreshError) {
                // Refresh failed — session truly expired, send to login
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

        return Promise.reject(error);
    }
);

export default API;