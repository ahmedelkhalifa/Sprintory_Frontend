import { Box, Button, Divider, IconButton, Skeleton, Tooltip, Typography } from "@mui/material";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import OverviewCard from "./OverviewCard";
import UserAvatar from "../../general/UserAvatar";
import ToneChip from "../../general/ToneChip";
import { timeAgo } from "../../../utils/format";
import { placeholderActivity } from "../../../placeholders/projectOverview";

const TASK_STATUS = {
  TODO: { label: "To Do", tone: "secondary.main" },
  IN_PROGRESS: { label: "In Progress", tone: "primary.main" },
  REVIEW: { label: "In Review", tone: "warning.main" },
  DONE: { label: "Done", tone: "success.main" },
};

// one line of the feed: who did what, when, and the task's status
const ActivityItem = ({ item }) => {
  const status = TASK_STATUS[item.status];
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.75, px: { xs: 2, sm: 2.5 }, py: 1.75 }}>
      <UserAvatar user={item.person} size={40} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600 }} noWrap>
          {item.person.firstName} {item.person.lastName}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {item.verb}{" "}
          <Box component="span" sx={{ color: "text.primary" }}>
            "{item.target}"
          </Box>
          {item.suffix && ` ${item.suffix}`}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {timeAgo(item.at)}
        </Typography>
      </Box>
      <Box sx={{ display: { xs: "none", sm: "block" }, flexShrink: 0 }}>
        <ToneChip label={status.label} tone={status.tone} />
      </Box>
      <IconButton size="small" aria-label="More" disabled>
        <MoreHorizIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

// "Recent activity" card: the latest things people did in the project.
// TEMP: placeholder items until the backend has an activity feed (see src/placeholders/projectOverview.js).
const RecentActivityCard = ({ project, members, loading }) => {
  const items = members ? placeholderActivity(project, members) : [];

  return (
    <OverviewCard
      Icon={TimelineOutlinedIcon}
      title="Recent activity"
      action={
        <Tooltip title="Coming soon">
          <span>
            <Button size="small" endIcon={<ArrowForwardIcon />} disabled>
              View all
            </Button>
          </span>
        </Tooltip>
      }
    >
      {loading ? (
        <Box sx={{ p: 2.5 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={48} />
          ))}
        </Box>
      ) : items.length === 0 ? (
        <Typography color="text.secondary" sx={{ p: 4, textAlign: "center" }}>
          No activity yet.
        </Typography>
      ) : (
        items.map((item, i) => (
          <Box key={item.id}>
            {i > 0 && <Divider />}
            <ActivityItem item={item} />
          </Box>
        ))
      )}
    </OverviewCard>
  );
};

export default RecentActivityCard;
