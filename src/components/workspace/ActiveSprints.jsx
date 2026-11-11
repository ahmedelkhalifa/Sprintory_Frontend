import { Link as RouterLink } from "react-router-dom";
import { Box, Link, Typography } from "@mui/material";
import SectionCard from "../general/SectionCard";
import ProjectAvatar from "../projects/ProjectAvatar";
import { projectTabPath } from "../../utils/project";
import { sprintDays, sprintDaysText } from "../../utils/myWork";
import { useWorkspaceAccess } from "../../hooks/useResourceAccess";

// at most this many "past the end" cells, so a long-overdue sprint doesn't squeeze its own days
const MAX_OVERDUE_CELLS = 5;

// the sprint's days as a strip of cells: gone (filled), today (outlined), still to come (gray), past the end (red)
const DayStrip = ({ days, label }) => {
  const overdueCells = Math.min(days.overdue, MAX_OVERDUE_CELLS);
  const cells = [
    ...Array.from({ length: days.total }, (_, i) => {
      if (i < days.current) return "gone";
      return i === days.current ? "today" : "ahead";
    }),
    ...Array(overdueCells).fill("over"),
  ];

  return (
    <Box
      role="img"
      aria-label={label}
      sx={{ display: "grid", gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))`, gap: "2px", mt: 1.25 }}
    >
      {cells.map((state, i) => (
        <Box
          key={i}
          sx={{
            height: 8,
            borderRadius: "1px",
            bgcolor: { gone: "primary.main", today: "background.paper", ahead: "action.selected", over: "error.main" }[state],
            ...(state === "today" && { boxShadow: (t) => `inset 0 0 0 2px ${t.palette.primary.main}` }),
          }}
        />
      ))}
    </Box>
  );
};

// each Scrum project's running sprint: how far it is, against its dates. sprints: [{ project, sprint, overdue }]
const ActiveSprints = ({ sprints }) => {
  const { workspace } = useWorkspaceAccess();

  return (
    <SectionCard title="Active sprints" count={sprints.length}>
      {sprints.map(({ project, sprint, overdue }) => {
        const days = sprintDays(sprint);
        const late = overdue || days?.overdue > 0;
        const text = late && days?.overdue === 0 ? "Past end date" : sprintDaysText(days);
        return (
          <Box key={sprint.id} sx={{ px: { xs: 2, sm: 2.5 }, py: 1.75, "& + &": { borderTop: 1, borderColor: "divider" } }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
              <ProjectAvatar project={project} size={24} />
              <Link
                component={RouterLink}
                to={projectTabPath(workspace, project, "board")}
                color="text.primary"
                noWrap
                sx={{ fontWeight: 600, minWidth: 0 }}
              >
                {sprint.name}
              </Link>
              <Typography variant="body2" color="text.secondary" noWrap sx={{ flexShrink: 0 }}>
                {project.name}
              </Typography>
            </Box>
            {sprint.goal && (
              <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.5 }} title={sprint.goal}>
                {sprint.goal}
              </Typography>
            )}
            {days && <DayStrip days={days} label={text} />}
            <Typography
              variant="caption"
              sx={{ display: "block", mt: 0.75, color: late ? "error.main" : "text.secondary", fontWeight: late ? 600 : 400 }}
            >
              {text}
            </Typography>
          </Box>
        );
      })}
    </SectionCard>
  );
};

export default ActiveSprints;
