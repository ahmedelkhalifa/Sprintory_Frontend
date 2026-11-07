import { useState } from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import ConfirmDialog from "../general/ConfirmDialog";
import UserAvatar from "../general/UserAvatar";
import RichText from "../editor/RichText";
import { formatDate, timeAgo } from "../../utils/format";

// One chat message: the author, when, "(edited)", the text (or "Message deleted"), and Edit / Delete when the
// caller may (`canEdit`, `canDelete`). Deleting asks first; a moderator deletes someone else's message.
const ChatMessage = ({ message, own, canEdit, canDelete, editing, onEdit, onDelete }) => {
  const [confirming, setConfirming] = useState(false);
  const author = message.authorName || "Former member";

  return (
    <Box
      component="li"
      sx={{
        display: "flex",
        gap: 1.5,
        alignItems: "flex-start",
        py: 1.25,
        px: 1.5,
        borderRadius: 1,
        bgcolor: editing ? "action.selected" : "transparent",
        "&:hover .chat-actions, &:focus-within .chat-actions": { opacity: 1 },
      }}
    >
      <UserAvatar user={{ userId: message.authorId, firstName: author }} size={32} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, flexWrap: "wrap" }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {author}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            title={`${formatDate(message.createdAt)} ${new Date(message.createdAt).toLocaleTimeString()}`}
          >
            {timeAgo(message.createdAt)}
            {!message.deleted && message.editedAt && " (edited)"}
          </Typography>
        </Box>
        {message.deleted ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
            Message deleted
          </Typography>
        ) : (
          <RichText value={message.content} mentions={message.mentions} sx={{ typography: "body2" }} />
        )}
      </Box>
      {!message.deleted && (canEdit || canDelete) && (
        // shown on hover with a mouse, always on touch screens
        <Box className="chat-actions" sx={{ display: "flex", opacity: { xs: 1, md: editing ? 1 : 0 }, transition: "opacity .15s" }}>
          {canEdit && (
            <Tooltip title="Edit">
              <IconButton size="small" aria-label="Edit message" onClick={() => onEdit(message)}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip title="Delete">
              <IconButton size="small" aria-label="Delete message" onClick={() => setConfirming(true)}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}
      {confirming && (
        <ConfirmDialog
          title="Delete this message?"
          message={
            own
              ? "It will show as “Message deleted” for everyone in the project."
              : `${author}'s message will show as “Message deleted” for everyone in the project.`
          }
          confirmLabel="Delete message"
          tone="danger"
          onConfirm={() => {
            setConfirming(false);
            onDelete(message.id);
          }}
          onClose={() => setConfirming(false)}
        />
      )}
    </Box>
  );
};

export default ChatMessage;
