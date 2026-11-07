import { useState } from "react";
import { Alert, Box, Button, Paper } from "@mui/material";
import ChatComposer from "./ChatComposer";
import ChatMessageList from "./ChatMessageList";
import { useAuth } from "../../context/AuthContext";
import { useProjectChat } from "../../hooks/useProjectChat";
import { canOpenProjectChat, canWriteChat } from "../../utils/chat";

// one project's live chat; remounted per project, so messages and the socket never leak between projects
const ChatSession = ({ project, workspace, embedded }) => {
  const { user } = useAuth();
  const chat = useProjectChat(project.id, user?.id);
  const [editing, setEditing] = useState(null);
  const [offlineError, setOfflineError] = useState("");
  const [dismissed, setDismissed] = useState(null); // the refused delete whose message was closed
  const [seenOwn, setSeenOwn] = useState(chat.own);
  const canWrite = canWriteChat(project, workspace);

  // the edited (or deleted) message came back from the server: the edit is done
  if (chat.own !== seenOwn) {
    setSeenOwn(chat.own);
    if (editing && chat.own?.type !== "CREATED" && chat.own?.messageId === editing.id) setEditing(null);
  }

  // a refused delete (sends and edits show theirs under the composer)
  const deleteFailure = chat.failure && chat.failure.action !== "send" && chat.failure.action !== "edit" && chat.failure !== dismissed;

  const remove = (id) => {
    try {
      chat.deleteMessage(id);
      setOfflineError("");
    } catch (err) {
      setOfflineError(err.message);
    }
  };

  if (chat.status === "denied") {
    return <Alert severity="error">You no longer have access to this project's chat.</Alert>;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        ...(embedded ? { height: "100%", minHeight: 0 } : { height: { xs: "auto", md: "calc(100dvh - 315px)" }, minHeight: { md: 420 } }),
      }}
    >
      {chat.status !== "connected" && (
        <Alert severity="info" action={<Button color="inherit" size="small" onClick={chat.retry}>Retry</Button>}>
          {chat.status === "reconnecting" ? "Reconnecting to the chat..." : "Connecting to the chat..."}
        </Alert>
      )}
      {chat.error && (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={chat.retry}>Retry</Button>}>
          {chat.error}
        </Alert>
      )}
      {deleteFailure && (
        <Alert severity="error" onClose={() => setDismissed(chat.failure)}>
          {chat.failure.message}
        </Alert>
      )}
      {offlineError && (
        <Alert severity="error" onClose={() => setOfflineError("")}>
          {offlineError}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", flex: "1 1 auto", minHeight: { xs: 280, md: 160 }, display: "flex", flexDirection: "column" }}>
        <ChatMessageList
          messages={chat.messages}
          project={project}
          workspace={workspace}
          userId={user?.id}
          loading={chat.loading}
          loadingOlder={chat.loadingOlder}
          hasMore={chat.hasMore}
          onLoadOlder={chat.loadOlder}
          editingId={editing?.id}
          onEdit={setEditing}
          onDelete={(id) => {
            if (editing?.id === id) setEditing(null);
            remove(id);
          }}
        />
      </Paper>

      <Box sx={{ flexShrink: 0 }}>
        <ChatComposer
          key={editing?.id ?? "new"}
          projectId={project.id}
          editMessage={editing}
          disabled={!canWrite}
          status={chat.status}
          failure={chat.failure}
          own={chat.own}
          onSend={chat.sendMessage}
          onEdit={chat.editMessage}
          onCancel={() => setEditing(null)}
        />
      </Box>
    </Box>
  );
};

// A project's chat (backend project-chat-docs.md), in the project's Chat tab and on the workspace Chats page
// (`embedded`: that page sets the height). Members only, Viewers read; others get a short note instead.
const ProjectChatPanel = ({ project, workspace, embedded = false }) => {
  if (!canOpenProjectChat(project)) {
    return <Alert severity="info">Only the project's members can use its chat.</Alert>;
  }
  return <ChatSession key={project.id} project={project} workspace={workspace} embedded={embedded} />;
};

export default ProjectChatPanel;
