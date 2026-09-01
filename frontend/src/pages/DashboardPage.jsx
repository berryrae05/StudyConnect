import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import { deleteGroup } from "../services/groupService";
import { getMyGroups } from "../services/profileService";
import { listPublicVenues } from "../services/adminService";
import "./DashboardPage.css";

const NAV_ITEMS = [
  { id: "section-created", label: "My groups", icon: "ti-users" },
  { id: "section-requests", label: "Requests", icon: "ti-clock" },
  { id: "section-joined", label: "Groups joined", icon: "ti-circle-check" },
  { id: "section-notifications", label: "Notifications", icon: "ti-bell" },
  { id: "section-settings", label: "Settings", icon: "ti-settings" },
];

// Status badge config, maps status string to label and CSS class
const statusConfig = {
  open: { label: "Open", cls: "dash-badge--open" },
  full: { label: "Full", cls: "dash-badge--full" },
  pending: { label: "Pending", cls: "dash-badge--pending" },
  approved: { label: "Approved", cls: "dash-badge--approved" },
  rejected: { label: "Rejected", cls: "dash-badge--rejected" },
};

export default function DashboardPage() {

  // Get logged-in user from localStorage on initial render.
  const user = JSON.parse(localStorage.getItem("user"));

  // Tracks which left nav item is highlighted.
  const [activeNav, setActiveNav] = useState("section-created");

  // Data states
  const [myGroups, setMyGroups] = useState([]);
  const [myJoinedGroups, setMyJoinedGroups] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingGroupId, setDeletingGroupId] = useState(null);
  const [venues, setVenues] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      try {
        const [groupData, venuesData] = await Promise.all([
          getMyGroups(),
          listPublicVenues(),
        ]);
        setMyGroups(groupData.groups_created || []);
        setMyJoinedGroups(groupData.groups_joined || []);

        // Map venue IDs to names for easy lookup
        const venueMap = {};
        venuesData.forEach((v) => { venueMap[v.id] = v.name; });
        setVenues(venueMap);
      } catch (error) {
        console.error("Failed to load groups:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleNavClick = (sectionId) => {
    setActiveNav(sectionId);

    // Find the section element by its id and scroll to it
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleAccept = (id) => {
    setIncomingRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleReject = (id) => {
    setIncomingRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm("Delete this group? This cannot be undone.")) return;

    setDeletingGroupId(groupId);
    try {
      await deleteGroup(groupId);
      // Remove the deleted group from the state so the UI updates immediately
      setMyGroups((prev) => prev.filter((g) => g.id !== groupId));
    } catch (err) {
      console.error("Failed to delete group:", err);
    } finally {
      setDeletingGroupId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (loading || !user) {
    return (
      <div className="dash-loading">
        <i className="ti ti-loader-2 spin" aria-hidden="true"></i>
      </div>
    );
  }

  return (
    <div className="dash-root">

      <Navbar user={user} activeLink="dashboard" />

      {/* Sits below the topbar and fills remaining height */}
      <div className="dash-body">

        {/* LEFT PANEL */}
        <aside className="dash-left">

          {/* User info block at the top of the left panel */}
          <div className="dash-user-block">
            <div className="dash-user-avatar">
              {user.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div className="dash-user-info">
              <span className="dash-user-name">
                {user.full_name.split(" ")[0]}{" "}
                {user.full_name.split(" ")[1]?.[0]}.
              </span>
              <span className="dash-user-role">Student</span>
            </div>
          </div>

          {/* Thin divider line below user block */}
          <div className="dash-left-divider"></div>

          {/* Navigation links */}
          <nav className="dash-left-nav">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`dash-nav-item ${activeNav === item.id ? "dash-nav-item--active" : ""}`}
                onClick={() => handleNavClick(item.id)}
              >
                <i className={`ti ${item.icon}`} aria-hidden="true"></i>
                <span>{item.label}</span>

                {/* Show count badge on Requests if there are incoming */}
                {item.id === "section-requests" && incomingRequests.length > 0 && (
                  <span className="dash-nav-count">{incomingRequests.length}</span>
                )}
              </button>
            ))}
          </nav>

          {/* Logout button pinned to the bottom of the left panel */}
          <div className="dash-left-footer">
            <div className="dash-left-divider"></div>
            <Link to="/profile" className="dash-profile-link">
              <i className="ti ti-user" aria-hidden="true"></i>
              <span>My profile</span>
            </Link>
            <button className="dash-logout-btn" onClick={handleLogout}>
              <i className="ti ti-logout" aria-hidden="true"></i>
              <span>Log out</span>
            </button>
          </div>

        </aside>

        {/* RIGHT PANEL */}
        <main className="dash-right">

          {/* id must match the NAV_ITEMS id for scroll to work */}
          <section id="section-created" className="dash-section">
            <div className="dash-section-top">
              <h2 className="dash-section-title">Groups I created</h2>
              <Link to="/groups/create" className="dash-action-btn">
                <i className="ti ti-plus" aria-hidden="true"></i>
                New group
              </Link>
            </div>

            {myGroups.length === 0 ? (
              <div className="dash-empty">
                <i className="ti ti-users-group" style={{ fontSize: 28 }} aria-hidden="true"></i>
                <p>You have not created any groups yet.</p>
                <Link to="/groups/create" className="dash-text-link">
                  Create your first group
                </Link>
              </div>
            ) : (
              <div className="dash-cards">

                {myGroups.map((group) => (
                  <div key={group.id} className="dash-card">
                    <div className="dash-card-top">

                      <span className="dash-module-tag">
                        {group.module_code}
                      </span>

                      <span className="dash-badge dash-badge--open">
                        Max {group.max_members} members
                      </span>

                    </div>

                    <h3 className="dash-card-title">
                      {group.description || "Study Group"}
                    </h3>

                    <div className="dash-card-meta">

                      <span>
                        <i className="ti ti-calendar" aria-hidden="true"></i>
                        {group.start_time
                          ? new Date(group.start_time).toLocaleString("en-ZA", {
                            day: "numeric", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit"
                          })
                          : "Date not set"}
                      </span>

                      <span>
                        <i className="ti ti-map-pin" aria-hidden="true"></i>
                        {group.venue_id ? (venues[group.venue_id] || `Venue #${group.venue_id}`) : "Venue not set"}
                      </span>

                    </div>

                    <div className="dash-card-footer">
                      <Link
                        to={`/groups/${group.id}`}
                        className="dash-card-view-link"
                      >
                        View details
                      </Link>
                      <button
                        className="dash-card-delete-btn"
                        disabled={deletingGroupId === group.id}
                        onClick={() => handleDeleteGroup(group.id)}
                      >
                        {deletingGroupId === group.id ? (
                          <>
                            <i className="ti ti-loader-2 spin" aria-hidden="true"></i>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <i className="ti ti-trash" aria-hidden="true"></i>
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Incoming join requests */}
          <section id="section-requests" className="dash-section">
            <div className="dash-section-top">
              <h2 className="dash-section-title">
                Incoming join requests
                {incomingRequests.length > 0 && (
                  <span className="dash-section-count">
                    {incomingRequests.length}
                  </span>
                )}
              </h2>
            </div>

            {incomingRequests.length === 0 ? (
              <div className="dash-empty">
                <i className="ti ti-inbox" style={{ fontSize: 28 }} aria-hidden="true"></i>
                <p>No pending join requests.</p>
              </div>
            ) : (
              <div className="dash-request-list">
                {incomingRequests.map((req) => (
                  <div key={req.id} className="dash-request-row">

                    {/* Avatar and name */}
                    <div className="dash-request-left">
                      <div
                        className="dash-request-avatar"
                        style={{ background: req.color }}
                      >
                        {req.initials}
                      </div>
                      <div>
                        <span className="dash-request-name">{req.studentName}</span>
                        <span className="dash-request-time">{req.requestedAt}</span>
                      </div>
                    </div>

                    {/* Accept / Reject */}
                    <div className="dash-request-btns">
                      <button
                        className="dash-btn-accept"
                        onClick={() => handleAccept(req.id)}
                      >
                        Accept
                      </button>
                      <button
                        className="dash-btn-reject"
                        onClick={() => handleReject(req.id)}
                      >
                        Reject
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </section>

          <section id="section-joined" className="dash-section">
            <div className="dash-section-top">
              <h2 className="dash-section-title">Groups I've joined</h2>
              <Link to="/browse" className="dash-text-link">Browse more</Link>
            </div>

            {myJoinedGroups.length === 0 ? (
              <div className="dash-empty">
                <i className="ti ti-search" style={{ fontSize: 28 }} aria-hidden="true"></i>
                <p>You have not joined any groups yet.</p>
                <Link to="/browse" className="dash-text-link">
                  Find a study group
                </Link>
              </div>
            ) : (
              <div className="dash-cards">
                {myJoinedGroups.map((group) => (
                  <div key={group.id} className="dash-card">
                    <div className="dash-card-top">
                      <span className="dash-module-tag">{group.module_code}</span>
                    </div>
                    <h3 className="dash-card-title">
                      {group.description || "Study Group"}
                    </h3>
                    <div className="dash-card-meta">
                      <span>
                        <i className="ti ti-calendar" aria-hidden="true"></i>
                        {group.start_time
                          ? new Date(group.start_time).toLocaleString("en-ZA", {
                            day: "numeric", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit"
                          })
                          : "Date not set"}
                      </span>
                      <span>
                        <i className="ti ti-map-pin" aria-hidden="true"></i>
                        {group.venue_id ? (venues[group.venue_id] || `Venue #${group.venue_id}`) : "Venue not set"}
                      </span>
                    </div>
                    <div className="dash-card-footer">
                      <Link to={`/groups/${group.id}`} className="dash-card-view-link">
                        View details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Notifications placeholder */}
          <section id="section-notifications" className="dash-section">
            <div className="dash-section-top">
              <h2 className="dash-section-title">Notifications</h2>
            </div>
            <div className="dash-empty">
              <i className="ti ti-bell" style={{ fontSize: 28 }} aria-hidden="true"></i>
              <p>No new notifications.</p>
            </div>
          </section>

          {/* Settings placeholder */}
          <section id="section-settings" className="dash-section">
            <div className="dash-section-top">
              <h2 className="dash-section-title">Settings</h2>
            </div>
            <div className="dash-empty">
              <i className="ti ti-settings" style={{ fontSize: 28 }} aria-hidden="true"></i>
              <p>Settings coming soon.</p>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
