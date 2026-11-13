import { createTheme, keyframes } from "@mui/material/styles";
import Fade from "@mui/material/Fade";
import { SHELL_EASE } from "./layout";
import ZoomFromTrigger from "./ZoomFromTrigger";
import { DIALOG_EXIT_MS, SPRING, pressable } from "./motion";

// menus open from just under full size (MUI's Grow starts at 75%, which reads as a zoom); the scale's origin
// is the trigger, which Popover sets on the paper. The fade comes from the Fade transition, also on close.
const popIn = keyframes`
  from { transform: scale(0.95); }
  to { transform: none; }
`;
const POPOVER_MOTION = {
  defaultProps: { slots: { transition: Fade }, transitionDuration: { enter: 180, exit: 120 } },
  paper: { "@media (prefers-reduced-motion: no-preference)": { animation: `${popIn} 180ms ${SHELL_EASE}` } },
};

// The visual language is the category standard (Jira-like), see PRODUCT.md and DESIGN.md: a white work surface,
// a light-gray sidebar, hairline borders, 3px corners, and one blue for actions, links, focus and selection.

// avatar backgrounds (white initials on them), the same in both modes so a person keeps their color;
// each is at least 4.5:1 against white
const AVATAR = { blue: "#0055CC", navy: "#09326C", green: "#216E4E", amber: "#A54800", slate: "#44546F" };

// The colors of each mode. Components only use these tokens (never hex values), so they follow the mode.
const PALETTES = {
  light: {
    primary: {
      main: "#0C66E4", // the one blue: primary buttons, links, focus, selection
      dark: "#0055CC", // hover / pressed
      light: "#579DFF",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#626F86", // neutral gray: secondary elements, charts
    },
    success: {
      main: "#1F845A", // done, positive progress
    },
    info: {
      main: "#1D7AFC", // in progress
    },
    warning: {
      main: "#A54800", // allowed but worth a look
    },
    error: {
      main: "#C9372C", // refused, overdue, destructive
    },
    background: {
      default: "#F7F8F9", // light gray: the sidebar, inner fills (rows, chips) and the auth pages
      paper: "#FFFFFF", // white: the work surface, cards, dialogs, menus
    },
    text: {
      primary: "#172B4D",
      secondary: "#44546F",
      disabled: "#8590A2",
    },
    divider: "#DFE1E6", // hairlines

    // Custom colors MUI doesn't have built in
    navActive: {
      background: "#E9F2FF", // the selected navigation item only
      text: "#0C66E4", // strong blue text (selected item, role badges)
      hover: "#CCE0FF", // a selected item under the pointer
    },
    // was a blue tint for AI panels; now a neutral inner panel (the work surface has no tinted panels)
    ai: {
      background: "#F7F8F9",
      border: "#DFE1E6",
    },
    topBar: {
      background: "#FFFFFF", // the app's top bar, with a hairline under it
      text: "#44546F", // its icons
    },
    hero: {
      background: "#FFFFFF", // under the auth pages' picture (multiplied: white keeps it as is)
    },
    avatar: AVATAR,
  },

  dark: {
    // a lighter blue with dark text on it: readable both as text on the dark page and as a button
    primary: {
      main: "#579DFF",
      dark: "#85B8FF", // hover goes lighter on a dark surface
      light: "#CCE0FF",
      contrastText: "#1D2125",
    },
    secondary: {
      main: "#8C9BAB",
    },
    success: {
      main: "#4BCE97",
    },
    info: {
      main: "#579DFF",
    },
    warning: {
      main: "#F38A3F",
    },
    error: {
      main: "#F87168",
    },
    background: {
      default: "#161A1D", // sidebar and inner fills sit a little darker than the page
      paper: "#1D2125",
    },
    text: {
      primary: "#C7D1DB",
      secondary: "#9FADBC",
      disabled: "#738496",
    },
    divider: "#38414A",

    navActive: {
      background: "#1C2B41",
      text: "#579DFF",
      hover: "#09326C",
    },
    ai: {
      background: "#22272B",
      border: "#38414A",
    },
    topBar: {
      background: "#1D2125",
      text: "#9FADBC",
    },
    hero: {
      background: "#1C2B41", // tints the auth pages' picture dark navy
    },
    avatar: AVATAR,
  },
};

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// soft: cards at rest (a hairline plus a wide, faint shadow, so they sit just off the surface; theme.depth.soft);
// raised: a card that lifts (drag); overlay: menus, popovers, dialogs
const DEPTH = {
  light: {
    raised: "0 1px 1px rgba(9, 30, 66, 0.25), 0 0 1px rgba(9, 30, 66, 0.31)",
    overlay: "0 8px 12px rgba(9, 30, 66, 0.15), 0 0 1px rgba(9, 30, 66, 0.31)",
    soft: "0 1px 2px rgba(9, 30, 66, 0.06), 0 4px 16px rgba(9, 30, 66, 0.06)",
  },
  dark: {
    raised: "0 1px 1px rgba(3, 4, 4, 0.5), 0 0 1px rgba(3, 4, 4, 0.5)",
    overlay: "0 0 0 1px #38414A, 0 8px 12px rgba(3, 4, 4, 0.36), 0 0 1px rgba(3, 4, 4, 0.5)",
    soft: "0 1px 2px rgba(3, 4, 4, 0.4), 0 4px 16px rgba(3, 4, 4, 0.3)",
  },
};

// the tooltip is the one inverted surface: dark ink in light mode, light ink in dark mode
const TOOLTIP = { light: "#172B4D", dark: "#B6C2CF" };

// the light / dark theme. `mode` is "light" or "dark" (ColorModeProvider picks it, "system" included)
export const createAppTheme = (mode) => {
  const depth = DEPTH[mode];
  // level 0 none, 1 cards at rest (soft), 2-7 raised, 8+ overlays
  const shadows = ["none", depth.soft, ...Array(6).fill(depth.raised), ...Array(17).fill(depth.overlay)];

  return createTheme({
    palette: { mode, ...PALETTES[mode] },
    depth,

    typography: {
      fontFamily: FONT,
      fontSize: 14,
      // one product scale: page title, section title, body, meta; pages shouldn't need their own sizes or weights
      h1: { fontSize: 32, fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.01em" },
      h2: { fontSize: 28, fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.01em" },
      h3: { fontSize: 24, fontWeight: 600, lineHeight: 1.25, letterSpacing: "-0.01em" },
      h4: { fontSize: 24, fontWeight: 600, lineHeight: 1.25, letterSpacing: "-0.01em" }, // page titles
      h5: { fontSize: 20, fontWeight: 600, lineHeight: 1.3 },
      h6: { fontSize: 16, fontWeight: 600, lineHeight: 1.35 }, // section titles
      subtitle1: { fontSize: 14, fontWeight: 600, lineHeight: 1.43 },
      subtitle2: { fontSize: 12, fontWeight: 600, lineHeight: 1.33 },
      body1: { fontSize: 14, lineHeight: 1.43 },
      body2: { fontSize: 13, lineHeight: 1.45 },
      caption: { fontSize: 12, lineHeight: 1.33 },
      overline: { fontSize: 11, fontWeight: 700, lineHeight: 1.45, letterSpacing: "0.06em" },
      button: { fontSize: 14, fontWeight: 500, textTransform: "none" },
    },

    shape: {
      borderRadius: 3, // sx multipliers scale with it: borderRadius 2 is 6px
    },

    shadows,

    // Default styles for specific components, applied everywhere
    components: {
      MuiCssBaseline: {
        styleOverrides: (theme) => ({
          // the browser's own surfaces follow the palette too
          "::selection": { backgroundColor: theme.palette.navActive.hover, color: theme.palette.text.primary },
          body: { scrollbarColor: `${theme.palette.divider} transparent` },
          "input, textarea": { caretColor: theme.palette.primary.main },
        }),
      },
      // no ripples: a focus ring and a slight press instead
      MuiButtonBase: {
        defaultProps: { disableRipple: true },
        styleOverrides: {
          root: ({ theme }) => ({
            "&.Mui-focusVisible": { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
          }),
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: ({ theme }) => ({
            minHeight: 32,
            padding: "4px 12px",
            whiteSpace: "nowrap",
            // a slight press, so a click feels answered; MUI's own color transitions are kept
            ...pressable(
              0.97,
              theme.transitions.create(["background-color", "box-shadow", "border-color", "color"], {
                duration: theme.transitions.duration.shortest,
              }),
            ),
            // the default button: neutral, hairline border (primary stays the filled blue one)
            "&.MuiButton-outlined.MuiButton-colorPrimary, &.MuiButton-outlined.MuiButton-colorInherit": {
              color: theme.palette.text.primary,
              borderColor: theme.palette.divider,
              backgroundColor: theme.palette.background.paper,
              "&:hover": { backgroundColor: theme.palette.action.hover, borderColor: theme.palette.text.disabled },
            },
          }),
          sizeSmall: { minHeight: 28, padding: "2px 8px", fontSize: 13 },
          startIcon: { marginRight: 6 },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          // icons are small, so they press a little deeper than buttons
          root: ({ theme }) => ({ borderRadius: theme.shape.borderRadius, ...pressable(0.92) }),
        },
      },
      MuiToggleButton: {
        styleOverrides: { root: pressable(0.96) },
      },
      MuiSwitch: {
        styleOverrides: {
          // the knob slides with a spring instead of MUI's quick linear-ish step
          switchBase: {
            transition: `left 150ms ease, transform 300ms ${SPRING.easing}`,
            "@media (prefers-reduced-motion: reduce)": { transition: "none" },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          // MUI lightens dark-mode paper with a gradient; the palette already sets each surface
          root: { backgroundImage: "none" },
        },
        // the app's cards are flat Papers (elevation 0) with a hairline border: they get the soft card shadow too.
        // The shell's own surfaces (top bar, docked sidebar) and alerts opt out below.
        variants: [{ props: { elevation: 0 }, style: { boxShadow: depth.soft } }],
      },
      MuiAppBar: {
        styleOverrides: { root: { "&&": { boxShadow: "none" } } },
      },
      MuiDrawer: {
        styleOverrides: { docked: { "& .MuiDrawer-paper": { boxShadow: "none" } } },
      },
      MuiCard: {
        defaultProps: { elevation: 1 },
        styleOverrides: {
          root: ({ theme }) => ({ border: `1px solid ${theme.palette.divider}` }),
        },
      },
      MuiPopover: {
        // dropdowns open quickly and close faster
        defaultProps: POPOVER_MOTION.defaultProps,
        styleOverrides: { paper: POPOVER_MOTION.paper },
      },
      MuiMenu: {
        // set here too: Menu hands its own (empty) transition slot to Popover
        defaultProps: POPOVER_MOTION.defaultProps,
        styleOverrides: {
          paper: POPOVER_MOTION.paper,
          list: { paddingTop: 4, paddingBottom: 4 },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: { minHeight: 36, fontSize: 14 },
        },
      },
      MuiTooltip: {
        // a short wait before the first one; MUI then shows the next ones straight away
        defaultProps: { enterDelay: 300, disableInteractive: true },
        styleOverrides: {
          tooltip: ({ theme }) => ({
            backgroundColor: TOOLTIP[mode],
            color: theme.palette.background.paper,
            fontSize: 12,
            fontWeight: 500,
            padding: "4px 8px",
            borderRadius: theme.shape.borderRadius,
          }),
        },
      },
      MuiChip: {
        styleOverrides: {
          // square-ish tags, not pills
          root: ({ theme }) => ({
            borderRadius: theme.shape.borderRadius,
            fontWeight: 500,
            "&.MuiChip-clickable": pressable(0.96, "background-color 150ms ease, box-shadow 150ms ease"),
          }),
          sizeSmall: { height: 22, fontSize: 12 },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper,
            "&:hover:not(.Mui-focused):not(.Mui-disabled):not(.Mui-error) .MuiOutlinedInput-notchedOutline": {
              borderColor: theme.palette.text.disabled,
            },
          }),
          notchedOutline: ({ theme }) => ({ borderColor: theme.palette.divider }),
        },
      },
      MuiLink: {
        defaultProps: { underline: "hover" },
      },
      MuiTabs: {
        styleOverrides: {
          root: { minHeight: 40 },
          // the underline glides to the new tab on a spring (MUI moves it with left / width, a 3px bar, so cheap)
          indicator: {
            transition: `left ${SPRING.duration}ms ${SPRING.easing}, width ${SPRING.duration}ms ${SPRING.easing}`,
            "@media (prefers-reduced-motion: reduce)": { transition: "none" },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          // the label's color follows the underline instead of switching at once
          root: { textTransform: "none", fontWeight: 500, minHeight: 40, fontSize: 14, transition: "color 150ms ease" },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: ({ theme }) => ({ borderColor: theme.palette.divider, padding: "10px 12px" }),
          head: ({ theme }) => ({
            fontSize: 12,
            fontWeight: 600,
            color: theme.palette.text.secondary,
            borderBottomWidth: 2,
            paddingTop: 8,
            paddingBottom: 8,
          }),
        },
      },
      MuiAlert: {
        styleOverrides: {
          // an alert is a Paper too, but a message inside a page, not a card
          root: { alignItems: "center", "&&": { boxShadow: "none" } },
        },
      },
      MuiDialog: {
        // the paper grows out of the clicked button and goes back into it (ZoomFromTrigger); the fade and
        // backdrop stay quick
        defaultProps: { slots: { transition: ZoomFromTrigger }, transitionDuration: { enter: 220, exit: DIALOG_EXIT_MS } },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: { fontSize: 20, fontWeight: 600 },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            // nav rows are wide, so a very slight press
            ...pressable(0.98),
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
