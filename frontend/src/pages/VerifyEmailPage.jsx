import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { verifyEmail, resendVerification } from "../services/authService";
import "./VerifyEmailPage.css";

export default function VerifyEmailPage() {

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const storedUser = localStorage.getItem("user");
  const storedEmail = storedUser ? JSON.parse(storedUser).email : "";

  const [resendEmail, setResendEmail] = useState(storedEmail);
  const [showEmailInput, setShowEmailInput] = useState(!storedEmail);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState("");
  const [resendMessage, setResendMessage] = useState("");

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

  const handleResend = async () => {
    if (!resendEmail.trim()) {
      setShowEmailInput(true);
      setResendStatus("error");
      setResendMessage("Please enter your email address.");
      return;
    }

    setResending(true);
    setResendStatus("");
    setResendMessage("");

    try {
      const response = await resendVerification(resendEmail.trim());
      setResendStatus("success");
      setResendMessage(response.message || "Verification email resent successfully.");
    } catch (err) {
      setResendStatus("error");
      setResendMessage(err.response?.data?.detail || "Failed to resend verification email.");
    } finally {
      setResending(false);
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
            <h1 className="auth-title">Check your email</h1>
            <p className="auth-sub">
              We sent a verification link to your email address.
              Click the link in the email to activate your account.
            </p>
            <div className="verify-note">
              <i className="ti ti-info-circle" aria-hidden="true"></i>
              <p>Make sure to open the link on the same device that received the email.</p>
            </div>
            <Link to="/login" className="auth-submit auth-submit--outline" style={{ marginTop: 8 }}>
              Back to login
            </Link>

            {/* Resend block */}
            <div className="verify-resend-block">
              <p className="verify-resend-label">Did not receive the email?</p>

              {showEmailInput && (
                <input
                  className="verify-email-input"
                  type="email"
                  placeholder="Enter your email address"
                  value={resendEmail}
                  onChange={(e) => {
                    setResendEmail(e.target.value);
                    setResendStatus("");
                  }}
                />
              )}

              {resendStatus === "success" && (
                <p className="verify-resend-success">
                  <i className="ti ti-circle-check" aria-hidden="true"></i>
                  {resendMessage}
                </p>
              )}

              {resendStatus === "error" && (
                <p className="verify-resend-error">
                  <i className="ti ti-alert-circle" aria-hidden="true"></i>
                  {resendMessage}
                </p>
              )}

              <button
                className="verify-resend-btn"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? (
                  <>
                    <i className="ti ti-loader-2 spin" aria-hidden="true"></i>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="ti ti-mail-forward" aria-hidden="true"></i>
                    Resend verification email
                  </>
                )}
              </button>
            </div>
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

            {/* Resend block */}
            <div className="verify-resend-block">
              <p className="verify-resend-label">Did not receive the email?</p>

              {showEmailInput && (
                <input
                  className="verify-email-input"
                  type="email"
                  placeholder="Enter your email address"
                  value={resendEmail}
                  onChange={(e) => {
                    setResendEmail(e.target.value);
                    setResendStatus("");
                  }}
                />
              )}

              {resendStatus === "success" && (
                <p className="verify-resend-success">
                  <i className="ti ti-circle-check" aria-hidden="true"></i>
                  {resendMessage}
                </p>
              )}

              {resendStatus === "error" && (
                <p className="verify-resend-error">
                  <i className="ti ti-alert-circle" aria-hidden="true"></i>
                  {resendMessage}
                </p>
              )}

              <button
                className="verify-resend-btn"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? (
                  <>
                    <i className="ti ti-loader-2 spin" aria-hidden="true"></i>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="ti ti-mail-forward" aria-hidden="true"></i>
                    Resend verification email
                  </>
                )}
              </button>
            </div>
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

            {/* Resend block */}
            <div className="verify-resend-block">
              <p className="verify-resend-label">Did not receive the email?</p>

              {showEmailInput && (
                <input
                  className="verify-email-input"
                  type="email"
                  placeholder="Enter your email address"
                  value={resendEmail}
                  onChange={(e) => {
                    setResendEmail(e.target.value);
                    setResendStatus("");
                  }}
                />
              )}

              {resendStatus === "success" && (
                <p className="verify-resend-success">
                  <i className="ti ti-circle-check" aria-hidden="true"></i>
                  {resendMessage}
                </p>
              )}

              {resendStatus === "error" && (
                <p className="verify-resend-error">
                  <i className="ti ti-alert-circle" aria-hidden="true"></i>
                  {resendMessage}
                </p>
              )}

              <button
                className="verify-resend-btn"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? (
                  <>
                    <i className="ti ti-loader-2 spin" aria-hidden="true"></i>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="ti ti-mail-forward" aria-hidden="true"></i>
                    Resend verification email
                  </>
                )}
              </button>
            </div>
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

            {/* Resend block */}
            <div className="verify-resend-block">
              <p className="verify-resend-label">Did not receive the email?</p>

              {showEmailInput && (
                <input
                  className="verify-email-input"
                  type="email"
                  placeholder="Enter your email address"
                  value={resendEmail}
                  onChange={(e) => {
                    setResendEmail(e.target.value);
                    setResendStatus("");
                  }}
                />
              )}

              {resendStatus === "success" && (
                <p className="verify-resend-success">
                  <i className="ti ti-circle-check" aria-hidden="true"></i>
                  {resendMessage}
                </p>
              )}

              {resendStatus === "error" && (
                <p className="verify-resend-error">
                  <i className="ti ti-alert-circle" aria-hidden="true"></i>
                  {resendMessage}
                </p>
              )}

              <button
                className="verify-resend-btn"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? (
                  <>
                    <i className="ti ti-loader-2 spin" aria-hidden="true"></i>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="ti ti-mail-forward" aria-hidden="true"></i>
                    Resend verification email
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}