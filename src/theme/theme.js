import { createTheme } from "@mui/material/styles";

// MUI's default shadows, with level 1 softened for cards (border + faint lift)
const shadows = createTheme().shadows.slice();
shadows[1] = "0 1px 2px rgba(16, 24, 40, 0.04)";

const theme = createTheme({
  palette: {
    primary: {
      main: "#2B5A8F", // Primary Blue: buttons, links, active tabs
      dark: "#1E3A5F", // Deep Navy: top bar, hover, selected
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
      default: "#F5F7FB", // Cool Light Gray: app background
      paper: "#FFFFFF", // White: cards, forms, dialogs, sidebar
    },
    text: {
      primary: "#14233A", // Dark Navy Text: headings, primary text
      secondary: "#5B6B80", // Slate Gray Text: descriptions
    },
    divider: "#E4E8EF", // Cool Gray: borders, dividers

    // Custom colors MUI doesn't have built in
    navActive: {
      background: "#E8EFF8", // pale blue
      text: "#1E3A5F", // dark blue
    },
    ai: {
      background: "#EEF3FA", // light blue tint for AI panels
      border: "#C9D7E8",
    },
  },

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
          "&.Mui-selected:hover": { backgroundColor: "#DDE7F4" },
        }),
      },
    },
  },
});

export default theme;
