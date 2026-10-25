import { Box, Typography } from "@mui/material";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import PauseCircleOutlinedIcon from "@mui/icons-material/PauseCircleOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import StatCard, { Ring, Sparkline } from "./StatCard";
import { placeholderStats } from "../../../placeholders/projectOverview";

const percent = (part, total) => (total === 0 ? 0 : Math.round((part / total) * 100));

const Percent = ({ value, tone = "text.secondary" }) => (
  <Typography variant="body2" sx={{ color: tone, fontWeight: 600 }}>
    {value}%
  </Typography>
);

// The four task statistics of a project.
// TEMP: placeholder numbers until the backend has tasks (see src/placeholders/projectOverview.js).
const ProjectStats = ({ project }) => {
  const stats = placeholderStats(project);
  const cards = [
    {
      label: "Total tasks",
      value: stats.total,
      Icon: AssignmentOutlinedIcon,
      tone: "primary.main",
      caption: (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, color: "success.main" }}>
          <TrendingUpIcon sx={{ fontSize: 16 }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {stats.totalChange}%
          </Typography>
        </Box>
      ),
      chart: <Sparkline points={stats.trend} tone="success.main" />,
    },
    {
      label: "Completed",
      value: stats.completed,
      Icon: TaskAltOutlinedIcon,
      tone: "success.main",
      caption: <Percent value={percent(stats.completed, stats.total)} />,
      chart: <Ring value={percent(stats.completed, stats.total)} tone="success.main" />,
    },
    {
      label: "In progress",
      value: stats.inProgress,
      Icon: ScheduleOutlinedIcon,
      tone: "primary.main",
      caption: <Percent value={percent(stats.inProgress, stats.total)} />,
      chart: <Ring value={percent(stats.inProgress, stats.total)} tone="primary.main" />,
    },
    {
      label: "On hold",
      value: stats.onHold,
      Icon: PauseCircleOutlinedIcon,
      tone: "warning.main",
      caption: <Percent value={percent(stats.onHold, stats.total)} />,
      chart: <Ring value={percent(stats.onHold, stats.total)} tone="warning.main" />,
    },
  ];

  return (
    <Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 2 }}>
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </Box>
      {/* made-up numbers, so nobody mistakes them for real work */}
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
        Sample numbers until tasks are available.
      </Typography>
    </Box>
  );
};

export default ProjectStats;
