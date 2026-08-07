import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/ui/Input";
import { login } from "../services/authService";
import "./LoginPage.css";

export default function LoginPage() {
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Error state
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });

  // Loading state
  const [loading, setLoading] = useState(false);

  // Navigation
  const navigate = useNavigate();

  // Validation
  const validate = () => {
    const newErrors = {
      email: "",
      password: "",
      general: "",
    };

    let valid = true;

    if (!email.trim()) {
      newErrors.email = "Email address is required";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address";
      valid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // Submit form
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const response = await login({
        email,
        password,
      });

      console.log("Login success:", response);

      localStorage.setItem(
        "access_token",
        response.access_token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(response.user)
      );

      // Navigate based on user role
      if (response.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }

    } catch (error) {
      const detail = error.response?.data?.detail;

      let message = "Login failed. Please try again.";

      if (typeof detail === "string") {
        message = detail;
      } else if (Array.isArray(detail)) {
        message = detail.map((d) => d.msg).join(", ");
      }

      setErrors((prev) => ({
        ...prev,
        general: message,
      }));

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">

      <Link to="/" className="auth-brand">
        <span>Study Connect</span>
      </Link>

      <div className="auth-card">

        <h1>Welcome Back</h1>
        <p>Log in to access your study groups.</p>

        {errors.general && (
          <div>
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          <Input
            label="Email address"
            type="email"
            placeholder="e.g. student@uwc.ac.za"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);

              setErrors((prev) => ({
                ...prev,
                email: "",
                general: "",
              }));
            }}
            error={errors.email}
            required
          />

          <div>
            <label>Password</label>

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);

                setErrors((prev) => ({
                  ...prev,
                  password: "",
                  general: "",
                }));
              }}
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(!showPassword)
              }
            >
              {showPassword ? "Hide" : "Show"}
            </button>

            {errors.password && (
              <p>{errors.password}</p>
            )}
          </div>

          <div>
            <Link to="/forgot-password">
              Forgot your password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>

        </form>

        <p>
          Don't have an account?
        </p>

        <Link to="/signup">
          Create an account
        </Link>

      </div>

    </div>
  );
}