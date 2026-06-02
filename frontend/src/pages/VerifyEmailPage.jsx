import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { verifyEmail } from "../services/authService";
import "./VerifyEmailPage.css";

export default function VerifyEmailPage() {

  // REACT: useSearchParams reads the ?token= from the URL
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // DEBUG: Log the full URL and the extracted token to verify it's working
  console.log("Full URL:", window.location.href);
  console.log("Token from URL:", token);

  const [status, setStatus] = useState("idle"); // idle | verifying | success | error
  const [message, setMessage] = useState("");

  // If there is a token in the URL, verify it automatically
  useEffect(() => {
    // Only attempt verification if we have a token and we're in the idle state
    // (to prevent multiple calls if token changes)
    if (token && status === "idle") {
      handleVerify(token);
    }
  }, [token]); // Only run when token changes

  const handleVerify = async (tkn) => {
    // If no token found, show error immediately
    if (!tkn || tkn === "undefined") {
      setStatus("error");
      setMessage("No verification token found. Please check your email link.");
      return;
    }
    // Start verification process
    setStatus("verifying");
    try {
      const response = await verifyEmail(tkn);
      setMessage(response.message);
      setStatus("success");
    } catch (err) {
      setMessage(err.response?.data?.detail || "Verification failed. Please try again.");
      setStatus("error");
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

      <div className="auth-card">

        {/* No token — user just signed up, waiting for email */}
        {status === "idle" && (
          <div className="verify-content">
            <div className="verify-icon">
              <i className="ti ti-mail" aria-hidden="true"></i>
            </div>
            <h1 className="auth-title">Check your email</h1>
            <p className="auth-sub">
              We sent a verification link to your UWC email address.
              Click the link in the email to activate your account.
            </p>
            <div className="verify-note">
              <i className="ti ti-info-circle" aria-hidden="true"></i>
              <p>Make sure to open the link on the same device that received the email.</p>
            </div>
            <Link to="/login" className="auth-submit auth-submit--outline" style={{ marginTop: 8 }}>
              Back to login
            </Link>
          </div>
        )}

        {/* Verifying — token found in URL, calling API */}
        {status === "verifying" && (
          <div className="verify-content">
            <div className="verify-icon verify-icon--loading">
              <i className="ti ti-loader-2 spin" aria-hidden="true"></i>
            </div>
            <h1 className="auth-title">Verifying your email...</h1>
            <p className="auth-sub">Please wait a moment.</p>
          </div>
        )}

        {/* Success */}
        {status === "success" && (
          <div className="verify-content">
            <div className="verify-icon verify-icon--success">
              <i className="ti ti-circle-check" aria-hidden="true"></i>
            </div>
            <h1 className="auth-title">Email verified</h1>
            <p className="auth-sub">{message}</p>
            <Link to="/login" className="auth-submit" style={{ marginTop: 8 }}>
              Log in to your account
            </Link>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="verify-content">
            <div className="verify-icon verify-icon--error">
              <i className="ti ti-circle-x" aria-hidden="true"></i>
            </div>
            <h1 className="auth-title">Verification failed</h1>
            <p className="auth-sub">{message}</p>
            <Link to="/signup" className="auth-submit auth-submit--outline" style={{ marginTop: 8 }}>
              Back to sign up
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}