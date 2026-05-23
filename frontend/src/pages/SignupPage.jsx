import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/ui/Input";
import "./SignupPage.css";
import { signup } from "../services/authService";

export default function SignupPage() {

  //One useState per form field tracks what the user types
  const [fullName, setFullName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  //Separate state for error messages per field. Empty string "" means no error.
  const [errors, setErrors] = useState({
    fullName: "",
    studentNumber: "",
    gender: "",
    password: "",
    confirmPassword: "",
    agreed: "",
  });

  //Tracks loading state while the API call is in progress
  //Disables the submit button so the user cannot double-submit
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  //VALIDATION
  //Runs before submit to checks all fields and returns true/false
  const validate = () => {
    const newErrors = {
      fullName: "",
      studentNumber: "",
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

    //student number must be exactly 7 digits
    if (!studentNumber.trim()) {
      newErrors.studentNumber = "Student number is required";
      valid = false;
    } else if (!/^\d{7}$/.test(studentNumber.trim())) {
      newErrors.studentNumber = "Student number must be exactly 7 digits";
      valid = false;
    }

    if (!gender) {
      newErrors.gender = "Please select your gender";
      valid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      valid = false;
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

    //Update all error states in one call
    setErrors(newErrors);
    return valid;
  };

  //PASSWORD STRENGTH
  const getStrength = () => {
    if (password.length === 0) return 0;
    if (password.length < 6) return 1;
    if (password.length < 8) return 2;
    if (password.length < 12) return 3;
    return 4;
  };

  const strengthLabel = ["", "Too short", "Weak", "Good", "Strong"];
  const strengthColor = ["", "#E24B4A", "#EF9F27", "#4CAF82", "#1A5C3A"];

  const handleSubmit = async (e) => {
    e.preventDefault(); // stops the page from refreshing

    if (!validate()) return; // stop if any field has an error

    setLoading(true);

    try {
      //BUILD THE EMAIL from student number + domain
      const email = `${studentNumber.trim()}@myuwc.ac.za`;

      const response = await signup({
        fullName,      // authService converts this to full_name for Python
        email,
        password,
        gender,
      });

      console.log("Signup success:", response);

      // Redirect to verify email page after successful signup
      navigate("/verify-email");

    } catch (err) {
      const message = err.response?.data?.detail || "Signup failed. Please try again."
      setErrors((prev) => ({
        ...prev,
        studentNumber: message,
      }));
    } finally {
      // Always turn off loading whether it succeeded or failed
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* Brand */}
      <Link to="/" className="auth-brand">
        <div className="auth-logo-mark">
          <i className="ti ti-users" aria-hidden="true"></i>
        </div>
        <span className="auth-logo-txt">Study Connect</span>
      </Link>

      {/* Card */}
      <div className="auth-card">
        <div className="auth-card-header">
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-sub">Use your institution email to get started.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>

          {/* Full name */}
          <Input
            label="Full name"
            placeholder="e.g. Firstname Lastname"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={errors.fullName}
            required
          />

          {/* Student number + email suffix */}
          <Input
            label="Student email"
            placeholder="e.g. 4514906"
            value={studentNumber}
            onChange={(e) => setStudentNumber(e.target.value)}
            error={errors.studentNumber}
            hint="Enter your 7-digit student number"
            suffix="@myuwc.ac.za"
            required
          />

          {/* Gender */}
          <div className="input-wrapper">
            <label className="input-label">
              Gender <span className="input-required">*</span>
            </label>
            <div className={`input-row ${errors.gender ? "input-row--error" : ""}`}>
              <i className="ti ti-gender-bigender input-icon" aria-hidden="true"></i>
              <select
                className="input-field input-select"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Select gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Prefer not to say</option>
              </select>
            </div>
            {errors.gender && (
              <p className="input-error" role="alert">
                <i className="ti ti-alert-circle" aria-hidden="true"></i>
                {errors.gender}
              </p>
            )}
          </div>

          {/* Password row */}
          <div className="auth-row">

            {/* Password */}
            <div className="input-wrapper">
              <label className="input-label">
                Password <span className="input-required">*</span>
              </label>
              <div className={`input-row ${errors.password ? "input-row--error" : ""}`}>
                <i className="ti ti-lock input-icon" aria-hidden="true"></i>
                <input
                  className="input-field"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {/* toggles between showing and hiding password */}
                <button
                  type="button"
                  className="input-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={`ti ${showPassword ? "ti-eye-off" : "ti-eye"}`} aria-hidden="true"></i>
                </button>
              </div>
              {/* Password strength bar */}
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

            {/* Confirm password */}
            <div className="input-wrapper">
              <label className="input-label">
                Confirm password <span className="input-required">*</span>
              </label>
              <div className={`input-row ${errors.confirmPassword ? "input-row--error" : ""}`}>
                <i className="ti ti-lock input-icon" aria-hidden="true"></i>
                <input
                  className="input-field"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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

          {/* Terms checkbox */}
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

          {/* Submit button */}
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

        {/* Divider */}
        <div className="auth-divider">
          <hr />
          <span>already have an account?</span>
          <hr />
        </div>

        {/* Link to login */}
        <Link to="/login" className="auth-submit auth-submit--outline">
          Log in instead
        </Link>

      </div>
    </div>
  );
}