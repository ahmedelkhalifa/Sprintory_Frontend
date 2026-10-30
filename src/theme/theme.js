import { createTheme } from "@mui/material/styles";

// avatar backgrounds (white initials on them), the same in both modes so a person keeps their color
const AVATAR = { blue: "#2B5A8F", navy: "#1E3A5F", green: "#2E9E6A", amber: "#C98A12", slate: "#5B6B80" };

// The colors of each mode. Components only use these tokens (never hex values), so they follow the mode.
const PALETTES = {
  light: {
    primary: {
      main: "#2B5A8F", // Primary Blue: buttons, links, active tabs
      dark: "#1E3A5F", // Deep Navy: hover
      light: "#6E93BD", // Muted Blue
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#6E93BD", // Muted Blue: secondary elements, charts
    },
    success: {
      main: "#2E9E6A", // Green: completed tasks, positive progress
    },
    info: {
      main: "#3B7DD8", // bright blue: in-progress indicators
    },
    warning: {
      main: "#C98A12", // amber (status color, not a brand color)
    },
    error: {
      main: "#D14343", // red (status color, not a brand color)
    },
    background: {
      default: "#F5F7FB", // Cool Light Gray: inner fills (rows, chips) and the auth pages
      paper: "#FFFFFF", // White: the app's pages, cards, forms, dialogs, sidebar
    },
    text: {
      primary: "#14233A", // Dark Navy Text: headings, primary text
      secondary: "#5B6B80", // Slate Gray Text: descriptions
    },
    divider: "#E4E8EF", // Cool Gray: borders, dividers

    // Custom colors MUI doesn't have built in
    navActive: {
      background: "#E8EFF8", // pale blue
      text: "#1E3A5F", // dark blue: also strong blue text and tones (role chips, team badges)
      hover: "#DDE7F4", // a selected item under the pointer
    },
    ai: {
      background: "#EEF3FA", // light blue tint for AI panels
      border: "#C9D7E8",
    },
    topBar: {
      background: "#1E3A5F", // Deep Navy: the app's top bar (white content on it)
    },
    hero: {
      background: "#FFFFFF", // under the auth pages' picture (multiplied: white keeps it as is)
    },
    avatar: AVATAR,
  },

  dark: {
    // a lighter blue with dark text on it: readable both as text on the dark page and as a button
    primary: {
      main: "#6E9FE0",
      dark: "#5687CC",
      light: "#9CC0EE",
      contrastText: "#0E1520",
    },
    secondary: {
      main: "#7FA3CF",
    },
    success: {
      main: "#3FB97F",
    },
    info: {
      main: "#5A9BEA",
    },
    warning: {
      main: "#E0A43A",
    },
    error: {
      main: "#E5675F",
    },
    background: {
      default: "#0E1520", // inner fills sit a little darker than the page
      paper: "#151E2B",
    },
    text: {
      primary: "#E6EDF6",
      secondary: "#9DAABB",
    },
    divider: "#263244",

    navActive: {
      background: "#1D3150",
      text: "#CFE0F6",
      hover: "#243C60",
    },
    ai: {
      background: "#16263A",
      border: "#2B4363",
    },
    topBar: {
      background: "#101A27",
    },
    hero: {
      background: "#1D3150", // tints the auth pages' picture dark navy
    },
    avatar: AVATAR,
  },
};

// the light / dark theme. `mode` is "light" or "dark" (ColorModeProvider picks it, "system" included)
export const createAppTheme = (mode) => {
  // MUI's default shadows, with level 1 softened for cards (border + faint lift)
  const shadows = createTheme().shadows.slice();
  shadows[1] = mode === "dark" ? "0 1px 2px rgba(0, 0, 0, 0.4)" : "0 1px 2px rgba(16, 24, 40, 0.04)";

  return createTheme({
    palette: { mode, ...PALETTES[mode] },

    typography: {
      fontFamily: "'Inter', 'Roboto', sans-serif",
    },

    shape: {
      borderRadius: 8, // rounded corners for buttons, cards, inputs
    },

    shadows,

    // Default styles for specific components, applied everywhere
    components: {
      MuiButton: {
        styleOverrides: {
          root: { textTransform: "none", fontWeight: 500 }, // no ALL CAPS buttons
        },
      },
      MuiCard: {
        defaultProps: { elevation: 1 },
        styleOverrides: {
          // subtle borders instead of heavy shadows
          root: ({ theme }) => ({ border: `1px solid ${theme.palette.divider}` }),
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            // active navigation item
            "&.Mui-selected": {
              backgroundColor: theme.palette.navActive.background,
              color: theme.palette.navActive.text,
            },
            "&.Mui-selected:hover": { backgroundColor: theme.palette.navActive.hover },
          }),
        },
      },
    },
  });
};
