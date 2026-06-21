import { useState } from "react";
import { Link } from "react-router-dom";
import Input from "../components/ui/Input";
import { forgotPassword } from "../services/authService";
import "./ForgotPasswordPage.css";

export default function ForgotPasswordPage() {

    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [submitted, setSubmitted] = useState(false);

    const validate = () => {
        if (!email.trim()) {
            setError("Email address is required");
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError("Please enter a valid email address");
            return false;
        }
        setError("");
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) return;

        setLoading(true);

        try {
            // Calls POST /auth/forgot-password — defined in authService.js
            await forgotPassword({ email: email.trim() });

            setSubmitted(true);

        } catch (err) {
            const detail = err.response?.data?.detail;
            let message = "Something went wrong. Please try again.";

            if (typeof detail === "string") {
                message = detail;
            } else if (Array.isArray(detail)) {
                message = detail.map((d) => d.msg).join(", ");
            }

            setError(message);

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">

            {/* Brand */}
            <Link to="/" className="auth-brand">
                <span>Study Connect</span>
            </Link>

            <div className="auth-card">

                {/* Logo mark */}
                <div className="login-logo-mark">
                    <i className="ti ti-key" aria-hidden="true"></i>
                </div>

                {!submitted ? (
                    <>
                        <h1 className="login-title">Forgot your password?</h1>
                        <p className="login-sub">
                            Enter your email address and we will send you a link to reset your password.
                        </p>

                        {/* General error banner */}
                        {error && (
                            <div className="login-error-banner">
                                <i className="ti ti-alert-circle" aria-hidden="true"></i>
                                <span>{error}</span>
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
                                    // Clear error as soon as the user starts typing again
                                    setError("");
                                }}
                                error={error}
                                required
                            />

                            <button
                                type="submit"
                                className={`login-submit ${loading ? "login-submit--loading" : ""}`}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <i className="ti ti-loader-2 spin" aria-hidden="true"></i>
                                        Sending link...
                                    </>
                                ) : (
                                    "Send reset link"
                                )}
                            </button>

                        </form>
                    </>
                ) : (
                    <>
                        <h1 className="login-title">Check your email</h1>
                        <p className="login-sub">
                            If an account exists for <strong>{email}</strong>, we have sent
                            a password reset link to that address.
                        </p>

                        <div className="forgot-note">
                            <i className="ti ti-info-circle" aria-hidden="true"></i>
                            <p>
                                The link will expire after a short time. If you do not see the
                                email, check your spam folder.
                            </p>
                        </div>

                        {/* Allow the user to try a different email */}
                        <button
                            type="button"
                            className="login-submit login-submit--outline"
                            onClick={() => {
                                setSubmitted(false);
                                setEmail("");
                            }}
                        >
                            Try a different email
                        </button>
                    </>
                )}

                {/* Divider */}
                <div className="login-divider">
                    <hr />
                    <span>or</span>
                    <hr />
                </div>

                {/* Back to login */}
                <p className="login-signup-row">
                    Remembered your password? <Link to="/login">Log in</Link>
                </p>

            </div>
        </div>
    );
}