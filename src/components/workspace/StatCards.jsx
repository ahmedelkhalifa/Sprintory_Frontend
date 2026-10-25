import { Link as RouterLink } from "react-router-dom";
import { Box, Card, CardActionArea, Typography } from "@mui/material";
import { ChevronRight, FolderOpenOutlined, GroupsOutlined, PersonOutlined, TrendingUp } from "@mui/icons-material";

const ICONS = {
  projects: <FolderOpenOutlined />,
  teams: <GroupsOutlined />,
  members: <PersonOutlined />,
  active: <TrendingUp />,
};

const StatContent = ({ stat }) => (
  <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
    <Box
      sx={{
        width: 56,
        height: 56,
        borderRadius: 2,
        flexShrink: 0,
        bgcolor: "ai.background",
        color: "primary.main",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {ICONS[stat.key]}
    </Box>
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.1 }}>{stat.value}</Typography>
      <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
    </Box>
    {stat.to && <ChevronRight sx={{ color: "text.secondary" }} />}
  </Box>
);

// stats: [{ key, value, label, to? }]; a stat with `to` links to that page
const StatCards = ({ stats }) => {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
      {stats.map((stat) => (
        <Card key={stat.key}>
          {stat.to ? (
            <CardActionArea component={RouterLink} to={stat.to}>
              <StatContent stat={stat} />
            </CardActionArea>
          ) : (
            <StatContent stat={stat} />
          )}
        </Card>
      ))}
    </Box>
  );
};

export default StatCards;
