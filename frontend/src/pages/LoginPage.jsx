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

      localStorage.setItem("access_token", response.access_token);
      localStorage.setItem("refresh_token", response.refresh_token);
      localStorage.setItem("user", JSON.stringify(response.user));

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

        {/* Logo mark — green circle matching the design */}
        <div className="login-logo-mark">
          <i className="ti ti-users" aria-hidden="true"></i>
        </div>

        <h1 className="login-title">Welcome Back</h1>
        <p className="login-sub">Log in to access your study groups.</p>

        {/* General error banner */}
        {errors.general && (
          <div className="login-error-banner">
            <i className="ti ti-alert-circle" aria-hidden="true"></i>
            <span>{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* Email — uses Input component which has its own classes */}
          <Input
            label="Email address"
            type="email"
            placeholder="e.g. student@uwc.ac.za"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => ({ ...prev, email: "", general: "" }));
            }}
            error={errors.email}
            required
          />

          {/* Password field */}
          <div className="password-field-wrapper">

            {/* Label row — label left, forgot password right */}
            <div className="password-label-row">
              <label className="input-label" htmlFor="password">Password</label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>

            {/* Input box — same look as email field */}
            <div className={`input-row ${errors.password ? "input-row--error" : ""}`}>
              <input
                id="password"
                className="input-field"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: "", general: "" }));
                }}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <i
                  className={`ti ${showPassword ? "ti-eye-off" : "ti-eye"}`}
                  aria-hidden="true"
                ></i>
              </button>
            </div>

            {errors.password && (
              <p className="input-error">
                <i className="ti ti-alert-circle" aria-hidden="true"></i>
                {errors.password}
              </p>
            )}

          </div>

          {/* Submit button */}
          <button
            type="submit"
            className={`login-submit ${loading ? "login-submit--loading" : ""}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="ti ti-loader-2 spin" aria-hidden="true"></i>
                Logging in...
              </>
            ) : (
              "Log in"
            )}
          </button>

        </form>

        {/* Divider */}
        <div className="login-divider">
          <hr />
          <span>or</span>
          <hr />
        </div>

        {/* Sign up row */}
        <p className="login-signup-row">
          Don't have an account?{" "}
          <Link to="/signup">Sign up</Link>
        </p>

      </div>
    </div>
  );
}