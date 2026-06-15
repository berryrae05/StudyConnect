// Top navigation bar for all authenticated pages
// Reusable component - import this into any page that needs it.

import { useNavigate, Link } from "react-router-dom";
import "./Navbar.css";

// Get initials from a name string, e.g., "Tshepo Mosia" -> "TM"
const getInitials = (name = "") =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

export default function Navbar({ user, onLogout, activeLink }) {
    const navigate = useNavigate();

    // Function to handle logout by removing the access token and user data from localStorage,
    // then navigating to the login page
    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    return (
        <header className="nav nav--scrolled">

            {/* Left: Logo */}
            <Link to="/dashboard" className="logo-row">
                <div className="logo-mark">
                    <i className="ti ti-users" aria-hidden="true"></i>
                </div>
                <span className="logo-txt">Study Connect</span>
            </Link>

            {/* Middle: Browse and My Groups */}
            <nav className="nav-links">
                <Link
                    to="/browse"
                    className={`nav-link ${activeLink === "browse" ? "nav-link--active" : ""}`}
                >
                    Browse
                </Link>
                <Link
                    to="/dashboard"
                    className={`nav-link ${activeLink === "dashboard" ? "nav-link--active" : ""}`}
                >
                    My groups
                </Link>
            </nav>

            {/* Right: User info and logout */}
            <div className="nav-actions">
                <div className="user-avatar" title={user?.full_name || "Account"}>
                    {user ? getInitials(user.full_name) : "?"}
                </div>

                <button
                    className="btn"
                    onClick={handleLogout}
                >
                    Logout
                </button>

            </div>

        </header>
    );

}