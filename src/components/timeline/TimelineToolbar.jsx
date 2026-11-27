import { Box, Button, LinearProgress, ToggleButton, ToggleButtonGroup } from "@mui/material";
import TodayIcon from "@mui/icons-material/Today";
import { ZOOMS } from "../../utils/schedule";

const TOOL_SX = { height: 40, fontWeight: 600, borderColor: "divider", bgcolor: "background.paper" };

// The Timeline's toolbar: on the right "Go to today" and the Day / Week / Month zoom (AC 13–14); a thin line under it
// while a new answer loads, so the chart doesn't look stuck. `children` go on the left (the filters), `chips` (the
// picked filters) on a row of their own.
const TimelineToolbar = ({ zoom, onZoomChange, onToday, todayDisabled, loading, chips, children }) => (
  <Box>
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
      {children}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, ml: { sm: "auto" } }}>
        <Button variant="outlined" color="inherit" startIcon={<TodayIcon />} onClick={onToday} disabled={todayDisabled} sx={TOOL_SX}>
          Go to today
        </Button>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={zoom}
          onChange={(_, value) => value && onZoomChange(value)}
          aria-label="Zoom"
          sx={{ bgcolor: "background.paper" }}
        >
          {Object.values(ZOOMS).map(({ value, label }) => (
            <ToggleButton key={value} value={value} sx={{ height: 40, px: 1.75, fontWeight: 600, textTransform: "none" }}>
              {label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
    </Box>
    {chips && <Box sx={{ mt: 1.25 }}>{chips}</Box>}
    <LinearProgress sx={{ mt: 1, height: 2, borderRadius: 1, visibility: loading ? "visible" : "hidden" }} />
  </Box>
);

export default TimelineToolbar;
