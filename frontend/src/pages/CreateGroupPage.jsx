import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import API from "../services/api.js";
import { getModules, getVenues } from "../services/adminService.js";
import "./CreateGroupPage.css";


export default function CreateGroupPage() {

  const [moduleCode, setModuleCode] = useState("");
  const [description, setDescription] = useState("");
  const [venueId, setVenueId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [maxMembers, setMaxMembers] = useState(5);

  // User state tracks the logged-in user, which is required to create a group
  const [user, setUser] = useState(null);

  // Modules and venues are fetched from the backend to populate the dropdowns
  const [modules, setModules] = useState([]);
  const [venues, setVenues] = useState([]);

  // Errors state tracks validation errors for each field and a general error message
  const [errors, setErrors] = useState({
    moduleCode: "",
    venueId: "",
    startDate: "",
    startTime: "",
    endTime: "",
    maxMembers: "",
    general: "",
  });

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // useEffect to load user, modules, and venues on component mount
  useEffect(() => {
    const loadPageData = async () => {
      const savedUser = localStorage.getItem("user");

      if (!savedUser) {
        navigate("/login");
        return;
      }

      setUser(JSON.parse(savedUser));

      try {
        const [modulesData, venuesData] = await Promise.all([
          getModules(),
          getVenues(),
        ]);

        setModules(modulesData);
        setVenues(venuesData);
      } catch (error) {
        console.error("Failed to load modules/venues:", error);
      }
    };

    loadPageData();
  }, []);

  const validate = () => {
    const newErrors = {
      moduleCode: "",
      venueId: "",
      startDate: "",
      startTime: "",
      endTime: "",
      maxMembers: "",
      general: "",
    };
    let valid = true;

    if (!moduleCode) {
      newErrors.moduleCode = "Please select a module";
      valid = false;
    }

    if (!venueId) {
      newErrors.venueId = "Please select a venue";
      valid = false;
    }

    if (!startDate) {
      newErrors.startDate = "Please select a date";
      valid = false;
    } else {
      const selected = new Date(startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        newErrors.startDate = "Date cannot be in the past";
        valid = false;
      }
    }

    if (!startTime) {
      newErrors.startTime = "Please select a start time";
      valid = false;
    }

    if (!endTime) {
      newErrors.endTime = "Please select an end time";
      valid = false;
    } else if (startTime && endTime <= startTime) {
      newErrors.endTime = "End time must be after start time";
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

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const dateTime = `${startDate}T${startTime}:00`;

      const payload = {
        module_code: moduleCode,
        description: description.trim() || null,
        venue_id: Number(venueId),
        start_time: `${startDate}T${startTime}:00`,
        end_time: `${startDate}T${endTime}:00`,
        max_members: Number(maxMembers),
      };

      const response = await API.post("/groups", payload);
      console.log("Group created:", response.data);
      navigate("/dashboard");

    } catch (err) {
      const detail = err.response?.data?.detail;
      let message = "Failed to create group. Please try again.";

      if (typeof detail === "string") {
        message = detail;
      } else if (Array.isArray(detail)) {
        message = detail.map((d) => d.msg).join(", ");
      }

      setErrors((prev) => ({ ...prev, general: message }));
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

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

          {errors.general && (
            <div className="cg-error-banner">
              <i className="ti ti-alert-circle" aria-hidden="true"></i>
              <span>{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* MODULE */}
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
                  {modules.map((mod) => (
                    <option key={mod.id} value={mod.code}>
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

            {/* DESCRIPTION */}
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

            {/* VENUE */}
            <div className="cg-field">
              <label className="cg-label">
                Venue (on-campus only) <span className="cg-required">*</span>
              </label>
              <div className={`cg-select-wrap ${errors.venueId ? "cg-select-wrap--error" : ""}`}>
                <i className="ti ti-map-pin cg-select-icon" aria-hidden="true"></i>
                <select
                  className="cg-select"
                  value={venueId}
                  onChange={(e) => {
                    setVenueId(e.target.value);
                    setErrors((prev) => ({ ...prev, venueId: "" }));
                  }}
                >
                  <option value="">Select a venue</option>

                  {venues.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name}
                    </option>
                  ))}
                </select>
                <i className="ti ti-chevron-down cg-select-arrow" aria-hidden="true"></i>
              </div>
              {errors.venueId && (
                <p className="cg-field-error">
                  <i className="ti ti-alert-circle" aria-hidden="true"></i>
                  {errors.venueId}
                </p>
              )}
            </div>

            {/* DATE AND TIME */}
            <div className="cg-row">

              {/* Date */}
              <div className="cg-field">
                <label className="cg-label">
                  Date <span className="cg-required">*</span>
                </label>
                <div className={`cg-input-wrap ${errors.startDate ? "cg-input-wrap--error" : ""}`}>
                  <i className="ti ti-calendar cg-input-icon" aria-hidden="true"></i>
                  <input
                    className="cg-input"
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setErrors((prev) => ({ ...prev, startDate: "" }));
                    }}
                    // Prevent selecting dates in the past
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                {errors.startDate && (
                  <p className="cg-field-error">
                    <i className="ti ti-alert-circle" aria-hidden="true"></i>
                    {errors.startDate}
                  </p>
                )}
              </div>

              {/* Start Time */}
              <div className="cg-field">
                <label className="cg-label">
                  Start Time <span className="cg-required">*</span>
                </label>
                <div className={`cg-input-wrap ${errors.startTime ? "cg-input-wrap--error" : ""}`}>
                  <i className="ti ti-clock cg-input-icon" aria-hidden="true"></i>
                  <input
                    className="cg-input"
                    type="time"
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      setErrors((prev) => ({ ...prev, startTime: "" }));
                    }}
                  />
                </div>
                {errors.startTime && (
                  <p className="cg-field-error">
                    <i className="ti ti-alert-circle" aria-hidden="true"></i>
                    {errors.startTime}
                  </p>
                )}
              </div>

            </div>

            {/* End time */}
            <div className="cg-field">
              <label className="cg-label">
                End Time <span className="cg-required">*</span>
              </label>
              <div className={`cg-input-wrap ${errors.endTime ? "cg-input-wrap--error" : ""}`}>
                <i className="ti ti-clock cg-input-icon" aria-hidden="true"></i>
                <input
                  className="cg-input"
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setErrors((prev) => ({ ...prev, endTime: "" }));
                  }}
                />
              </div>
              {errors.endTime && (
                <p className="cg-field-error">
                  <i className="ti ti-alert-circle" aria-hidden="true"></i>
                  {errors.endTime}
                </p>
              )}
            </div>
            
            {/* MAX MEMBERS */}
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

            {/* SUBMIT */}
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