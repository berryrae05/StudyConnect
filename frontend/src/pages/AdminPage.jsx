import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import {getAdminStats, listModules, createModule, deleteModule, listVenues, createVenue, deleteVenue, listStudents, listReports,} from "../services/adminService";
import "./AdminPage.css";

// LEFT PANEL NAVIGATION ITEMS
const NAV_ITEMS = [
  { id: "section-overview",    label: "Overview",    icon: "ti-layout-dashboard" },
  { id: "section-modules",     label: "Modules",     icon: "ti-book"             },
  { id: "section-venues",      label: "Venues",      icon: "ti-map-pin"          },
  { id: "section-students",    label: "Students",    icon: "ti-users"            },
  { id: "section-moderation",  label: "Moderation",  icon: "ti-shield"           },
];

export default function AdminPage() {

  // Tracks which left nav item is active.
  const [activeNav, setActiveNav] = useState("section-overview");

  // Admin user read from localStorage
  const [admin, setAdmin] = useState(null);

  // Data fetched from the backend
  const [stats, setStats]       = useState(null);
  const [modules, setModules]   = useState([]);
  const [venues, setVenues]     = useState([]);
  const [students, setStudents] = useState([]);
  const [reports, setReports]   = useState([]);
  const [loading, setLoading]   = useState(true);

  // Modal visibility state
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showVenueModal, setShowVenueModal]   = useState(false);

  // Form fields for the Add Module modal
  const [newModuleCode, setNewModuleCode] = useState("");
  const [newModuleName, setNewModuleName] = useState("");
  const [moduleFormError, setModuleFormError] = useState("");
  const [moduleSaving, setModuleSaving] = useState(false);

  // Form fields for the Add Venue modal
  const [newVenueName, setNewVenueName]         = useState("");
  const [newVenueCapacity, setNewVenueCapacity] = useState("");
  const [venueFormError, setVenueFormError]     = useState("");
  const [venueSaving, setVenueSaving]           = useState(false);

  // Tracks which row is mid-delete so it can disable its button
  // and avoid double-clicks triggering two delete requests.
  const [deletingModuleId, setDeletingModuleId] = useState(null);
  const [deletingVenueId, setDeletingVenueId]   = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(savedUser);

    // Only users with role "admin" can access this page.
    if (parsedUser.role !== "admin") {
      navigate("/admin");
      return;
    }

    setAdmin(parsedUser);
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsData, modulesData, venuesData, studentsData, reportsData] =
        await Promise.all([
          getAdminStats(),
          listModules(),
          listVenues(),
          listStudents(),
          listReports(),
        ]);

      setStats(statsData);
      setModules(modulesData);
      setVenues(venuesData);
      setStudents(studentsData);
      setReports(reportsData);

    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNavClick = (sectionId) => {
    setActiveNav(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Add module
  const handleCreateModule = async (e) => {
    e.preventDefault();

    if (!newModuleCode.trim() || !newModuleName.trim()) {
      setModuleFormError("Both code and name are required.");
      return;
    }

    setModuleSaving(true);
    setModuleFormError("");

    try {
      const created = await createModule({
        code: newModuleCode.trim(),
        name: newModuleName.trim(),
      });

      setModules((prev) => [created, ...prev]);

      // Reset the form and close the modal
      setNewModuleCode("");
      setNewModuleName("");
      setShowModuleModal(false);

    } catch (err) {
      const detail = err.response?.data?.detail;
      setModuleFormError(
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
          ? detail.map((d) => d.msg).join(", ")
          : "Could not create module. Please try again."
      );
    } finally {
      setModuleSaving(false);
    }
  };

  // Delete module
  const handleDeleteModule = async (moduleId) => {
    // TODO: to be replaced with a proper confirmation modal instead of window.confirm
    if (!window.confirm("Delete this module? This cannot be undone.")) return;

    setDeletingModuleId(moduleId);
    try {
      await deleteModule(moduleId);
      // filter() removes the deleted module from the list immediately
      setModules((prev) => prev.filter((m) => m.id !== moduleId));
    } catch (err) {
      console.error("Failed to delete module:", err);
      // TODO: surface this error to the user instead of just logging
    } finally {
      setDeletingModuleId(null);
    }
  };

  const handleCreateVenue = async (e) => {
    e.preventDefault();

    const capacityNum = Number(newVenueCapacity);

    if (!newVenueName.trim()) {
      setVenueFormError("Venue name is required.");
      return;
    }
    if (!newVenueCapacity || capacityNum < 1 || capacityNum > 1000) {
      setVenueFormError("Capacity must be a number between 1 and 1000.");
      return;
    }

    setVenueSaving(true);
    setVenueFormError("");

    try {
      const created = await createVenue({
        name: newVenueName.trim(),
        capacity: capacityNum,
        isAvailable: true,
      });

      setVenues((prev) => [created, ...prev]);

      setNewVenueName("");
      setNewVenueCapacity("");
      setShowVenueModal(false);

    } catch (err) {
      const detail = err.response?.data?.detail;
      setVenueFormError(
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
          ? detail.map((d) => d.msg).join(", ")
          : "Could not create venue. Please try again."
      );
    } finally {
      setVenueSaving(false);
    }
  };

  const handleDeleteVenue = async (venueId) => {
    if (!window.confirm("Delete this venue? This cannot be undone.")) return;

    setDeletingVenueId(venueId);
    try {
      await deleteVenue(venueId);
      setVenues((prev) => prev.filter((v) => v.id !== venueId));
    } catch (err) {
      console.error("Failed to delete venue:", err);
    } finally {
      setDeletingVenueId(null);
    }
  };

  if (loading || !admin) {
    return (
      <div className="dash-loading">
        <i className="ti ti-loader-2 spin" aria-hidden="true"></i>
      </div>
    );
  }

  return (
    <div className="dash-root">

      <Navbar user={admin} activeLink="admin" />

      <div className="dash-body">

        {/* LEFT PANEL */}
        <aside className="dash-left">

          <div className="dash-user-block">
            <div className="dash-user-avatar">
              {admin.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div className="dash-user-info">
              <span className="dash-user-name">
                {admin.full_name?.split(" ")[0]}{" "}
                {admin.full_name?.split(" ")[1]?.[0]}.
              </span>
              <span className="dash-user-role">Admin</span>
            </div>
          </div>

          <div className="dash-left-divider"></div>

          <nav className="dash-left-nav">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`dash-nav-item ${activeNav === item.id ? "dash-nav-item--active" : ""}`}
                onClick={() => handleNavClick(item.id)}
              >
                <i className={`ti ${item.icon}`} aria-hidden="true"></i>
                <span>{item.label}</span>
                {item.id === "section-moderation" &&
                  reports.filter((r) => r.status === "pending").length > 0 && (
                    <span className="dash-nav-count">
                      {reports.filter((r) => r.status === "pending").length}
                    </span>
                  )}
              </button>
            ))}
          </nav>

          <div className="dash-left-footer">
            <div className="dash-left-divider"></div>
            <button className="dash-logout-btn" onClick={handleLogout}>
              <i className="ti ti-logout" aria-hidden="true"></i>
              <span>Log out</span>
            </button>
          </div>

        </aside>

        {/* RIGHT PANEL */}
        <main className="dash-right">

          {/* OVERVIEW */}
          <section id="section-overview" className="dash-section">
            <div className="dash-section-top">
              <h2 className="dash-section-title">Overview</h2>
            </div>
            {stats && (
              <div className="admin-stats-grid">
                {Object.entries(stats).map(([key, value]) => (
                  <div key={key} className="admin-stat-card">
                    <div className="admin-stat-icon">
                      <i className="ti ti-chart-bar" aria-hidden="true"></i>
                    </div>
                    <div className="admin-stat-value">{value}</div>
                    <div className="admin-stat-label">
                      {key.replace(/_/g, " ")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* MODULES */}
          <section id="section-modules" className="dash-section">
            <div className="dash-section-top">
              <h2 className="dash-section-title">Modules</h2>
              <button className="dash-action-btn" onClick={() => setShowModuleModal(true)}>
                <i className="ti ti-plus" aria-hidden="true"></i>
                Add module
              </button>
            </div>

            {modules.length === 0 ? (
              <div className="dash-empty">
                <p>No modules found.</p>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Module name</th>
                      <th>Groups</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((mod) => (
                      <tr key={mod.id}>
                        <td>{mod.code}</td>
                        <td>{mod.name}</td>
                        <td>{mod.groups}</td>
                        <td>
                          <span className={`admin-availability ${mod.is_active ? "admin-availability--yes" : "admin-availability--no"}`}>
                            {mod.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="admin-table-btn admin-table-btn--danger"
                            disabled={deletingModuleId === mod.id}
                            onClick={() => handleDeleteModule(mod.id)}
                          >
                            {deletingModuleId === mod.id ? "Deleting..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* VENUES */}
          <section id="section-venues" className="dash-section">
            <div className="dash-section-top">
              <h2 className="dash-section-title">Venues</h2>
              <button className="dash-action-btn" onClick={() => setShowVenueModal(true)}>
                <i className="ti ti-plus" aria-hidden="true"></i>
                Add venue
              </button>
            </div>

            {venues.length === 0 ? (
              <div className="dash-empty">
                <p>No venues found.</p>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Venue name</th>
                      <th>Capacity</th>
                      <th>Available</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {venues.map((venue) => (
                      <tr key={venue.id}>
                        <td>{venue.name}</td>
                        <td>{venue.capacity}</td>
                        <td>
                          <span className={`admin-availability ${venue.available ? "admin-availability--yes" : "admin-availability--no"}`}>
                            {venue.available ? "Available" : "Unavailable"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="admin-table-btn admin-table-btn--danger"
                            disabled={deletingVenueId === venue.id}
                            onClick={() => handleDeleteVenue(venue.id)}
                          >
                            {deletingVenueId === venue.id ? "Deleting..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* STUDENTS */}
          <section id="section-students" className="dash-section">
            <div className="dash-section-top">
              <h2 className="dash-section-title">Students</h2>
              <span className="admin-count-badge">{students.length} registered</span>
            </div>

            {students.length === 0 ? (
              <div className="dash-empty">
                <p>No students registered yet.</p>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Verified</th>
                      <th>Joined</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id}>
                        <td>{student.name}</td>
                        <td>{student.email}</td>
                        <td>
                          <span className={`admin-verified ${student.verified ? "admin-verified--yes" : "admin-verified--no"}`}>
                            {student.verified ? (
                              <i className="ti ti-circle-check" aria-hidden="true"></i>
                            ) : (
                              <i className="ti ti-circle-x" aria-hidden="true"></i>
                            )}
                          </span>
                        </td>
                        <td>{new Date(student.joined).toLocaleDateString()}</td>
                        <td>
                          {/* TODO: wire up to suspendStudent() needs
                              SuspendRequest schema fields confirmed first */}
                          <button className="admin-table-btn admin-table-btn--danger">
                            {student.is_suspended ? "Unsuspend" : "Suspend"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* MODERATION */}
          <section id="section-moderation" className="dash-section">
            <div className="dash-section-top">
              <h2 className="dash-section-title">
                Moderation
                {reports.filter((r) => r.status === "pending").length > 0 && (
                  <span className="dash-section-count">
                    {reports.filter((r) => r.status === "pending").length} pending
                  </span>
                )}
              </h2>
            </div>

            {reports.length === 0 ? (
              <div className="dash-empty">
                <i className="ti ti-shield-check" style={{ fontSize: 28 }} aria-hidden="true"></i>
                <p>No reports to review.</p>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Report</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id}>
                        <td>{JSON.stringify(report)}</td>
                        <td>
                          <span className={`admin-report-status admin-report-status--${report.status}`}>
                            {report.status}
                          </span>
                        </td>
                        <td>
                          {/* TODO: wire up to reviewReport() — needs
                              ReviewRequest schema fields confirmed first */}
                          <button className="admin-table-btn">Review</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

        </main>
      </div>

      {showModuleModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModuleModal(false)}>
          {/* stopPropagation prevents a click inside the modal from
              closing it via the overlay's onClick above */}
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Add module</h3>
              <button className="admin-modal-close" onClick={() => setShowModuleModal(false)}>
                <i className="ti ti-x" aria-hidden="true"></i>
              </button>
            </div>

            <form onSubmit={handleCreateModule} className="admin-modal-form">
              <div className="admin-modal-field">
                <label className="admin-modal-label">Module code</label>
                <input
                  className="admin-modal-input"
                  type="text"
                  placeholder="e.g. COS301"
                  value={newModuleCode}
                  onChange={(e) => setNewModuleCode(e.target.value)}
                />
              </div>

              <div className="admin-modal-field">
                <label className="admin-modal-label">Module name</label>
                <input
                  className="admin-modal-input"
                  type="text"
                  placeholder="e.g. Software Engineering"
                  value={newModuleName}
                  onChange={(e) => setNewModuleName(e.target.value)}
                />
              </div>

              {moduleFormError && (
                <p className="admin-modal-error">{moduleFormError}</p>
              )}

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-modal-btn-cancel"
                  onClick={() => setShowModuleModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-modal-btn-save"
                  disabled={moduleSaving}
                >
                  {moduleSaving ? "Saving..." : "Add module"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showVenueModal && (
        <div className="admin-modal-overlay" onClick={() => setShowVenueModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Add venue</h3>
              <button className="admin-modal-close" onClick={() => setShowVenueModal(false)}>
                <i className="ti ti-x" aria-hidden="true"></i>
              </button>
            </div>

            <form onSubmit={handleCreateVenue} className="admin-modal-form">
              <div className="admin-modal-field">
                <label className="admin-modal-label">Venue name</label>
                <input
                  className="admin-modal-input"
                  type="text"
                  placeholder="e.g. Library Room 2B"
                  value={newVenueName}
                  onChange={(e) => setNewVenueName(e.target.value)}
                />
              </div>

              <div className="admin-modal-field">
                <label className="admin-modal-label">Capacity</label>
                <input
                  className="admin-modal-input"
                  type="number"
                  placeholder="e.g. 12"
                  min="1"
                  max="1000"
                  value={newVenueCapacity}
                  onChange={(e) => setNewVenueCapacity(e.target.value)}
                />
              </div>

              {venueFormError && (
                <p className="admin-modal-error">{venueFormError}</p>
              )}

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-modal-btn-cancel"
                  onClick={() => setShowVenueModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-modal-btn-save"
                  disabled={venueSaving}
                >
                  {venueSaving ? "Saving..." : "Add venue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}