import axios from "axios";

// reads the backend URL from the .env file
const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
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

// FORGOT PASSWORD
export const forgotPassword = async ({ email }) => {
    const response = await API.post("/auth/forgot-password", {
        email,
    });
    return response.data;
};