import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { resetPassword } from "../services/authService";
import { validatePassword } from "../utils/validators";
import "./ResetPasswordPage.css";

export default function ResetPasswordPage() {

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [loading, setLoading]                 = useState(false);

  const [status, setStatus] = useState(token ? "idle" : "missing-token");

  const [errors, setErrors] = useState({
    newPassword:     "",
    confirmPassword: "",
    general:         "",
  });

  const navigate = useNavigate();

  const getStrength = () => {
    if (newPassword.length === 0) return 0;
    const errs = validatePassword(newPassword);
    if (errs.length >= 4) return 1;
    if (errs.length === 3) return 2;
    if (errs.length <= 2 && errs.length > 0) return 3;
    return 4;
  };

  const strengthLabel = ["", "Too short", "Weak", "Good", "Strong"];
  const strengthColor = ["", "#E24B4A", "#EF9F27", "#4CAF82", "#1A5C3A"];

  const validate = () => {
    const newErrors = { newPassword: "", confirmPassword: "", general: "" };
    let valid = true;

    if (!newPassword) {
      newErrors.newPassword = "Password is required";
      valid = false;
    } else {
      const passwordErrors = validatePassword(newPassword);
      if (passwordErrors.length > 0) {
        newErrors.newPassword = passwordErrors.join(", ");
        valid = false;
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
      valid = false;
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // ── SUBMIT ──────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Safety check — should not happen since we guard the form
    // below with status === "missing-token", but defends against
    // the token disappearing between renders.
    if (!token) {
      setStatus("missing-token");
      return;
    }

    if (!validate()) return;

    setLoading(true);

    try {
      // POST /auth/reset-password — body is { token, new_password }
      // authService.resetPassword converts newPassword to new_password
      await resetPassword({ token, newPassword });

      setStatus("success");

    } catch (err) {
      const detail = err.response?.data?.detail;
      let message  = "Could not reset your password. The link may have expired.";

      if (typeof detail === "string") {
        message = detail;
      } else if (Array.isArray(detail)) {
        message = detail.map((d) => d.msg).join(", ");
      }

      setErrors((prev) => ({ ...prev, general: message }));
      setStatus("error");

    } finally {
      setLoading(false);
    }
  };

  // ── JSX ─────────────────────────────────────────────────────
  return (
    <div className="login-container">

      {/* Brand */}
      <Link to="/" className="auth-brand">
        <span>Study Connect</span>
      </Link>

      <div className="auth-card">

        {/* Logo mark */}
        <div className="login-logo-mark">
          <i className="ti ti-lock" aria-hidden="true"></i>
        </div>

        {/* ── MISSING TOKEN — broken or no link ────────────── */}
        {/* REACT: This branch shows if there is no ?token= in the URL at all */}
        {status === "missing-token" && (
          <>
            <h1 className="login-title">Invalid reset link</h1>
            <p className="login-sub">
              This password reset link is missing or invalid. Please request
              a new one.
            </p>
            <Link to="/forgot-password" className="login-submit" style={{ marginTop: 8 }}>
              Request new link
            </Link>
          </>
        )}

        {/* ── SUCCESS — password changed ────────────────────── */}
        {status === "success" && (
          <>
            <h1 className="login-title">Password reset</h1>
            <p className="login-sub">
              Your password has been changed successfully. You can now log in
              with your new password.
            </p>
            <Link to="/login" className="login-submit" style={{ marginTop: 8 }}>
              Log in
            </Link>
          </>
        )}

        {/* ── ERROR — token expired or invalid on submit ────── */}
        {status === "error" && (
          <>
            <h1 className="login-title">Reset failed</h1>
            <p className="login-sub">{errors.general}</p>
            <Link to="/forgot-password" className="login-submit" style={{ marginTop: 8 }}>
              Request a new link
            </Link>
          </>
        )}

        {/* ── FORM — idle state, token present, ready to submit ── */}
        {status === "idle" && (
          <>
            <h1 className="login-title">Set a new password</h1>
            <p className="login-sub">
              Choose a strong password you have not used before.
            </p>

            <form onSubmit={handleSubmit} noValidate style={{ width: "100%" }}>

              {/* New password */}
              <div className="password-field-wrapper">
                <label className="input-label" htmlFor="newPassword">
                  New password
                </label>
                <div className={`input-row ${errors.newPassword ? "input-row--error" : ""}`}>
                  <input
                    id="newPassword"
                    className="input-field"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setErrors((prev) => ({ ...prev, newPassword: "", general: "" }));
                    }}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <i className={`ti ${showPassword ? "ti-eye-off" : "ti-eye"}`} aria-hidden="true"></i>
                  </button>
                </div>

                {/* Strength bar — same pattern as SignupPage */}
                {newPassword.length > 0 && (
                  <div className="strength-bar">
                    <div
                      className="strength-fill"
                      style={{
                        width: `${(getStrength() / 4) * 100}%`,
                        background: strengthColor[getStrength()],
                      }}
                    ></div>
                  </div>
                )}
                {newPassword.length > 0 && (
                  <p className="strength-label" style={{ color: strengthColor[getStrength()] }}>
                    {strengthLabel[getStrength()]}
                  </p>
                )}

                {errors.newPassword && (
                  <p className="input-error">
                    <i className="ti ti-alert-circle" aria-hidden="true"></i>
                    {errors.newPassword}
                  </p>
                )}
              </div>

              {/* Confirm new password */}
              <div className="password-field-wrapper" style={{ marginTop: 14 }}>
                <label className="input-label" htmlFor="confirmPassword">
                  Confirm new password
                </label>
                <div className={`input-row ${errors.confirmPassword ? "input-row--error" : ""}`}>
                  <input
                    id="confirmPassword"
                    className="input-field"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrors((prev) => ({ ...prev, confirmPassword: "", general: "" }));
                    }}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    <i className={`ti ${showConfirm ? "ti-eye-off" : "ti-eye"}`} aria-hidden="true"></i>
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="input-error">
                    <i className="ti ti-alert-circle" aria-hidden="true"></i>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* General error — e.g. expired token from the backend */}
              {errors.general && (
                <div className="login-error-banner" style={{ marginTop: 14 }}>
                  <i className="ti ti-alert-circle" aria-hidden="true"></i>
                  <span>{errors.general}</span>
                </div>
              )}

              <button
                type="submit"
                className={`login-submit ${loading ? "login-submit--loading" : ""}`}
                disabled={loading}
                style={{ marginTop: 16 }}
              >
                {loading ? (
                  <>
                    <i className="ti ti-loader-2 spin" aria-hidden="true"></i>
                    Resetting password...
                  </>
                ) : (
                  "Reset password"
                )}
              </button>

            </form>
          </>
        )}

        {/* Back to login — shown on every state */}
        <div className="login-divider">
          <hr />
          <span>or</span>
          <hr />
        </div>
        <p className="login-signup-row">
          Remembered your password? <Link to="/login">Log in</Link>
        </p>

      </div>
    </div>
  );
}