import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("darkMode") === "true";
    setDarkMode(saved);
    applyTheme(saved);
  }, []);

  const applyTheme = (isDark) => {
    const root = document.documentElement;

    if (isDark) {
      root.classList.add("dark");

      // ✅ FULL BLACK APP BACKGROUND
      document.body.style.backgroundColor = "#000000";
      document.body.style.color = "#ffffff";
    } else {
      root.classList.remove("dark");

      document.body.style.backgroundColor = "#f1f5f9";
      document.body.style.color = "#0f172a";
    }
  };

  const toggleDarkMode = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    localStorage.setItem("darkMode", newValue);
    applyTheme(newValue);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);