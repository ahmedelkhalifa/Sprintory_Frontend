import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#315A85", // Primary Blue: buttons, links, active tabs
      dark: "#203B5B", // Deep Navy: hover, selected
      light: "#7899B8", // Muted Blue
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#7899B8", // Muted Blue: secondary elements, charts
    },
    success: {
      main: "#4F8A70", // Sage Green: completed tasks, positive progress
    },
    warning: {
      main: "#B7791F", // amber (status color, not a brand color)
    },
    error: {
      main: "#B54747", // muted red (status color, not a brand color)
    },
    background: {
      default: "#F7F5EF", // Warm Cream: app background
      paper: "#FFFFFF", // White: cards, forms, dialogs
    },
    text: {
      primary: "#182638", // Dark Navy Text: headings, primary text
      secondary: "#667085", // Slate Gray Text: descriptions
    },
    divider: "#E5E2DA", // Warm Gray: borders, dividers

    // Custom colors MUI doesn't have built in
    navActive: {
      background: "#E6EEF6", // pale blue
      text: "#203B5B", // dark blue
    },
    ai: {
      background: "#EEF3F8", // light blue tint for AI panels
      border: "#C9D7E5",
    },
  },

  typography: {
    fontFamily: "'Roboto', sans-serif",
  },

  shape: {
    borderRadius: 8, // rounded corners for buttons, cards, inputs
  },

  // Default styles for specific components, applied everywhere
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 500 }, // no ALL CAPS buttons
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: "1px solid #E5E2DA" }, // subtle borders instead of heavy shadows
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          "&.Mui-selected": {
            // active navigation item
            backgroundColor: "#E6EEF6",
            color: "#203B5B",
          },
          "&.Mui-selected:hover": { backgroundColor: "#DCE6F0" },
        },
      },
    },
  },
});

export default theme;
