import { createContext, useContext, useEffect, useState } from "react";

// the list of available themes
export const THEMES = [
    { id: "light", label: "Light", icon: "ti-sun" },
    { id: "dark", label: "Dark", icon: "ti-moon" },
    { id: "ocean", label: "Ocean", icon: "ti-droplet" },
    { id: "rose", label: "Rose", icon: "ti-heart" },
];

const ThemeContext = createContext();
// read saved theme from localStorage, fall back to light if not found
export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(
        localStorage.getItem("theme") || "light"
    );

    useEffect(() => {
        // apply the theme class to the root element
        document.documentElement.setAttribute("data-theme", theme);
        // save the choice so it persists after page refresh
        localStorage.setItem("theme", theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
// custom hook, any component imports this to read or change the theme
export function useTheme() {
    return useContext(ThemeContext);
}