import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import { listGroups, joinGroup } from "../services/groupService";
import "./BrowsePage.css";

const DATE_FILTERS = [
  { id: "any",       label: "Any date"  },
  { id: "today",     label: "Today"     },
  { id: "this-week",  label: "This week" },
  { id: "next-week",  label: "Next week" },
];

/// Availability filter options for the frontend-only filter
const AVAILABILITY_FILTERS = [
  { id: "open", label: "Open only" },
  { id: "all",  label: "All"       },
];

// HELPER, get initials from a full name
const getInitials = (name = "") =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

export default function BrowsePage() {

  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm]           = useState("");
  const [activeDateFilter, setActiveDateFilter] = useState("any");
  const [activeAvailability, setActiveAvailability] = useState("open");

  const [groups, setGroups]   = useState([]);
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
  }, []);

  // Fetch groups whenever the search term or date filter changes. This is a side effect
  // that runs after the component renders, and it updates the `groups` state with the fetched data.
  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const data = await listGroups({
          moduleCode: searchTerm.trim() || undefined,
          // TODO: convert activeDateFilter ("today" / "this-week" / etc.)
          // into an actual date string the backend expects, once the
          // backend's study_date filter format is confirmed.
        });
        setGroups(data);
      } catch (err) {
        console.error("Failed to load groups:", err);
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [searchTerm, activeDateFilter]);

  // Filter the groups based on the active availability filter. This is a derived state that
  // doesn't require a separate useState, since it's computed from the `groups` state.
  const visibleGroups = groups.filter((group) => {
    if (activeAvailability === "open") {
      return group.current_members < group.max_members;
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
      // TODO: surface this error to the user, e.g. a toast or banner
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="browse-root">

      {/* Shared navbar — same as Dashboard and Admin */}
      <Navbar user={user} activeLink="browse" />

      {/* Body — left panel (search/filters) + right panel (results) */}
      <div className="browse-body">

        {/* LEFT PANEL — Search & Filters */}
        <aside className="browse-left">

          <div className="browse-left-title">Find a group</div>

          {/* Search input */}
          <div className="browse-search-box">
            <i className="ti ti-search browse-search-icon" aria-hidden="true"></i>
            <input
              type="text"
              className="browse-search-input"
              placeholder="Search by module e.g. COS301"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Date filter chips */}
          <div className="browse-filter-group">
            <div className="browse-filter-label">Date</div>
            <div className="browse-chip-row">
              {/* .map() renders one chip per DATE_FILTERS entry */}
              {DATE_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  className={`browse-chip ${activeDateFilter === filter.id ? "browse-chip--active" : ""}`}
                  onClick={() => setActiveDateFilter(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

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
          </div>

        </aside>

        {/* RIGHT PANEL — Results */}
        <main className="browse-right">

          {/* Loading state */}
          {loading && (
            <div className="browse-loading">
              <i className="ti ti-loader-2 browse-spin" aria-hidden="true"></i>
              <span>Loading groups...</span>
            </div>
          )}

          {/* Empty state — no results match the current filters */}
          {!loading && visibleGroups.length === 0 && (
            <div className="browse-empty">
              <i className="ti ti-search-off browse-empty-icon" aria-hidden="true"></i>
              <p className="browse-empty-text">No study groups match your search.</p>
              <p className="browse-empty-sub">Try a different module or clear your filters.</p>
            </div>
          )}

          {/* Results grid */}
          {!loading && visibleGroups.length > 0 && (
            <div className="browse-results">
              {/* .map() renders one card per group in the array */}
              {visibleGroups.map((group) => {
                const spotsLeft = group.max_members - group.current_members;
                const isFull = spotsLeft <= 0;

                return (
                  <div key={group.id} className="browse-card">

                    <div className="browse-card-top">
                      <span className="browse-module-tag">{group.module_code}</span>
                      {/* Ternary swaps badge style/text based on isFull */}
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
                        {group.date_time
                          ? new Date(group.date_time).toLocaleString()
                          : "Date not set"}
                      </span>
                      <span className="browse-meta-item">
                        <i className="ti ti-map-pin" aria-hidden="true"></i>
                        {group.location || "Location not set"}
                      </span>
                      <span className="browse-meta-item">
                        <i className="ti ti-users" aria-hidden="true"></i>
                        {group.current_members}/{group.max_members}
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