import { useState } from "react";
import { Alert, Box, Button, Typography } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import RichTextEditor from "../editor/RichTextEditor";
import { docText, isEmptyDoc } from "../../utils/richText";

const MAX_CHARS = 10000;

/**
 * The chat's message box, for a new message or (with `editMessage`) the author's edit of one.
 * A send has no answer of its own (backend project-chat-docs.md): the draft stays, locked, until the caller's
 * message arrives on the topic (`own`, then the box empties) or the server refuses it (`failure`, then its message
 * shows and the draft can be fixed). A dropped connection meanwhile unlocks it with a warning. An edit is closed by
 * the page once the edited message arrives. `status` is the connection's; `disabled` = may not write.
 */
const ChatComposer = ({ projectId, editMessage, disabled, status, failure, own, onSend, onEdit, onCancel }) => {
  const [draft, setDraft] = useState(editMessage?.content ?? null);
  const [editorKey, setEditorKey] = useState(0); // a new key empties the editor
  const [pending, setPending] = useState(null); // "send" / "edit" waiting for its answer
  const [error, setError] = useState("");
  const [seen, setSeen] = useState({ failure, own, status });

  // the answer to a pending send or edit (adjusted while rendering, as React suggests for props that change)
  if (failure !== seen.failure || own !== seen.own || status !== seen.status) {
    setSeen({ failure, own, status });
    if (pending && failure && failure !== seen.failure && failure.action === pending) {
      setPending(null);
      setError(failure.message);
    } else if (pending === "send" && own && own !== seen.own && own.type === "CREATED") {
      setPending(null);
      setDraft(null);
      setEditorKey((key) => key + 1);
    } else if (pending && status !== "connected") {
      setPending(null);
      setError("The connection dropped. Check whether your message arrived before sending it again.");
    }
  }

  const offline = status !== "connected";
  const empty = !draft || isEmptyDoc(draft);
  const tooLong = !empty && docText(draft).length > MAX_CHARS;
  const blocked = disabled || offline || empty || tooLong || Boolean(pending);

  const submit = () => {
    if (blocked) return;
    try {
      if (editMessage) onEdit(editMessage.id, draft);
      else onSend(draft);
      setPending(editMessage ? "edit" : "send");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const hint = disabled
    ? "You can read this chat but can't write in it."
    : offline
      ? "Waiting for the connection..."
      : "Type @ to mention someone · Ctrl+Enter to send";

  return (
    <Box>
      {editMessage && (
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Editing your message
        </Typography>
      )}
      <RichTextEditor
        key={editorKey}
        value={editMessage?.content}
        onChange={(doc) => {
          setDraft(doc);
          setError("");
        }}
        onSubmit={submit}
        projectId={projectId}
        placeholder={disabled ? "" : "Write a message..."}
        disabled={disabled || Boolean(pending)}
        autoFocus={Boolean(editMessage)}
        error={Boolean(error) || tooLong}
        ariaLabel={editMessage ? "Edit chat message" : "New chat message"}
        minHeight={64}
      />
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1, flexWrap: "wrap" }}>
        <Typography variant="caption" color={tooLong ? "error" : "text.secondary"} sx={{ flexGrow: 1 }}>
          {tooLong ? `A message can have at most ${MAX_CHARS.toLocaleString()} characters.` : hint}
        </Typography>
        {editMessage && (
          <Button size="small" color="inherit" onClick={onCancel} disabled={Boolean(pending)}>
            Cancel
          </Button>
        )}
        <Button
          size="small"
          variant="contained"
          startIcon={<SendIcon />}
          onClick={submit}
          loading={Boolean(pending)}
          disabled={blocked && !pending}
        >
          {editMessage ? "Save" : "Send"}
        </Button>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default ChatComposer;
