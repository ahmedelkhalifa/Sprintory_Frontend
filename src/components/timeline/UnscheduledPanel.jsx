import { useState } from "react";
import { Box, Button, Link, Paper, Typography } from "@mui/material";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import StageIcon from "./StageIcon";
import { taskPath } from "../../utils/task";

// how many show before "Show all"
const FIRST = 8;
const NEW_TAB = { target: "_blank", rel: "noopener noreferrer" };

const ROW_SX = {
  display: "grid",
  gridTemplateColumns: { xs: "auto minmax(0, 1fr) auto", sm: "auto auto minmax(0, 1fr) auto" },
  alignItems: "center",
  columnGap: 1,
  px: 1.5,
  py: 1,
  borderTop: 1,
  borderColor: "divider",
};

/**
 * The project's tasks without dates (PMP-48 AC 7, 9; backend schedule-docs §2), which the chart can't draw: always
 * the whole project's, whatever the filters. Each has the backend's hint about its links ("blocked by PMP-11, set
 * dates to see it on the chart") and opens its task page in a new tab, "Set dates" for people who may change them
 * (`canEditDates`), "Open" for everyone else (a Viewer, a read-only project).
 */
const UnscheduledPanel = ({ workspace, project, tasks, canEditDates }) => {
  const [all, setAll] = useState(false);
  if (tasks.length === 0) return null;
  const shown = all ? tasks : tasks.slice(0, FIRST);

  return (
    <Paper elevation={0} component="section" aria-label="Unscheduled tasks" sx={{ border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1.25 }}>
        <EventBusyOutlinedIcon sx={{ fontSize: 20, color: "text.secondary" }} />
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          Unscheduled
          <Box component="span" sx={{ ml: 0.75, color: "text.secondary", fontWeight: 500 }}>
            {tasks.length}
          </Box>
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ ml: "auto", display: { xs: "none", sm: "block" } }}>
          No start and due dates yet, so they aren't on the chart
        </Typography>
      </Box>
      {shown.map((task) => {
        const href = taskPath(workspace, project, task.id);
        return (
          <Box key={task.id} sx={ROW_SX}>
            <StageIcon category={task.statusCategory} statusName={task.statusName} />
            <Link href={href} {...NEW_TAB} variant="caption" underline="hover" sx={{ fontWeight: 700, color: "text.secondary", display: { xs: "none", sm: "inline" } }}>
              {task.key}
            </Link>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" noWrap title={task.title}>
                {task.title}
              </Typography>
              {task.hint && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  {task.hint}
                </Typography>
              )}
            </Box>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              href={href}
              {...NEW_TAB}
              endIcon={<OpenInNewIcon sx={{ fontSize: "16px !important" }} />}
              aria-label={`${canEditDates ? "Set dates for" : "Open"} ${task.key} in a new tab`}
            >
              {canEditDates ? "Set dates" : "Open"}
            </Button>
          </Box>
        );
      })}
      {tasks.length > FIRST && (
        <Box sx={{ borderTop: 1, borderColor: "divider", px: 0.5, py: 0.25 }}>
          <Button size="small" color="inherit" onClick={() => setAll((open) => !open)} sx={{ color: "text.secondary" }}>
            {all ? "Show fewer" : `Show all ${tasks.length}`}
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default UnscheduledPanel;
