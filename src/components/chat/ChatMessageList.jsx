import { useEffect, useLayoutEffect, useRef } from "react";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import ChatMessage from "./ChatMessage.jsx";

export default function ChatMessageList({ messages, project, workspace, userId, hasMore, loading, loadingOlder, onLoadOlder, editingId, onEdit, onDelete }) {
  const listRef = useRef(null);
  const preserveRef = useRef(null);
  const nearBottomRef = useRef(true);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const saved = preserveRef.current;
    if (saved) {
      list.scrollTop = list.scrollHeight - saved.height + saved.top;
      preserveRef.current = null;
    } else if (nearBottomRef.current) {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // A failed older-page request does not change messages; do not keep a stale scroll anchor.
    if (!loadingOlder) preserveRef.current = null;
  }, [loadingOlder]);

  const load = () => {
    const list = listRef.current;
    if (list) preserveRef.current = { height: list.scrollHeight, top: list.scrollTop };
    onLoadOlder();
  };
  return <Box ref={listRef} onScroll={(event) => {
    const element = event.currentTarget;
    nearBottomRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 90;
  }} sx={{ flex: "1 1 0", minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", px: { xs: .5, md: 1 }, display: "flex", flexDirection: "column" }}>
    {hasMore && !loading && <Stack alignItems="center" sx={{ p: 1 }}>
      <Button variant="text" size="small" onClick={load} disabled={loadingOlder} startIcon={loadingOlder ? <CircularProgress size={14} /> : undefined}>Load older messages</Button>
    </Stack>}
    {loading ? <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress size={26} /><Typography sx={{ mt: 1 }} color="text.secondary">Loading messages…</Typography></Stack> :
      messages.length === 0 ? <Box sx={{ flexGrow: 1, display: "grid", placeItems: "center", px: 2 }}><Typography color="text.secondary" variant="body2">No messages yet</Typography></Box> :
      <Box component="ol" sx={{ m: 0, p: 0 }}>{messages.map((message) => <ChatMessage key={message.id}
        message={message} project={project} workspace={workspace} userId={userId}
        editing={editingId === message.id} onEdit={onEdit} onDelete={onDelete} />)}</Box>}
  </Box>;
}
