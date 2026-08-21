import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/ui/Input";
import "./SignupPage.css";
import { signup } from "../services/authService";
import { validatePassword } from "../utils/validators";

export default function SignupPage() {

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    gender: "",
    password: "",
    confirmPassword: "",
    agreed: "",
  });

  const navigate = useNavigate();

  // Validation
  const validate = () => {
    const newErrors = {
      fullName: "",
      email: "",
      gender: "",
      password: "",
      confirmPassword: "",
      agreed: "",
    };

    let valid = true;

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
      valid = false;
    }

    if (!email.trim()) {
      newErrors.email = "Email address is required";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address";
      valid = false;
    }

    if (!gender) {
      newErrors.gender = "Please select your gender";
      valid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      valid = false;
    } else {
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        newErrors.password = passwordErrors.join(", ");
        valid = false;
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
      valid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      valid = false;
    }

    if (!agreed) {
      newErrors.agreed = "You must agree to the terms to continue";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const getStrength = () => {
    if (password.length === 0) return 0;
    const errors = validatePassword(password);
    if (errors.length >= 4) return 1;
    if (errors.length === 3) return 2;
    if (errors.length === 2) return 3;
    if (errors.length === 1) return 3;
    return 4;
  };

  const strengthLabel = ["", "Too short", "Weak", "Good", "Strong"];
  const strengthColor = ["", "#E24B4A", "#EF9F27", "#4CAF82", "#1A5C3A"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {

      const response = await signup({
        fullName,
        email: email.trim(),
        password,
        gender,
      });

      console.log(response.message);
      navigate("/auth/verify-email");

    } catch (err) {

      console.log("Full error:", err);
      console.log("Response data:", err.response?.data);

      const detail = err.response?.data?.detail;
      let message = "Signup failed. Please try again.";

      if (typeof detail === "string") {
        message = detail;
      } else if (Array.isArray(detail)) {
        message = detail.map((d) => d.msg).join(", ");
      }

      setErrors((prev) => ({
        ...prev,
        email: message,
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <Link to="/" className="auth-brand">
        <span className="auth-logo-txt">Study Connect</span>
      </Link>

      <div className="auth-card">
        <div className="auth-card-header">
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-sub">Use your institution email to get started.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>

          <Input
            label="Full name"
            placeholder="e.g. Firstname Lastname"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setErrors((prev) => ({ ...prev, fullName: "" }));
            }}
            error={errors.fullName}
            required
          />

          <Input
            label="Email address"
            type="email"
            placeholder="e.g. studentnumber@institution.ac.za"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => ({ ...prev, email: "" }));
            }}
            error={errors.email}
            hint="Enter your institution email address"
            required
          />

          <div className="input-wrapper">
            <label className="input-label">
              Gender <span className="input-required">*</span>
            </label>
            <div className={`input-row ${errors.gender ? "input-row--error" : ""}`}>
              <i className="ti ti-gender-bigender input-icon" aria-hidden="true"></i>
              <select
                className="input-field input-select"
                value={gender}
                onChange={(e) => {
                  setGender(e.target.value);
                  setErrors((prev) => ({ ...prev, gender: "" }));
                }}
              >
                <option value="">Select gender</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Nonbinary">Nonbinary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            {errors.gender && (
              <p className="input-error" role="alert">
                <i className="ti ti-alert-circle" aria-hidden="true"></i>
                {errors.gender}
              </p>
            )}
          </div>

          <div className="auth-row">

            <div className="input-wrapper">
              <label className="input-label">
                Password <span className="input-required">*</span>
              </label>
              <div className={`input-row ${errors.password ? "input-row--error" : ""}`}>
                <input
                  className="input-field"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, password: "" }));
                  }}
                />
                <button
                  type="button"
                  className="input-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={`ti ${showPassword ? "ti-eye-off" : "ti-eye"}`} aria-hidden="true"></i>
                </button>
              </div>
              {password.length > 0 && (
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
              {password.length > 0 && (
                <p className="strength-label" style={{ color: strengthColor[getStrength()] }}>
                  {strengthLabel[getStrength()]}
                </p>
              )}
              {errors.password && (
                <p className="input-error" role="alert">
                  <i className="ti ti-alert-circle" aria-hidden="true"></i>
                  {errors.password}
                </p>
              )}
            </div>

            <div className="input-wrapper">
              <label className="input-label">
                Confirm password <span className="input-required">*</span>
              </label>
              <div className={`input-row ${errors.confirmPassword ? "input-row--error" : ""}`}>
                <input
                  className="input-field"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                  }}
                />
                <button
                  type="button"
                  className="input-eye"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  <i className={`ti ${showConfirm ? "ti-eye-off" : "ti-eye"}`} aria-hidden="true"></i>
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="input-error" role="alert">
                  <i className="ti ti-alert-circle" aria-hidden="true"></i>
                  {errors.confirmPassword}
                </p>
              )}
            </div>

          </div>

          <div className="auth-terms">
            <input
              type="checkbox"
              id="terms"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="auth-checkbox"
            />
            <label htmlFor="terms" className="auth-terms-label">
              I agree to the <a href="/terms" className="auth-link">terms of service</a> and <a href="/privacy" className="auth-link">privacy policy</a>
            </label>
          </div>
          {errors.agreed && (
            <p className="input-error" role="alert">
              <i className="ti ti-alert-circle" aria-hidden="true"></i>
              {errors.agreed}
            </p>
          )}

          <button
            type="submit"
            className={`auth-submit ${loading ? "auth-submit--loading" : ""}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="ti ti-loader-2 spin" aria-hidden="true"></i>
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </button>

        </form>

        <div className="auth-divider">
          <hr />
          <span>already have an account?</span>
          <hr />
        </div>

        <Link to="/login" className="auth-submit auth-submit--outline">
          Log in instead
        </Link>

      </div>
    </div>
  );

}