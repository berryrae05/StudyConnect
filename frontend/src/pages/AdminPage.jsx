import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import "./AdminPage.css";

// LEFT PANEL NAVIGATION ITEMS
const NAV_ITEMS = [
  { id: "section-overview",    label: "Overview",    icon: "ti-layout-dashboard" },
  { id: "section-modules",     label: "Modules",     icon: "ti-book"             },
  { id: "section-venues",      label: "Venues",      icon: "ti-map-pin"          },
  { id: "section-students",    label: "Students",    icon: "ti-users"            },
  { id: "section-moderation",  label: "Moderation",  icon: "ti-shield"           },
];

// MOCK DATA
// TODO: Replace with real API calls when admin endpoints are ready.

const MOCK_STATS = [
  { label: "Total students", value: 410,  icon: "ti-users"        },
  { label: "Active groups",  value: 124,  icon: "ti-users-group"  },
  { label: "Modules",        value: 38,   icon: "ti-book"         },
  { label: "Venues",         value: 12,   icon: "ti-map-pin"      },
];

const MOCK_MODULES = [
  { id: 1, code: "COS301", name: "Software Engineering",  groups: 8  },
  { id: 2, code: "MAT211", name: "Calculus",              groups: 5  },
  { id: 3, code: "PHY101", name: "Physics",               groups: 3  },
  { id: 4, code: "COS201", name: "Data Structures",       groups: 6  },
];

const MOCK_VENUES = [
  { id: 1, name: "Library Room 2B",   capacity: 12, available: true  },
  { id: 2, name: "Engineering Lab 3", capacity: 20, available: true  },
  { id: 3, name: "Student Centre",    capacity: 30, available: false },
  { id: 4, name: "Senate Hall B",     capacity: 15, available: true  },
];

const MOCK_STUDENTS = [
  { id: 1, name: "Amahle Dlamini",   email: "2301045@myuwc.ac.za", role: "student", verified: true,  joined: "12 May 2025" },
  { id: 2, name: "Kagiso Mokoena",   email: "2301089@myuwc.ac.za", role: "student", verified: true,  joined: "13 May 2025" },
  { id: 3, name: "Thabo Nkosi",      email: "2301123@myuwc.ac.za", role: "student", verified: false, joined: "14 May 2025" },
  { id: 4, name: "Lerato Petersen",  email: "2301200@myuwc.ac.za", role: "student", verified: true,  joined: "15 May 2025" },
];

const MOCK_REPORTS = [
  { id: 1, reportedBy: "Amahle Dlamini", against: "Unknown User",   reason: "Inappropriate behaviour in group", date: "12 May 2025", status: "pending"  },
  { id: 2, reportedBy: "Kagiso Mokoena", against: "Thabo Nkosi",    reason: "No-show to three sessions",        date: "13 May 2025", status: "reviewed" },
];

export default function AdminPage() {

  // Tracks which left nav item is active. Starts on Overview when the page loads.
  const [activeNav, setActiveNav] = useState("section-overview");

  // Admin user read from localStorage
  const [admin, setAdmin] = useState(null);

  // TODO: Data states will be replaced by API calls later
  const [stats, setStats]         = useState([]);
  const [modules, setModules]     = useState([]);
  const [venues, setVenues]       = useState([]);
  const [students, setStudents]   = useState([]);
  const [reports, setReports]     = useState([]);
  const [loading, setLoading]     = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    // Not logged in at all, send to login
    if (!savedUser) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(savedUser);

    // Only users with role "admin" can access this page. Not an admin, send back to dashboard
    // TODO: Uncomment this when backend auth is implemented and real user roles are available.
    // if (parsedUser.role !== "admin") {
    //   navigate("/dashboard");
    //   return;
    // }

    setAdmin(parsedUser);

    // TODO: Replace with real API calls when admin endpoints are ready
    setStats(MOCK_STATS);
    setModules(MOCK_MODULES);
    setVenues(MOCK_VENUES);
    setStudents(MOCK_STUDENTS);
    setReports(MOCK_REPORTS);
    setLoading(false);

  }, []);

  const handleNavClick = (sectionId) => {
    setActiveNav(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/login");
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

      {/* Shared navbar, same as dashboard */}
      <Navbar user={admin} activeLink="admin" />

      {/* Body — left panel + right panel */}
      <div className="dash-body">

        {/* LEFT PANEL */}
        <aside className="dash-left">

          {/* Admin user info */}
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
              {/* Show "Admin" role label, different from dashboard "Student" */}
              <span className="dash-user-role">Admin</span>
            </div>
          </div>

          <div className="dash-left-divider"></div>

          {/* Navigation */}
          <nav className="dash-left-nav">

            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`dash-nav-item ${activeNav === item.id ? "dash-nav-item--active" : ""}`}
                onClick={() => handleNavClick(item.id)}
              >
                <i className={`ti ${item.icon}`} aria-hidden="true"></i>
                <span>{item.label}</span>

                {/* Show badge on Moderation if there are pending reports */}
                {item.id === "section-moderation" &&
                  reports.filter((r) => r.status === "pending").length > 0 && (
                    <span className="dash-nav-count">
                      {reports.filter((r) => r.status === "pending").length}
                    </span>
                  )}
              </button>
            ))}
          </nav>

          {/* Logout pinned to bottom */}
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

          <section id="section-overview" className="dash-section">
            <div className="dash-section-top">
              <h2 className="dash-section-title">Overview</h2>
            </div>

            {/* Stats grid — 4 cards in a row */}
            <div className="admin-stats-grid">

              {stats.map((stat) => (
                <div key={stat.label} className="admin-stat-card">
                  <div className="admin-stat-icon">
                    <i className={`ti ${stat.icon}`} aria-hidden="true"></i>
                  </div>
                  <div className="admin-stat-value">{stat.value}</div>
                  <div className="admin-stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </section>

          <section id="section-modules" className="dash-section">
            <div className="dash-section-top">
              <h2 className="dash-section-title">Modules</h2>
              {/* TODO: wire up to open an add module modal */}
              <button className="dash-action-btn">
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
                          {/* TODO: wire up to open edit modal */}
                          <button className="admin-table-btn">Edit</button>
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
              {/* TODO: wire up to open an add venue modal */}
              <button className="dash-action-btn">
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
                          <button className="admin-table-btn">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Admin can view all registered students and suspend accounts. */}
          <section id="section-students" className="dash-section">
            <div className="dash-section-top">
              <h2 className="dash-section-title">Students</h2>
              {/* Live count of total students */}
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
                          {/* REACT: Show checkmark or cross based on verified status */}
                          <span className={`admin-verified ${student.verified ? "admin-verified--yes" : "admin-verified--no"}`}>
                            {student.verified ? (
                              <i className="ti ti-circle-check" aria-hidden="true"></i>
                            ) : (
                              <i className="ti ti-circle-x" aria-hidden="true"></i>
                            )}
                          </span>
                        </td>
                        <td>{student.joined}</td>
                        <td>
                          {/* TODO: wire up suspend functionality */}
                          <button className="admin-table-btn admin-table-btn--danger">
                            Suspend
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Admin reviews reports submitted against students or groups. */}
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
                      <th>Reported by</th>
                      <th>Against</th>
                      <th>Reason</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id}>
                        <td>{report.reportedBy}</td>
                        <td>{report.against}</td>
                        <td>{report.reason}</td>
                        <td>{report.date}</td>
                        <td>
                          <span className={`admin-report-status admin-report-status--${report.status}`}>
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                          </span>
                        </td>
                        <td>
                          {/* TODO: wire up review action */}
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
    </div>
  );
}