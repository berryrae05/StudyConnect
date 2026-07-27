import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import { getGroup, getGroupMembers, joinGroup, leaveGroup } from "../services/groupService";
import "./GroupDetailPage.css";

const formatDateTime = (isoString) => {
  if (!isoString) return "Date not set";
  const date = new Date(isoString);
  return date.toLocaleString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (isoString) => {
  if (!isoString) return "";
  return new Date(isoString).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default function GroupDetailPage() {

  const { id: groupId } = useParams();

  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tracks whether the current user has joined this group.
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [actionError, setActionError] = useState("");

  const [memberCount, setMemberCount] = useState(0);

  // It fetches the group details and membership status when the component mounts or when the groupId changes.
  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      navigate("/login");
      return;
    }

    setUser(JSON.parse(savedUser));
    fetchGroup();
  }, [groupId]);

  const fetchGroup = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getGroup(groupId);
      setGroup(data);

      const membersData = await getGroupMembers(groupId);

      setMemberCount(membersData.members.length);

      const currentUser = JSON.parse(localStorage.getItem("user"));

      setIsMember(
        membersData.members.includes(currentUser.id)
      );
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) {
        setError("This study group does not exist or has been removed.");
      } else {
        setError("Could not load group details. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setJoining(true);
    setActionError("");
    try {
      await joinGroup(groupId);
      // Update the state to reflect that the user has joined the group
      setIsMember(true);
      setMemberCount((prev) => prev + 1);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setActionError(
        typeof detail === "string"
          ? detail
          : "Could not join group. Please try again."
      );
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm("Are you sure you want to leave this group?")) return;

    setLeaving(true);
    setActionError("");
    try {
      await leaveGroup(groupId);
      setIsMember(false);
      setMemberCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      const detail = err.response?.data?.detail;
      setActionError(
        typeof detail === "string"
          ? detail
          : "Could not leave group. Please try again."
      );
    } finally {
      setLeaving(false);
    }
  };

  // Determine if the current user is the creator of the group
  const isCreator = user && group && user.id === group.created_by;

  if (loading) {
    return (
      <div className="gd-root">
        <Navbar user={user} activeLink="browse" />
        <div className="gd-loading">
          <i className="ti ti-loader-2 gd-spin" aria-hidden="true"></i>
          <span>Loading group...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gd-root">
        <Navbar user={user} activeLink="browse" />
        <div className="gd-error-state">
          <i className="ti ti-alert-circle gd-error-icon" aria-hidden="true"></i>
          <p className="gd-error-text">{error}</p>
          <Link to="/browse" className="gd-back-btn">
            <i className="ti ti-arrow-left" aria-hidden="true"></i>
            Back to browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="gd-root">

      <Navbar user={user} activeLink="browse" />

      <div className="gd-body">

        <div className="gd-breadcrumb">
          <Link to="/browse" className="gd-back-link">
            <i className="ti ti-arrow-left" aria-hidden="true"></i>
            Back to browse
          </Link>
        </div>

        <div className="gd-layout">

          {/* LEFT — Group info */}
          <div className="gd-left">

            {/* Module tag */}
            <span className="gd-module-tag">{group.module_code}</span>

            {/* Group title / description */}
            <h1 className="gd-title">
              {group.description || "Study Group"}
            </h1>

            {/* Info cards grid */}
            <div className="gd-info-grid">
              <div className="gd-info-card">
                <div className="gd-info-label">
                  <i className="ti ti-calendar" aria-hidden="true"></i>
                  Date &amp; time
                </div>
                <div className="gd-info-value">
                  {formatDateTime(group.date_time)}
                </div>
              </div>

              <div className="gd-info-card">
                <div className="gd-info-label">
                  <i className="ti ti-map-pin" aria-hidden="true"></i>
                  Venue
                </div>
                <div className="gd-info-value">
                  {group.location || "Not set"}
                </div>
              </div>

              <div className="gd-info-card">
                <div className="gd-info-label">
                  <i className="ti ti-users" aria-hidden="true"></i>
                  Max members
                </div>
                <div className="gd-info-value">
                  {group.max_members}
                </div>
              </div>

              <div className="gd-info-card">
                <div className="gd-info-label">
                  <i className="ti ti-clock" aria-hidden="true"></i>
                  Created
                </div>
                <div className="gd-info-value">
                  {formatDate(group.created_at)}
                </div>
              </div>
            </div>

            <div className="gd-members-placeholder">
              <i className="ti ti-users" aria-hidden="true"></i>
              <span>
                {memberCount} members joined this group
              </span>
            </div>

          </div>

          {/* RIGHT — Action panel */}
          <div className="gd-right">

            <div className="gd-action-card">

              {/* Creator label */}
              {isCreator && (
                <div className="gd-creator-badge">
                  <i className="ti ti-crown" aria-hidden="true"></i>
                  You created this group
                </div>
              )}

              {actionError && (
                <div className="gd-action-error">
                  <i className="ti ti-alert-circle" aria-hidden="true"></i>
                  {actionError}
                </div>
              )}

              {isCreator ? (
                <>
                  {/* Creator sees manage options, not join/leave */}
                  <p className="gd-action-note">
                    You are the creator of this group. Manage it from
                    your dashboard.
                  </p>
                  <Link to="/dashboard" className="gd-btn-primary">
                    Go to dashboard
                  </Link>
                </>
              ) : isMember ? (
                <>
                  <div className="gd-joined-badge">
                    <i className="ti ti-circle-check" aria-hidden="true"></i>
                    You are a member
                  </div>
                  <button
                    className="gd-btn-danger"
                    onClick={handleLeave}
                    disabled={leaving}
                  >
                    {leaving ? "Leaving..." : "Leave group"}
                  </button>
                </>
              ) : (
                <button
                  className="gd-btn-primary"
                  onClick={handleJoin}
                  disabled={joining}
                >
                  {joining ? (
                    <>
                      <i className="ti ti-loader-2 gd-spin" aria-hidden="true"></i>
                      Joining...
                    </>
                  ) : (
                    "Join group"
                  )}
                </button>
              )}

              {/* Group meta summary */}
              <div className="gd-action-meta">
                <div className="gd-action-meta-item">
                  <span className="gd-action-meta-label">Module</span>
                  <span className="gd-action-meta-value">{group.module_code}</span>
                </div>
                <div className="gd-action-meta-item">
                  <span className="gd-action-meta-label">Max size</span>
                  <span className="gd-action-meta-value">{group.max_members} members</span>
                </div>
                <div className="gd-action-meta-item">
                  <span className="gd-action-meta-label">Location</span>
                  <span className="gd-action-meta-value">{group.location || "TBC"}</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}