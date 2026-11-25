import { Box, Paper, Typography } from "@mui/material";
import UserAvatar from "../general/UserAvatar";
import RichText from "../editor/RichText";
import { formatDate, timeAgo } from "../../utils/format";

const votesText = (count) => `${count} ${count === 1 ? "vote" : "votes"}`;

// one card: who wrote it (retros aren't anonymous), when, the text and how many votes it has
const RetroCard = ({ item }) => {
  const name = item.author?.name || "Deleted user";

  return (
    <Paper component="li" elevation={0} sx={{ p: 1.5, border: 1, borderColor: "divider", borderRadius: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <UserAvatar user={{ userId: item.author?.id, firstName: name }} size={24} />
        <Typography variant="subtitle2" noWrap title={name} sx={{ minWidth: 0 }}>
          {name}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          title={`${formatDate(item.createdAt)} ${new Date(item.createdAt).toLocaleTimeString()}`}
          sx={{ flexShrink: 0 }}
        >
          {timeAgo(item.createdAt)}
          {item.editedAt && " (edited)"}
        </Typography>
      </Box>
      <RichText value={item.body} mentions={item.mentions} sx={{ typography: "body2" }} />
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
        {votesText(item.voteCount)}
      </Typography>
    </Paper>
  );
};

export default RetroCard;
