import { useCallback, useEffect, useMemo, useState } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createAppTheme } from "../theme/theme";
import { COLOR_MODES, ColorModeContext } from "./ColorModeContext";

const STORAGE_KEY = "colorMode";
const DEFAULT_MODE = "light";
const DARK_QUERY = "(prefers-color-scheme: dark)";

// storage can be unavailable (private window, blocked site data); the app then just uses the default
const readMode = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return COLOR_MODES.includes(saved) ? saved : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
};

const systemPrefersDark = () => Boolean(window.matchMedia?.(DARK_QUERY).matches);

// The light / dark theme for the whole app. The choice ("system" follows the OS) is kept in this browser's
// localStorage (the backend has no user preferences yet) and read before the first render, so the page never
// flashes the wrong colors. Exposes { mode, resolvedMode, setMode } through useColorMode().
const ColorModeProvider = ({ children }) => {
  const [mode, setModeState] = useState(readMode);
  const [prefersDark, setPrefersDark] = useState(systemPrefersDark);

  useEffect(() => {
    const media = window.matchMedia?.(DARK_QUERY);
    const onSystemChange = (e) => setPrefersDark(e.matches);
    // another tab changed the choice
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setModeState(readMode());
    };
    media?.addEventListener("change", onSystemChange);
    window.addEventListener("storage", onStorage);
    return () => {
      media?.removeEventListener("change", onSystemChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const setMode = useCallback((next) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // see readMode
    }
  }, []);

  const resolvedMode = mode === "system" ? (prefersDark ? "dark" : "light") : mode;
  const theme = useMemo(() => createAppTheme(resolvedMode), [resolvedMode]);
  const value = useMemo(() => ({ mode, resolvedMode, setMode }), [mode, resolvedMode, setMode]);

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        {/* enableColorScheme: scrollbars and native inputs follow the mode too */}
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export default ColorModeProvider;
