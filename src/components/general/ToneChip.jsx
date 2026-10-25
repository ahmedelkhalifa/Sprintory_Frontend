import { Box, Chip } from "@mui/material";
import { alpha } from "@mui/material/styles";

// read a palette color from its path, e.g. "success.main" -> theme.palette.success.main
const paletteColor = (theme, path) => path.split(".").reduce((value, key) => value?.[key], theme.palette);

// Small soft label in one theme color (text in the color, background a light tint of it),
// optionally with a dot in front. Used for template, status and role labels.
const ToneChip = ({ label, tone = "text.secondary", dot = false }) => {
  return (
    <Chip
      size="small"
      label={
        dot ? (
          <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
            <Box component="span" sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: tone }} />
            {label}
          </Box>
        ) : (
          label
        )
      }
      sx={(theme) => ({
        height: 24,
        borderRadius: 1,
        fontWeight: 600,
        color: tone,
        bgcolor: alpha(paletteColor(theme, tone), 0.12),
      })}
    />
  );
};

export default ToneChip;
