import { memo } from "react";
import { Box, Typography } from "@mui/material";
import { AXIS_HEIGHT } from "./timelineLayout";

const LINE = AXIS_HEIGHT / 2;

// shared styles; each cell only adds its position (inline), so long ranges stay light
const CELL_SX = {
  position: "absolute",
  height: LINE,
  display: "flex",
  alignItems: "center",
  borderLeft: 1,
  borderColor: "divider",
  overflow: "hidden",
};
// `clip`, not `hidden`: a hidden overflow would stop the label sticking to the scroll area's edge
const GROUP_SX = { ...CELL_SX, top: 0, px: 1, overflow: "clip" };
const UNIT_SX = { ...CELL_SX, top: LINE, px: 0.75 };
const DAY_SX = { ...UNIT_SX, px: 0, justifyContent: "center" };
const GROUP_TEXT_SX = { fontWeight: 700, color: "text.primary" };
const UNIT_TEXT_SX = { fontWeight: 500, color: "text.secondary" };
const WEEKEND_TEXT_SX = { fontWeight: 500, color: "text.disabled" };

// The Timeline's date header (axisTicks): months over days or weeks, or years over months, each cell placed where
// its first day begins, so it lines up with the bars below at every zoom. A month (or year) label sticks just right
// of the task list (`stickyLeft`) while its month is on screen, so the view always says which month it shows
const TimelineAxis = memo(({ ticks, range, dayWidth, zoom, stickyLeft }) => {
  const at = (cell) => ({ left: (cell.start - range.start) * dayWidth, width: cell.days * dayWidth });
  return (
    <Box sx={{ position: "relative", height: AXIS_HEIGHT }} style={{ width: range.days * dayWidth }}>
      {ticks.groups.map((group) => (
        <Box key={group.key} sx={GROUP_SX} style={at(group)}>
          <Typography variant="caption" noWrap sx={GROUP_TEXT_SX} style={{ position: "sticky", left: stickyLeft }}>
            {group.label}
          </Typography>
        </Box>
      ))}
      {ticks.units.map((unit) => (
        <Box key={unit.key} sx={zoom === "day" ? DAY_SX : UNIT_SX} style={at(unit)}>
          <Typography variant="caption" noWrap sx={unit.weekend ? WEEKEND_TEXT_SX : UNIT_TEXT_SX}>
            {unit.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
});

export default TimelineAxis;
