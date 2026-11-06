import { useState } from "react";
import { Alert, Box, Button, Paper, Stack } from "@mui/material";
import { useAuth } from "../../context/AuthContext.js";
import { useProjectAccess, useWorkspaceAccess } from "../../hooks/useResourceAccess.js";
import { useProjectChat } from "../../hooks/useProjectChat.js";
import { canWriteChat } from "../../utils/chat.js";
import ChatMessageList from "../../components/chat/ChatMessageList.jsx";
import ChatComposer from "../../components/chat/ChatComposer.jsx";
import "../../components/chat/chat.css";

export default function ProjectChatPage() {
  const { project } = useProjectAccess();
  const { workspace } = useWorkspaceAccess();
  return <ProjectChatPanel project={project} workspace={workspace} />;
}

// Shared between a project's Chat tab and the workspace Chats page.
// Remount the session on project switch so messages and socket subscriptions never leak between projects.
export function ProjectChatPanel({ project, workspace, embedded = false }) {
  return <ProjectChatSession key={project.id} project={project} workspace={workspace} embedded={embedded} />;
}

function ProjectChatSession({ project, workspace, embedded }) {
  const { user } = useAuth();
  const chat = useProjectChat(project.id);
  const [editing, setEditing] = useState(null);
  const [actionError, setActionError] = useState("");
  const canWrite = canWriteChat(project, workspace);

  const action = (callback) => {
    try { callback(); setActionError(""); }
    catch (err) { setActionError(err.message || "Could not update chat message."); }
  };

  return <Stack spacing={1} sx={embedded ? {
    // The workspace chat hub owns the available height; keep messages and editor inside it.
    height: "100%", minHeight: 0,
  } : {
    height: { xs: "auto", md: "calc(100dvh - 315px)" },
    minHeight: { md: 420 },
  }}>
    {chat.status !== "connected" && chat.status !== "denied" &&
      <Alert severity="info" action={<Button color="inherit" size="small" onClick={chat.retry}>Retry</Button>}>
        {chat.status === "reconnecting" ? "Reconnecting to chat…" : "Connecting to chat…"}
      </Alert>}
    {chat.error && <Alert severity={chat.status === "denied" ? "error" : "warning"} action={<Button color="inherit" size="small" onClick={chat.retry}>Retry</Button>}>{chat.error}</Alert>}
    {actionError && <Alert severity="error" onClose={() => setActionError("")}>{actionError}</Alert>}

    {chat.status === "denied" ? <Alert severity="error">You no longer have access to this project's chat.</Alert> :
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", flex: "1 1 auto", minHeight: { xs: 230, md: 160 }, display: "flex", flexDirection: "column" }}>
        <ChatMessageList messages={chat.messages} project={project} workspace={workspace} userId={user?.id}
          loading={chat.loading} loadingOlder={chat.loadingOlder} hasMore={chat.hasMore} onLoadOlder={chat.loadOlder}
          editingId={editing?.id} onEdit={(message) => setEditing(message)}
          onDelete={(id) => action(() => { chat.deleteMessage(id); if (editing?.id === id) setEditing(null); })} />
      </Paper>}

    {chat.status !== "denied" && <Box sx={{ flexShrink: 0 }}>
      {!canWrite && <Alert severity="info" sx={{ mb: 1 }}>You can read this chat but cannot send messages.</Alert>}
      <ChatComposer key={editing?.id ?? "new"} projectId={project.id} editMessage={editing}
        disabled={!canWrite} status={chat.status} onSend={(content) => chat.sendMessage(content)}
        onEdit={(id, content) => chat.editMessage(id, content)} onCancel={() => setEditing(null)} />
    </Box>}
  </Stack>;
}
