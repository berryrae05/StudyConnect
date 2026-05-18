import { useState } from "react";
import { useTheme, THEMES } from "../../context/ThemeContext";
import "./ThemeToggle.css";

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [open, setOpen] = useState(false);

    return (
        <div className="theme-toggle">
            <button
                className="theme-btn"
                onClick={() => setOpen(!open)}
                aria-label="Change theme"
            >
                <i className={`ti ${THEMES.find(t => t.id === theme)?.icon}`}></i>
            </button>

            {open && (
                <div className="theme-panel">
                    <p className="theme-panel-label">Choose theme</p>
                    <div className="theme-options">
                        {THEMES.map((t) => (
                            <button
                                key={t.id}
                                className={`theme-option ${theme === t.id ? "active" : ""}`}
                                onClick={() => { setTheme(t.id); setOpen(false); }}
                            >
                                <i className={`ti ${t.icon}`}></i>
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {open && (
                <div className="theme-overlay" onClick={() => setOpen(false)} />
            )}
        </div>
    );
}