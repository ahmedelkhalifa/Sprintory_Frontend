import { useState } from "react";
import { Box, Button, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import AddTaskIcon from "@mui/icons-material/AddTask";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import UserAvatar from "../general/UserAvatar";
import RichText from "../editor/RichText";
import RetroCardForm from "./RetroCardForm";
import RetroVoteButton from "./RetroVoteButton";
import { formatDate, timeAgo } from "../../utils/format";
import { votesText } from "../../utils/retro";

// One card: who wrote it (retros aren't anonymous), when, the text and its votes, as a button for whoever may vote
// (the retro's `canContribute`), and "Make action" for managers (`canManage`). Edit and Delete follow the backend's
// `canEdit` / `canDelete`. `onEdit(itemId, body)` answers an error text or null; `onDelete(item)` asks first;
// `onMakeAction(item)` opens the window.
const RetroCard = ({ item, retro, onEdit, onDelete, onVote, onMakeAction }) => {
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
          projectId={retro.projectId}
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
        {retro.canContribute ? (
          <RetroVoteButton item={item} votesLeft={retro.votesLeft} onVote={onVote} />
        ) : (
          <Typography variant="caption" color="text.secondary">
            {votesText(item.voteCount)}
          </Typography>
        )}
        {retro.canManage && !editing && (
          <Button
            size="small"
            color="inherit"
            startIcon={<AddTaskIcon />}
            onClick={() => onMakeAction(item)}
            sx={{ ml: "auto", color: "text.secondary" }}
          >
            Make action
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default RetroCard;
