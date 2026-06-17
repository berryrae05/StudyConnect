import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Input from "../components/ui/Input";
import "./CreateGroupPage.css";

// ── MOCK DATA ─────────────────────────────────────────────────
// TODO: Replace with real API calls when module/venue endpoints ready.
// These populate the module and location dropdowns.
const MOCK_MODULES = [
  { code: "COS301", name: "Software Engineering"    },
  { code: "COS201", name: "Data Structures"         },
  { code: "MAT211", name: "Calculus"                },
  { code: "PHY101", name: "Physics"                 },
  { code: "STA221", name: "Statistics"              },
];

const MOCK_VENUES = [
  "Library Room 2B",
  "Library Room 3A",
  "Engineering Lab 1",
  "Engineering Lab 3",
  "Student Centre",
  "Main Hall Study Room",
  "Science Block Room 5",
];

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function CreateGroupPage() {

  // ── FORM STATE ──────────────────────────────────────────────
  // REACT: One state variable per field.
  // These map directly to the GroupCreate schema fields.
  const [moduleCode, setModuleCode]     = useState("");
  const [description, setDescription]  = useState("");
  const [location, setLocation]         = useState("");
  const [studyDate, setStudyDate]       = useState(""); // date part e.g. 2025-05-12
  const [studyTime, setStudyTime]       = useState(""); // time part e.g. 14:00
  const [maxMembers, setMaxMembers]     = useState(5);

  // ── USER STATE ──────────────────────────────────────────────
  // REACT: Reads the logged-in user from localStorage.
  // We need user.id to send as created_by in the request body.
  const [user, setUser] = useState(null);

  // ── ERROR STATE ─────────────────────────────────────────────
  const [errors, setErrors] = useState({
    moduleCode:  "",
    location:    "",
    studyDate:   "",
    studyTime:   "",
    maxMembers:  "",
    general:     "",
  });

  // ── LOADING STATE ───────────────────────────────────────────
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // REACT: useEffect runs once on mount to read the logged-in user.
  // If no user found, redirect to login.
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(savedUser));
  }, []);

  // ── VALIDATION ──────────────────────────────────────────────
  const validate = () => {
    const newErrors = {
      moduleCode: "",
      location:   "",
      studyDate:  "",
      studyTime:  "",
      maxMembers: "",
      general:    "",
    };
    let valid = true;

    if (!moduleCode) {
      newErrors.moduleCode = "Please select a module";
      valid = false;
    }

    if (!location) {
      newErrors.location = "Please select a venue";
      valid = false;
    }

    if (!studyDate) {
      newErrors.studyDate = "Please select a date";
      valid = false;
    } else {
      // Make sure the date is not in the past
      const selected = new Date(studyDate);
      const today    = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        newErrors.studyDate = "Date cannot be in the past";
        valid = false;
      }
    }

    if (!studyTime) {
      newErrors.studyTime = "Please select a time";
      valid = false;
    }

    if (!maxMembers || maxMembers < 2) {
      newErrors.maxMembers = "Group must have at least 2 members";
      valid = false;
    }

    if (maxMembers > 500) {
      newErrors.maxMembers = "Maximum allowed is 500 members";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // ── SUBMIT ──────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      // Combine date and time into a single ISO datetime string
      // Backend expects format: "2025-05-12T14:00:00"
      const dateTime = `${studyDate}T${studyTime}:00`;

      // Build the request body matching GroupCreate schema exactly
      const payload = {
        module_code:  moduleCode,
        description:  description.trim() || null,
        location:     location,
        date_time:    dateTime,
        max_members:  Number(maxMembers),
        created_by:   user.id,
      };

      // Get the JWT token saved during login
      const token = localStorage.getItem("access_token");

      // POST /groups — requires Authorization header
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/groups`,
        {
          method:  "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        // Read the error detail from the response body
        const errorData = await response.json();
        const detail    = errorData?.detail;
        let message     = "Failed to create group. Please try again.";

        if (typeof detail === "string") {
          message = detail;
        } else if (Array.isArray(detail)) {
          message = detail.map((d) => d.msg).join(", ");
        }

        setErrors((prev) => ({ ...prev, general: message }));
        return;
      }

      const newGroup = await response.json();
      console.log("Group created:", newGroup);

      // Redirect to dashboard after successful creation
      navigate("/dashboard");

    } catch (err) {
      console.error("Create group error:", err);
      setErrors((prev) => ({
        ...prev,
        general: "Something went wrong. Please check your connection.",
      }));
    } finally {
      // REACT: Always turn off loading whether success or failure
      setLoading(false);
    }
  };

  // ── GUARD ───────────────────────────────────────────────────
  // Do not render until user is loaded from localStorage
  if (!user) return null;

  // ── JSX ─────────────────────────────────────────────────────
  return (
    <div className="cg-root">

      {/* Shared navbar */}
      <Navbar user={user} activeLink="dashboard" />

      {/* Page content */}
      <div className="cg-content">

        {/* Page heading */}
        <div className="cg-header">
          <Link to="/dashboard" className="cg-back">
            <i className="ti ti-arrow-left" aria-hidden="true"></i>
            Back to dashboard
          </Link>
          <h1 className="cg-title">Create a study group</h1>
          <p className="cg-sub">
            Fill in the details below. Other students will be able to find
            and request to join your group.
          </p>
        </div>

        {/* Form card */}
        <div className="cg-card">

          {/* General error banner */}
          {/* REACT: Only renders if errors.general has a value */}
          {errors.general && (
            <div className="cg-error-banner">
              <i className="ti ti-alert-circle" aria-hidden="true"></i>
              <span>{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* ── MODULE ──────────────────────────────── */}
            <div className="cg-field">
              <label className="cg-label">
                Module <span className="cg-required">*</span>
              </label>
              <div className={`cg-select-wrap ${errors.moduleCode ? "cg-select-wrap--error" : ""}`}>
                <i className="ti ti-book cg-select-icon" aria-hidden="true"></i>
                <select
                  className="cg-select"
                  value={moduleCode}
                  onChange={(e) => {
                    setModuleCode(e.target.value);
                    setErrors((prev) => ({ ...prev, moduleCode: "" }));
                  }}
                >
                  <option value="">Select a module</option>
                  {/* REACT: .map() renders one option per module */}
                  {MOCK_MODULES.map((mod) => (
                    <option key={mod.code} value={mod.code}>
                      {mod.code} — {mod.name}
                    </option>
                  ))}
                </select>
                <i className="ti ti-chevron-down cg-select-arrow" aria-hidden="true"></i>
              </div>
              {errors.moduleCode && (
                <p className="cg-field-error">
                  <i className="ti ti-alert-circle" aria-hidden="true"></i>
                  {errors.moduleCode}
                </p>
              )}
            </div>

            {/* ── DESCRIPTION ─────────────────────────── */}
            <div className="cg-field">
              <label className="cg-label">
                Description
                <span className="cg-optional"> — optional</span>
              </label>
              <textarea
                className="cg-textarea"
                placeholder="e.g. We will be focusing on past papers and design patterns..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
              />
              {/* Character count */}
              <span className="cg-char-count">{description.length}/500</span>
            </div>

            {/* ── VENUE ───────────────────────────────── */}
            <div className="cg-field">
              <label className="cg-label">
                Venue (on-campus only) <span className="cg-required">*</span>
              </label>
              <div className={`cg-select-wrap ${errors.location ? "cg-select-wrap--error" : ""}`}>
                <i className="ti ti-map-pin cg-select-icon" aria-hidden="true"></i>
                <select
                  className="cg-select"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setErrors((prev) => ({ ...prev, location: "" }));
                  }}
                >
                  <option value="">Select a venue</option>
                  {/* REACT: .map() renders one option per venue */}
                  {MOCK_VENUES.map((venue) => (
                    <option key={venue} value={venue}>
                      {venue}
                    </option>
                  ))}
                </select>
                <i className="ti ti-chevron-down cg-select-arrow" aria-hidden="true"></i>
              </div>
              {errors.location && (
                <p className="cg-field-error">
                  <i className="ti ti-alert-circle" aria-hidden="true"></i>
                  {errors.location}
                </p>
              )}
            </div>

            {/* ── DATE AND TIME — side by side ────────── */}
            <div className="cg-row">

              {/* Date */}
              <div className="cg-field">
                <label className="cg-label">
                  Date <span className="cg-required">*</span>
                </label>
                <div className={`cg-input-wrap ${errors.studyDate ? "cg-input-wrap--error" : ""}`}>
                  <i className="ti ti-calendar cg-input-icon" aria-hidden="true"></i>
                  <input
                    className="cg-input"
                    type="date"
                    value={studyDate}
                    onChange={(e) => {
                      setStudyDate(e.target.value);
                      setErrors((prev) => ({ ...prev, studyDate: "" }));
                    }}
                    // Prevent selecting dates in the past
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                {errors.studyDate && (
                  <p className="cg-field-error">
                    <i className="ti ti-alert-circle" aria-hidden="true"></i>
                    {errors.studyDate}
                  </p>
                )}
              </div>

              {/* Time */}
              <div className="cg-field">
                <label className="cg-label">
                  Time <span className="cg-required">*</span>
                </label>
                <div className={`cg-input-wrap ${errors.studyTime ? "cg-input-wrap--error" : ""}`}>
                  <i className="ti ti-clock cg-input-icon" aria-hidden="true"></i>
                  <input
                    className="cg-input"
                    type="time"
                    value={studyTime}
                    onChange={(e) => {
                      setStudyTime(e.target.value);
                      setErrors((prev) => ({ ...prev, studyTime: "" }));
                    }}
                  />
                </div>
                {errors.studyTime && (
                  <p className="cg-field-error">
                    <i className="ti ti-alert-circle" aria-hidden="true"></i>
                    {errors.studyTime}
                  </p>
                )}
              </div>

            </div>

            {/* ── MAX MEMBERS ─────────────────────────── */}
            <div className="cg-field cg-field--narrow">
              <label className="cg-label">
                Max participants <span className="cg-required">*</span>
              </label>
              <div className={`cg-input-wrap ${errors.maxMembers ? "cg-input-wrap--error" : ""}`}>
                <i className="ti ti-users cg-input-icon" aria-hidden="true"></i>
                <input
                  className="cg-input"
                  type="number"
                  min={2}
                  max={500}
                  value={maxMembers}
                  onChange={(e) => {
                    setMaxMembers(e.target.value);
                    setErrors((prev) => ({ ...prev, maxMembers: "" }));
                  }}
                />
              </div>
              <p className="cg-hint">Including yourself. Minimum 2, maximum 500.</p>
              {errors.maxMembers && (
                <p className="cg-field-error">
                  <i className="ti ti-alert-circle" aria-hidden="true"></i>
                  {errors.maxMembers}
                </p>
              )}
            </div>

            {/* ── SUBMIT ──────────────────────────────── */}
            <div className="cg-actions">
              <Link to="/dashboard" className="cg-cancel-btn">
                Cancel
              </Link>
              <button
                type="submit"
                className={`cg-submit-btn ${loading ? "cg-submit-btn--loading" : ""}`}
                disabled={loading}
              >
                {/* REACT: Show spinner while API call is in progress */}
                {loading ? (
                  <>
                    <i className="ti ti-loader-2 spin" aria-hidden="true"></i>
                    Creating group...
                  </>
                ) : (
                  <>
                    <i className="ti ti-plus" aria-hidden="true"></i>
                    Create group
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}