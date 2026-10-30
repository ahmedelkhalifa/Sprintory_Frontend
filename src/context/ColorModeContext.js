import { createContext, useContext } from "react";

// what the user can pick; "system" follows the operating system's setting
export const COLOR_MODES = ["light", "dark", "system"];

export const ColorModeContext = createContext(null);

// { mode ("light" | "dark" | "system"), resolvedMode ("light" | "dark"), setMode }
export const useColorMode = () => useContext(ColorModeContext);
