import { useEffect, useLayoutEffect, useRef } from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import ChatMessage from "./ChatMessage";
import { canDeleteChatMessage, canEditChatMessage } from "../../utils/chat";

const NEAR_BOTTOM_PX = 90;

// The scrolling list of messages, oldest at the top. It follows new messages while the reader is at the bottom,
// and keeps the reader's place when older ones load above ("Load older messages").
const ChatMessageList = ({ messages, project, workspace, userId, hasMore, loading, loadingOlder, onLoadOlder, editingId, onEdit, onDelete }) => {
  const listRef = useRef(null);
  const anchor = useRef(null); // the scroll position before older messages were added
  const nearBottom = useRef(true);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (anchor.current) {
      list.scrollTop = list.scrollHeight - anchor.current.height + anchor.current.top;
      anchor.current = null;
    } else if (nearBottom.current) {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages]);

  // a failed older page doesn't change the messages: drop the stale anchor
  useEffect(() => {
    if (!loadingOlder) anchor.current = null;
  }, [loadingOlder]);

  const loadOlder = () => {
    const list = listRef.current;
    if (list) anchor.current = { height: list.scrollHeight, top: list.scrollTop };
    onLoadOlder();
  };

  return (
    <Box
      ref={listRef}
      onScroll={(e) => {
        const list = e.currentTarget;
        nearBottom.current = list.scrollHeight - list.scrollTop - list.clientHeight < NEAR_BOTTOM_PX;
      }}
      sx={{ flex: "1 1 0", minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", p: 1, display: "flex", flexDirection: "column" }}
    >
      {hasMore && !loading && (
        <Button size="small" onClick={loadOlder} loading={loadingOlder} sx={{ alignSelf: "center", mb: 1 }}>
          Load older messages
        </Button>
      )}
      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", flex: 1, py: 6 }}>
          <CircularProgress size={26} />
        </Box>
      ) : messages.length === 0 ? (
        <Box sx={{ display: "grid", placeItems: "center", flex: 1, px: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No messages yet. Say hello!
          </Typography>
        </Box>
      ) : (
        <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, mt: "auto" }}>
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              own={Number(message.authorId) === Number(userId)}
              canEdit={canEditChatMessage(message, project, workspace, userId)}
              canDelete={canDeleteChatMessage(message, project, workspace, userId)}
              editing={editingId === message.id}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ChatMessageList;
