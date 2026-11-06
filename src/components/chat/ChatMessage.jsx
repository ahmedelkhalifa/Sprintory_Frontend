import { useState } from "react";
import {
  Avatar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Stack, Tooltip, Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import ChatMessageBody from "./ChatMessageBody.jsx";
import { canDeleteChatMessage, canEditChatMessage } from "../../utils/chat.js";

const displayTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return Number.isNaN(d.valueOf()) ? "" : d.toLocaleString();
};

export default function ChatMessage({ message, project, workspace, userId, editing, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const own = Number(message.authorId) === Number(userId);
  const canEdit = canEditChatMessage(message, project, workspace, userId);
  const canDelete = canDeleteChatMessage(message, project, workspace, userId);
  const author = message.authorName || "Former member";
  return <Box component="li" sx={{ listStyle: "none", py: 1.5, px: 1, borderBottom: 1, borderColor: "divider", backgroundColor: editing ? "action.hover" : "transparent" }}>
    <Stack direction="row" alignItems="flex-start" spacing={1.5}>
      <Avatar sx={{ width: 32, height: 32, fontSize: 13 }}>{author.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</Avatar>
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Stack direction="row" flexWrap="wrap" alignItems="baseline" gap={1}>
          <Typography variant="body2" fontWeight={700}>{author}</Typography>
          <Typography variant="caption" color="text.secondary" title={message.createdAt}>{displayTime(message.createdAt)}</Typography>
          {!message.deleted && message.editedAt && <Typography variant="caption" color="text.secondary">(edited)</Typography>}
        </Stack>
        {message.deleted ? <Typography variant="body2" color="text.secondary" fontStyle="italic">Message deleted</Typography> :
          <ChatMessageBody content={message.content} mentions={message.mentions} />}
      </Box>
      {(canEdit || canDelete) && !message.deleted && <Stack direction="row" spacing={0}>
        {canEdit && <Tooltip title="Edit message"><IconButton aria-label={`Edit message ${message.id}`} size="small" onClick={() => onEdit(message)}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>}
        {canDelete && <Tooltip title={own ? "Delete message" : "Moderate message"}><IconButton aria-label={`Delete message ${message.id}`} size="small" onClick={() => setConfirmDelete(true)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>}
      </Stack>}
    </Stack>
    <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
      <DialogTitle>Delete message?</DialogTitle>
      <DialogContent>This will replace the message with “Message deleted” for all members.</DialogContent>
      <DialogActions>
        <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
        <Button color="error" onClick={() => { setConfirmDelete(false); onDelete(message.id); }}>Delete</Button>
      </DialogActions>
    </Dialog>
  </Box>;
}
