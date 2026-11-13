import { Link as RouterLink } from "react-router-dom";
import { Box, ButtonBase } from "@mui/material";
import { HEADER_HEIGHT } from "../../../theme/layout";
import { pressable } from "../../../theme/motion";

// The Settings tab's section menu: a vertical list beside the content on wide screens (sticky under the top bar),
// one horizontally scrolling row above it on phones. The selected item looks like the sidebar's.
// `sections` from settingsSectionsFor, `pathFor(id)` builds a section's url.
const SettingsNav = ({ sections, current, pathFor }) => (
  <Box
    component="nav"
    aria-label="Project settings"
    sx={{
      position: { md: "sticky" },
      top: { md: HEADER_HEIGHT + 16 },
      display: "flex",
      flexDirection: { xs: "row", md: "column" },
      gap: 0.5,
      overflowX: { xs: "auto", md: "visible" },
      mx: { xs: -2, sm: 0 },
      px: { xs: 2, sm: 0 },
      pb: { xs: 0.5, md: 0 },
      scrollbarWidth: "none",
    }}
  >
    {sections.map(({ id, label, Icon }) => {
      const selected = id === current;
      return (
        <ButtonBase
          key={id}
          component={RouterLink}
          to={pathFor(id)}
          aria-current={selected ? "page" : undefined}
          sx={{
            flexShrink: 0,
            justifyContent: "flex-start",
            gap: 1.25,
            px: 1.5,
            height: 36,
            borderRadius: 1,
            fontSize: 14,
            fontWeight: selected ? 600 : 500,
            whiteSpace: "nowrap",
            color: selected ? "navActive.text" : "text.secondary",
            bgcolor: selected ? "navActive.background" : "transparent",
            ...pressable(0.98, "background-color 120ms ease-out, color 120ms ease-out"),
            "@media (hover: hover)": {
              "&:hover": {
                bgcolor: selected ? "navActive.hover" : "action.hover",
                color: selected ? "navActive.text" : "text.primary",
              },
            },
            "&.Mui-focusVisible": { outline: 2, outlineColor: "primary.main", outlineOffset: -2 },
          }}
        >
          <Icon fontSize="small" />
          {label}
        </ButtonBase>
      );
    })}
  </Box>
);

export default SettingsNav;
