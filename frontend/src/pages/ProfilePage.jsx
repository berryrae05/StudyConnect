import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import { getProfile, updateProfile, enrollModule, unenrollModule } from "../services/profileService";
import { listPublicModules } from "../services/adminService";
import "./ProfilePage.css";

const getInitials = (name = "") =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

export default function ProfilePage() {

    const navigate = useNavigate();

    // STATE
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [allModules, setAllModules] = useState([]);
    const [loading, setLoading] = useState(true);

    // Edit form state
    const [editMode, setEditMode] = useState(false);
    const [programme, setProgramme] = useState("");
    const [bio, setBio] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    // Module enrolment state
    // tracks which module id is mid-enrol or mid-unenrol
    const [enrollingId, setEnrollingId] = useState(null);
    const [unenrollingId, setUnenrollingId] = useState(null);
    const [moduleError, setModuleError] = useState("");

    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (!savedUser) {
            navigate("/login");
            return;
        }
        setUser(JSON.parse(savedUser));
        loadData();
    }, []);

    // Load profile and all available modules in parallel
    const loadData = async () => {
        setLoading(true);
        try {
            const [profileData, modulesData] = await Promise.all([
                getProfile(),
                listPublicModules(),
            ]);
            setProfile(profileData);
            setProgramme(profileData.programme || "");
            setBio(profileData.bio || "");
            setAllModules(modulesData);
        } catch (err) {
            console.error("Failed to load profile:", err);
        } finally {
            setLoading(false);
        }
    };

    // SAVE PROFILE
    const handleSave = async () => {
        setSaving(true);
        setSaveError("");
        try {
            const updated = await updateProfile({ programme, bio });
            setProfile(updated);
            setEditMode(false);
        } catch (err) {
            const detail = err.response?.data?.detail;
            setSaveError(
                typeof detail === "string"
                    ? detail
                    : "Could not save profile. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    // ENROL IN MODULE
    const handleEnrol = async (moduleId) => {
        setEnrollingId(moduleId);
        setModuleError("");
        try {
            const updated = await enrollModule(moduleId);
            // Update enrolled_modules from the returned profile
            setProfile(updated);
        } catch (err) {
            const detail = err.response?.data?.detail;
            setModuleError(
                typeof detail === "string"
                    ? detail
                    : "Could not enrol in module. Please try again."
            );
        } finally {
            setEnrollingId(null);
        }
    };

    // UNENROL FROM MODULE
    const handleUnenrol = async (moduleId) => {
        setUnenrollingId(moduleId);
        setModuleError("");
        try {
            const updated = await unenrollModule(moduleId);
            setProfile(updated);
        } catch (err) {
            const detail = err.response?.data?.detail;
            setModuleError(
                typeof detail === "string"
                    ? detail
                    : "Could not unenrol from module. Please try again."
            );
        } finally {
            setUnenrollingId(null);
        }
    };

    // IDs of modules the student is already enrolled in
    const enrolledIds = profile?.enrolled_modules?.map((m) => m.id) || [];

    // Modules not yet enrolled in shown in the "Add modules" list
    const availableModules = allModules.filter((m) => !enrolledIds.includes(m.id));

    if (loading || !profile) {
        return (
            <div className="profile-root">
                <Navbar user={user} activeLink="" />
                <div className="profile-loading">
                    <i className="ti ti-loader-2 profile-spin" aria-hidden="true"></i>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-root">

            <Navbar user={user} activeLink="" />

            <div className="profile-body">

                {/* HEADER */}
                <div className="profile-header">
                    <div className="profile-avatar">
                        {getInitials(profile.full_name)}
                    </div>
                    <div className="profile-header-info">
                        <h1 className="profile-name">{profile.full_name}</h1>
                        <p className="profile-meta">
                            {profile.gender}
                            {profile.programme && ` · ${profile.programme}`}
                        </p>
                        <div className="profile-stats">
                            <span className="profile-stat">
                                <i className="ti ti-users" aria-hidden="true"></i>
                                {profile.groups_created} groups created
                            </span>
                            <span className="profile-stat">
                                <i className="ti ti-circle-check" aria-hidden="true"></i>
                                {profile.groups_joined} groups joined
                            </span>
                            <span className="profile-stat">
                                <i className="ti ti-book" aria-hidden="true"></i>
                                {profile.enrolled_modules.length} modules enrolled
                            </span>
                        </div>
                    </div>
                    {!editMode && (
                        <button
                            className="profile-edit-btn"
                            onClick={() => setEditMode(true)}
                        >
                            <i className="ti ti-pencil" aria-hidden="true"></i>
                            Edit profile
                        </button>
                    )}
                </div>

                <div className="profile-layout">

                    {/* LEFT — Bio & Programme */}
                    <div className="profile-left">

                        {/* Bio & Programme — edit or view */}
                        <div className="profile-card">
                            <div className="profile-card-header">
                                <h2 className="profile-card-title">About</h2>
                            </div>

                            {editMode ? (
                                <div className="profile-edit-form">
                                    <div className="profile-field">
                                        <label className="profile-label">Programme of study</label>
                                        <input
                                            className="profile-input"
                                            type="text"
                                            placeholder="e.g. BSc Computer Science"
                                            value={programme}
                                            onChange={(e) => setProgramme(e.target.value)}
                                        />
                                    </div>
                                    <div className="profile-field">
                                        <label className="profile-label">Bio</label>
                                        <textarea
                                            className="profile-textarea"
                                            placeholder="Tell other students a bit about yourself..."
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            rows={4}
                                        />
                                    </div>
                                    {saveError && (
                                        <p className="profile-error">
                                            <i className="ti ti-alert-circle" aria-hidden="true"></i>
                                            {saveError}
                                        </p>
                                    )}
                                    <div className="profile-edit-actions">
                                        <button
                                            className="profile-btn-cancel"
                                            onClick={() => {
                                                setEditMode(false);
                                                setSaveError("");
                                                setProgramme(profile.programme || "");
                                                setBio(profile.bio || "");
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="profile-btn-save"
                                            onClick={handleSave}
                                            disabled={saving}
                                        >
                                            {saving ? "Saving..." : "Save changes"}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="profile-view">
                                    <div className="profile-view-item">
                                        <span className="profile-view-label">Programme</span>
                                        <span className="profile-view-value">
                                            {profile.programme || (
                                                <span className="profile-empty">Not set</span>
                                            )}
                                        </span>
                                    </div>
                                    <div className="profile-view-item">
                                        <span className="profile-view-label">Bio</span>
                                        <span className="profile-view-value">
                                            {profile.bio || (
                                                <span className="profile-empty">No bio yet</span>
                                            )}
                                        </span>
                                    </div>
                                    <div className="profile-view-item">
                                        <span className="profile-view-label">Member since</span>
                                        <span className="profile-view-value">
                                            {new Date(profile.created_at).toLocaleDateString("en-ZA", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* RIGHT — Module Enrolment */}
                    <div className="profile-right">

                        {/* Enrolled modules */}
                        <div className="profile-card">
                            <div className="profile-card-header">
                                <h2 className="profile-card-title">
                                    Enrolled modules
                                    <span className="profile-card-count">
                                        {profile.enrolled_modules.length}
                                    </span>
                                </h2>
                            </div>

                            {moduleError && (
                                <p className="profile-error">
                                    <i className="ti ti-alert-circle" aria-hidden="true"></i>
                                    {moduleError}
                                </p>
                            )}

                            {profile.enrolled_modules.length === 0 ? (
                                <p className="profile-empty-modules">
                                    You are not enrolled in any modules yet. Add some below.
                                </p>
                            ) : (
                                <div className="profile-module-list">
                                    {/* REACT: .map() renders one row per enrolled module */}
                                    {profile.enrolled_modules.map((mod) => (
                                        <div key={mod.id} className="profile-module-row">
                                            <div className="profile-module-info">
                                                <span className="profile-module-code">{mod.code}</span>
                                                <span className="profile-module-name">{mod.name}</span>
                                            </div>
                                            <button
                                                className="profile-unenrol-btn"
                                                disabled={unenrollingId === mod.id}
                                                onClick={() => handleUnenrol(mod.id)}
                                            >
                                                {unenrollingId === mod.id ? "Removing..." : "Remove"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Available modules to enrol in */}
                        <div className="profile-card">
                            <div className="profile-card-header">
                                <h2 className="profile-card-title">Add modules</h2>
                            </div>

                            {availableModules.length === 0 ? (
                                <p className="profile-empty-modules">
                                    You are enrolled in all available modules.
                                </p>
                            ) : (
                                <div className="profile-module-list">
                                    {availableModules.map((mod) => (
                                        <div key={mod.id} className="profile-module-row">
                                            <div className="profile-module-info">
                                                <span className="profile-module-code">{mod.code}</span>
                                                <span className="profile-module-name">{mod.name}</span>
                                            </div>
                                            <button
                                                className="profile-enrol-btn"
                                                disabled={enrollingId === mod.id}
                                                onClick={() => handleEnrol(mod.id)}
                                            >
                                                {enrollingId === mod.id ? "Adding..." : "Add"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}