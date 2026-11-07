import { useRef, useState } from "react";
import { Alert, Box, Button, IconButton, Tooltip, Typography } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import ConfirmDialog from "../general/ConfirmDialog";
import LoadState from "../general/LoadState";
import UserAvatar from "../general/UserAvatar";
import RichText from "../editor/RichText";
import RichTextEditor from "../editor/RichTextEditor";
import { createComment, deleteComment, getComments, updateComment } from "../../api/commentsApi";
import { useAsync } from "../../hooks/useAsync";
import { useSubmit } from "../../hooks/useSubmit";
import { TASK_ERROR_MESSAGES } from "../../constants/tasks";
import { errorMessage } from "../../utils/apiError";
import { deletedComment, mergeComments } from "../../utils/comment";
import { formatDate, timeAgo } from "../../utils/format";
import { isRichTextError, richTextValue } from "../../utils/richText";

const PAGE_SIZE = 20;
// "Comment not found." after someone else deleted it meanwhile
const COMMENT_MESSAGES = { ...TASK_ERROR_MESSAGES, RESOURCE_NOT_FOUND: "This comment no longer exists." };

// a refused text keeps the draft and shows the backend's message (it says what is wrong); anything else the usual text
const saveError = (err, fallback) => (isRichTextError(err) ? err.response.data.message : errorMessage(err, fallback, COMMENT_MESSAGES));

// Writing a comment, or editing one: the editor, the error and the buttons. `initial` is the comment's body when
// editing. `onSave(body)` answers an error text or nothing; the box empties after a new comment is posted.
const CommentForm = ({ projectId, initial = "", saveLabel, autoFocus, onSave, onCancel }) => {
  const editor = useRef(null);
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!draft || saving) return;
    setSaving(true);
    const failure = await onSave(draft);
    setSaving(false);
    setError(failure ?? "");
    if (!failure && !onCancel) {
      editor.current?.clear();
      setDraft("");
    }
  };

  return (
    <Box>
      <RichTextEditor
        ref={editor}
        value={initial}
        onChange={(doc) => {
          setDraft(richTextValue(doc));
          setError("");
        }}
        onSubmit={save}
        projectId={projectId}
        placeholder="Add a comment... Type @ to mention someone"
        autoFocus={autoFocus}
        error={Boolean(error)}
        ariaLabel="Comment"
        minHeight={72}
      />
      {error && (
        <Typography variant="caption" color="error" role="alert" sx={{ display: "block", mt: 0.5 }}>
          {error}
        </Typography>
      )}
      <Box sx={{ display: "flex", gap: 1, mt: 1, justifyContent: "flex-end" }}>
        {onCancel && (
          <Button size="small" color="inherit" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
        <Button size="small" variant="contained" onClick={save} loading={saving} disabled={!draft}>
          {saveLabel}
        </Button>
      </Box>
    </Box>
  );
};

// one comment: the author, when, "(edited)", the text, and Edit / Delete when the backend allows them
const Comment = ({ comment, members, projectId, editing, onEdit, onSaveEdit, onCancelEdit, onDelete }) => {
  const name = comment.author?.name || "Deleted user";
  // the author's name comes with the comment; a loaded member only adds the photo
  const member = members.find((m) => m.userId === comment.author?.id);
  const avatarUser = member ?? { userId: comment.author?.id, firstName: name };

  return (
    <Box component="li" sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
      <UserAvatar user={avatarUser} size={30} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minHeight: 30, flexWrap: "wrap" }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {name}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            title={`${formatDate(comment.createdAt)} ${new Date(comment.createdAt).toLocaleTimeString()}`}
          >
            {timeAgo(comment.createdAt)}
            {!comment.deleted && comment.editedAt && " (edited)"}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          {!editing && comment.canEdit && (
            <Tooltip title="Edit">
              <IconButton size="small" aria-label="Edit comment" onClick={onEdit}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {!editing && comment.canDelete && (
            <Tooltip title="Delete">
              <IconButton size="small" aria-label="Delete comment" onClick={onDelete}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        {comment.deleted ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
            Comment deleted
          </Typography>
        ) : editing ? (
          <CommentForm
            projectId={projectId}
            initial={comment.body}
            saveLabel="Save"
            autoFocus
            onSave={onSaveEdit}
            onCancel={onCancelEdit}
          />
        ) : (
          <RichText value={comment.body} mentions={comment.mentions} sx={{ typography: "body2" }} />
        )}
      </Box>
    </Box>
  );
};

// A task's comments (R10, backend comments-docs.md), oldest first, PAGE_SIZE at a time with "Load more" at the
// bottom, then the box for a new one. Deleted comments stay as "Comment deleted". `canComment` = COMMENT and
// nothing archived (Viewers only read); Edit and Delete follow each comment's `canEdit` / `canDelete`.
// `members` add photos to the names. Subtasks have their own comments through the same endpoints.
const TaskComments = ({ project, taskId, members, canComment }) => {
  const first = useAsync(
    (signal) => getComments(project.id, taskId, { page: 0, size: PAGE_SIZE }, signal),
    [project.id, taskId],
    { fallback: "Couldn't load the comments. Please try again.", messages: COMMENT_MESSAGES },
  );
  // the pages loaded with "Load more"
  const [more, setMore] = useState({ items: [], total: 0, loading: false, error: "" });
  // comments posted, edited or deleted here: they replace the loaded copies
  const [local, setLocal] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const remove = useSubmit(COMMENT_MESSAGES);

  if (!first.data) return <LoadState loading={!first.error} error={first.error} onRetry={first.reload} rows={2} />;

  const loaded = mergeComments(first.data.content, more.items);
  const comments = mergeComments(loaded, local);
  const total = Math.max(first.data.totalElements, more.total);
  const hasMore = loaded.length < total;

  const keep = (comment) => setLocal((prev) => [...prev.filter((c) => c.id !== comment.id), comment]);

  const loadMore = async () => {
    setMore((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      // the page the next unseen comment is on; comments already shown are dropped by mergeComments
      const page = Math.floor(loaded.length / PAGE_SIZE);
      const data = await getComments(project.id, taskId, { page, size: PAGE_SIZE });
      setMore((prev) => ({ items: [...prev.items, ...data.content], total: data.totalElements, loading: false, error: "" }));
    } catch (err) {
      const error = errorMessage(err, "Couldn't load more comments. Please try again.", COMMENT_MESSAGES);
      setMore((prev) => ({ ...prev, loading: false, error }));
    }
  };

  const post = async (body) => {
    try {
      keep(await createComment(project.id, taskId, body));
      return null;
    } catch (err) {
      return saveError(err, "Couldn't post the comment. Please try again.");
    }
  };

  const saveEdit = (comment) => async (body) => {
    if (body === comment.body) {
      setEditingId(null);
      return null;
    }
    try {
      keep(await updateComment(project.id, taskId, comment.id, body));
      setEditingId(null);
      return null;
    } catch (err) {
      return saveError(err, "Couldn't save the comment. Please try again.");
    }
  };

  const confirmDelete = async () => {
    const { ok } = await remove.run(() => deleteComment(project.id, taskId, deleting.id));
    if (!ok) return;
    keep(deletedComment(deleting));
    setDeleting(null);
  };

  return (
    <Box>
      {comments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No comments yet.
        </Typography>
      ) : (
        <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, mb: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
          {comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              members={members}
              projectId={project.id}
              editing={editingId === comment.id}
              onEdit={() => setEditingId(comment.id)}
              onSaveEdit={saveEdit(comment)}
              onCancelEdit={() => setEditingId(null)}
              onDelete={() => setDeleting(comment)}
            />
          ))}
        </Box>
      )}

      {more.error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={loadMore}>
              Try again
            </Button>
          }
        >
          {more.error}
        </Alert>
      )}
      {hasMore && !more.error && (
        <Button size="small" onClick={loadMore} loading={more.loading} sx={{ mb: 2 }}>
          Load more
        </Button>
      )}

      {canComment && <CommentForm projectId={project.id} saveLabel="Comment" onSave={post} />}

      {deleting && (
        <ConfirmDialog
          title="Delete this comment?"
          message="It will show as “Comment deleted” for everyone."
          confirmLabel="Delete comment"
          tone="danger"
          loading={remove.submitting}
          error={remove.error}
          onConfirm={confirmDelete}
          onClose={() => {
            setDeleting(null);
            remove.clearError();
          }}
        />
      )}
    </Box>
  );
};

export default TaskComments;
