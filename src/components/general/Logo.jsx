import { Box, Typography } from "@mui/material";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";

// The one Sprintory logo, use this everywhere instead of rebuilding it.
// inverted: white version for dark backgrounds (e.g. the sidebar)
// TODO: replace the icon with the real logo SVG when it's ready
const Logo = ({ size = 28, inverted = false }) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <BoltRoundedIcon
        sx={{
          fontSize: size * 1.3,
          color: inverted ? "common.white" : "navActive.text",
          transform: "skewX(-10deg)",
        }}
      />
      <Typography
        component="span"
        sx={{
          fontSize: size,
          fontWeight: 700,
          color: inverted ? "common.white" : "text.primary",
          letterSpacing: "-0.02em",
        }}
      >
        Sprintory
      </Typography>
    </Box>
  );
};

export default Logo;
