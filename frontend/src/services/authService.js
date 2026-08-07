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
};