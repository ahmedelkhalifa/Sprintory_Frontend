import { Box, Typography } from "@mui/material";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";

// TODO: replace the icon with the real logo SVG when it's ready
const Logo = ({ size = 28 }) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <BoltRoundedIcon
        sx={{ fontSize: size * 1.3, color: "primary.dark", transform: "skewX(-10deg)" }}
      />
      <Typography
        component="span"
        sx={{ fontSize: size, fontWeight: 700, color: "text.primary", letterSpacing: "-0.02em" }}
      >
        Sprintory
      </Typography>
    </Box>
  );
};

export default Logo;
