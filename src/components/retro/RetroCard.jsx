import { useState } from "react";
import { Box, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import UserAvatar from "../general/UserAvatar";
import RichText from "../editor/RichText";
import RetroCardForm from "./RetroCardForm";
import { formatDate, timeAgo } from "../../utils/format";

const votesText = (count) => `${count} ${count === 1 ? "vote" : "votes"}`;

// One card: who wrote it (retros aren't anonymous), when, the text and how many votes it has. Edit and Delete follow
// the backend's `canEdit` / `canDelete`. `onEdit(itemId, body)` answers an error text or null; `onDelete(item)` asks
// first.
const RetroCard = ({ item, projectId, onEdit, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const name = item.author?.name || "Deleted user";

  const saveEdit = async (body) => {
    const failure = body === item.body ? null : await onEdit(item.id, body);
    if (!failure) setEditing(false);
    return failure;
  };

  return (
    <Paper component="li" elevation={0} sx={{ p: 1.5, border: 1, borderColor: "divider", borderRadius: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, minHeight: 30 }}>
        <UserAvatar user={{ userId: item.author?.id, firstName: name }} size={24} />
        <Typography variant="subtitle2" noWrap title={name} sx={{ minWidth: 0 }}>
          {name}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          title={`${formatDate(item.createdAt)} ${new Date(item.createdAt).toLocaleTimeString()}`}
          sx={{ flexShrink: 0, flexGrow: 1 }}
        >
          {timeAgo(item.createdAt)}
          {item.editedAt && " (edited)"}
        </Typography>
        {!editing && item.canEdit && (
          <Tooltip title="Edit">
            <IconButton size="small" aria-label="Edit card" onClick={() => setEditing(true)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {!editing && item.canDelete && (
          <Tooltip title="Delete">
            <IconButton size="small" aria-label="Delete card" onClick={() => onDelete(item)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      {editing ? (
        <RetroCardForm
          projectId={projectId}
          initial={item.body}
          saveLabel="Save"
          ariaLabel="Card text"
          locked={!item.canEdit}
          onSave={saveEdit}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <RichText value={item.body} mentions={item.mentions} sx={{ typography: "body2" }} />
      )}
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
        {votesText(item.voteCount)}
      </Typography>
    </Paper>
  );
};

export default RetroCard;
