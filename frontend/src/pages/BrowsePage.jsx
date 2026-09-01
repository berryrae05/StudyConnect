import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import { listGroups, joinGroup } from "../services/groupService";
import { getProfile } from "../services/profileService";
import { listPublicVenues } from "../services/adminService";
import "./BrowsePage.css";

const DATE_FILTERS = [
  { id: "any", label: "Any date" },
  { id: "today", label: "Today" },
  { id: "this-week", label: "This week" },
  { id: "next-week", label: "Next week" },
];

/// Availability filter options for the frontend-only filter
const AVAILABILITY_FILTERS = [
  { id: "open", label: "Open only" },
  { id: "all", label: "All" },
];

// HELPER, get initials from a full name
const getInitials = (name = "") =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

export default function BrowsePage() {

  const [user, setUser] = useState(null);
  const [enrolledModules, setEnrolledModules] = useState([]);
  const [activeModuleCode, setActiveModuleCode] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeDateFilter, setActiveDateFilter] = useState("any");
  const [activeAvailability, setActiveAvailability] = useState("open");
  const [venues, setVenues] = useState({});
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null); // tracks which group is mid-join

  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(savedUser));
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const [profileData, venuesData] = await Promise.all([
        getProfile(),
        listPublicVenues(),
      ]);

      const modules = profileData.enrolled_modules || [];
      setEnrolledModules(modules);

      if (modules.length > 0) {
        setActiveModuleCode(modules[0].code); // fixed field name
      }

      // Create a mapping of venue IDs to names for easy lookup
      const venueMap = {};
      venuesData.forEach((v) => { venueMap[v.id] = v.name; });
      setVenues(venueMap);

    } catch (err) {
      console.error("Failed to load profile:", err);
    }
  };

  // Fetch groups whenever the active module or search term changes
  useEffect(() => {
    fetchGroups();
  }, [activeModuleCode, searchTerm]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const moduleCode = searchTerm.trim() || activeModuleCode || undefined;

      const data = await listGroups({ moduleCode });
      setGroups(data);
    } catch (err) {
      console.error("Failed to load groups:", err);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleModuleChip = (moduleCode) => {
    if (activeModuleCode === moduleCode) {
      setActiveModuleCode(null); // Deselect if already active
    } else {
      setActiveModuleCode(moduleCode);
    }
    setSearchTerm(""); // Clear search term so it doesn't override the module chip selection
  }

  const handleClearFilters = () => {
    setActiveModuleCode(null);
    setSearchTerm("");
  }

  const visibleGroups = groups.filter((group) => {
    if (activeAvailability === "open") {
      return group.max_members > (group.current_members ?? 0);
    }
    return true; // "all" shows everything
  });

  const handleJoin = async (groupId) => {
    setJoiningId(groupId);
    try {
      await joinGroup(groupId);

      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? { ...g, current_members: g.current_members + 1 }
            : g
        )
      );
    } catch (err) {
      console.error("Failed to join group:", err);
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="browse-root">

      {/* Shared navbar with Dashboard and Admin */}
      <Navbar user={user} activeLink="browse" />

      <div className="browse-body">

        {/* LEFT PANEL */}
        <aside className="browse-left">

          <div className="browse-left-title">Find a group</div>

          {/* Search input */}
          <div className="browse-search-box">
            <i className="ti ti-search browse-search-icon" aria-hidden="true"></i>
            <input
              type="text"
              className="browse-search-input"
              placeholder="Search by module"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                // Clear module chip when typing manually
                if (e.target.value) setActiveModuleCode(null);
              }}
            />

            {/* Clear search button, only shown when search has a value */}
            {searchTerm && (
              <button
                className="browse-search-clear"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <i className="ti ti-x" aria-hidden="true"></i>
              </button>
            )}
          </div>

          {enrolledModules.length > 0 && (
            <div className="browse-filter-group">
              <div className="browse-filter-label">My modules</div>
              <div className="browse-chip-row">

                {enrolledModules.map((mod) => (
                  <button
                    key={mod.id}
                    className={`browse-chip ${activeModuleCode === mod.code ? "browse-chip--active" : ""}`}
                    onClick={() => handleModuleChip(mod.code)}
                    title={mod.name}
                  >
                    {mod.code}
                  </button>
                ))}
                <button
                  className={`browse-chip ${!activeModuleCode && !searchTerm ? "browse-chip--active" : ""}`}
                  onClick={handleClearFilters}
                >
                  All
                </button>
              </div>
            </div>
          )}

          {/* Availability filter chips */}
          <div className="browse-filter-group">
            <div className="browse-filter-label">Availability</div>
            <div className="browse-chip-row">
              {AVAILABILITY_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  className={`browse-chip ${activeAvailability === filter.id ? "browse-chip--active" : ""}`}
                  onClick={() => setActiveAvailability(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Result count */}
          <div className="browse-result-count">
            {visibleGroups.length} group{visibleGroups.length !== 1 ? "s" : ""} found
            {activeModuleCode && (
              <span className="browse-filter-active"> for {activeModuleCode}</span>
            )}
          </div>

        </aside>

        {/* RIGHT PANEL */}
        <main className="browse-right">

          {/* Loading state */}
          {loading && (
            <div className="browse-loading">
              <i className="ti ti-loader-2 browse-spin" aria-hidden="true"></i>
              <span>Loading groups...</span>
            </div>
          )}

          {/* Empty state where no results match the current filters */}
          {!loading && visibleGroups.length === 0 && (
            <div className="browse-empty">
              <p className="browse-empty-text">No study groups match your search.</p>
              <p className="browse-empty-sub">
                {activeModuleCode
                  ? `No groups for ${activeModuleCode} yet. Try a different module or view all.`
                  : "Try a different search or clear your filters."}
              </p>
              {(activeModuleCode || searchTerm) && (
                <button className="browse-clear-btn" onClick={handleClearFilters}>
                  View all groups
                </button>
              )}
            </div>
          )}

          {/* Results grid */}
          {!loading && visibleGroups.length > 0 && (
            <div className="browse-results">
              {/* .map() renders one card per group in the array */}
              {visibleGroups.map((group) => {
                const spotsLeft = group.max_members - (group.current_members ?? 0);
                const isFull = spotsLeft <= 0;

                return (
                  <div key={group.id} className="browse-card">

                    <div className="browse-card-top">
                      <span className="browse-module-tag">{group.module_code}</span>

                      <span className={`browse-status-badge ${isFull ? "browse-status-badge--full" : "browse-status-badge--open"}`}>
                        {isFull ? "Full" : `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left`}
                      </span>
                    </div>

                    <h3 className="browse-card-title">
                      {group.description || "Study Group"}
                    </h3>

                    <div className="browse-card-meta">
                      <span className="browse-meta-item">
                        <i className="ti ti-calendar" aria-hidden="true"></i>
                        {group.start_time
                          ? new Date(group.start_time).toLocaleString("en-ZA", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          : "Date not set"}
                      </span>
                      <span className="browse-meta-item">
                        <i className="ti ti-map-pin" aria-hidden="true"></i>
                        {group.venue_id
                          ? (venues[group.venue_id] || `Venue #${group.venue_id}`)
                          : "Venue not set"}
                      </span>
                      <span className="browse-meta-item">
                        <i className="ti ti-users" aria-hidden="true"></i>
                        {group.current_members ?? 0}/{group.max_members}
                      </span>
                    </div>

                    <div className="browse-card-footer">
                      {/* Link to the full group detail page */}
                      <Link to={`/groups/${group.id}`} className="browse-view-link">
                        View details
                      </Link>

                      <button
                        className="browse-join-btn"
                        disabled={isFull || joiningId === group.id}
                        onClick={() => handleJoin(group.id)}
                      >
                        {joiningId === group.id
                          ? "Joining..."
                          : isFull
                            ? "Full"
                            : "Join group"}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}