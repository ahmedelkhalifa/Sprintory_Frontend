import { Box, CircularProgress, Paper, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

// read a palette color from its path, e.g. "success.main" -> theme.palette.success.main
const paletteColor = (theme, path) => path.split(".").reduce((value, key) => value?.[key], theme.palette);

// a donut showing `value` % in the tone color, over a light track
export const Ring = ({ value, tone }) => (
  <Box sx={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
    <CircularProgress variant="determinate" value={100} size={56} thickness={5} sx={{ color: "divider", position: "absolute" }} />
    <CircularProgress
      variant="determinate"
      value={value}
      size={56}
      thickness={5}
      sx={{ color: tone, position: "absolute", "& .MuiCircularProgress-circle": { strokeLinecap: "round" } }}
    />
  </Box>
);

// a small line chart of `points`, drawn in the tone color
export const Sparkline = ({ points, tone }) => {
  const width = 72;
  const height = 32;
  const min = Math.min(...points);
  const span = Math.max(...points) - min || 1;
  const path = points
    .map((p, i) => `${(i / (points.length - 1)) * width},${height - 2 - ((p - min) / span) * (height - 4)}`)
    .join(" ");

  return (
    <Box component="svg" viewBox={`0 0 ${width} ${height}`} sx={{ width, height, color: tone, flexShrink: 0 }} aria-hidden>
      <polyline points={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Box>
  );
};

// One statistic: an icon tile, a label, the number, a small caption (e.g. "50%"), and a chart on the right
const StatCard = ({ Icon, tone, label, value, caption, chart }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0 }}>
        <Box
          sx={(theme) => ({
            width: 44,
            height: 44,
            borderRadius: 1.5,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: tone,
            bgcolor: alpha(paletteColor(theme, tone), 0.12),
          })}
        >
          <Icon />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary" noWrap>
            {label}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
            <Typography sx={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2 }}>{value}</Typography>
            {caption}
          </Box>
        </Box>
      </Box>
      {chart}
    </Paper>
  );
};

export default StatCard;
