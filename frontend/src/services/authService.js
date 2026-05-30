import axios from "axios";

// reads the backend URL from the .env file
const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

// Add a request interceptor to include the access token in the Authorization header for all requests
API.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// SIGNUP
// note: full_name not fullName — must match Python schema exactly
export const signup = async ({ fullName, email, password, gender }) => {
    const response = await API.post("/auth/signup", {
        full_name: fullName,   // ← convert camelCase to snake_case here
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
export const verifyEmail = async ({ token }) => {
    const response = await API.get(`/auth/verify-email?token=${token}`);
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
};