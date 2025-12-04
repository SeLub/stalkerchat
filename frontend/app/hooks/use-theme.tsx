import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "stalker" | "telegram" | "minimal";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("stalker");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored && ["stalker", "telegram", "minimal"].includes(stored)) {
      setThemeState(stored);
      document.documentElement.setAttribute("data-theme", stored);
    } else {
      document.documentElement.setAttribute("data-theme", "stalker");
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
