import { useRef, useState } from "react";
import {
  Alert,
  Box,
  ButtonBase,
  Collapse,
  IconButton,
  LinearProgress,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AttachmentTable from "./AttachmentTable";
import AttachmentViewer from "./AttachmentViewer";
import ConfirmDialog from "../../general/ConfirmDialog";
import LoadState from "../../general/LoadState";
import { deleteAttachment, downloadAttachment, listAttachments, uploadAttachments } from "../../../api/attachmentsApi";
import { useAsync } from "../../../hooks/useAsync";
import { useSubmit } from "../../../hooks/useSubmit";
import { ATTACHMENT_ERROR_MESSAGES, TASK_ERROR_MESSAGES } from "../../../constants/tasks";
import { errorCode, errorMessage } from "../../../utils/apiError";
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_FILTERS,
  MAX_ATTACHMENT_FILES,
  MAX_ATTACHMENT_MB,
  filterAttachments,
} from "../../../utils/attachment";
import { validateAttachments } from "../../../utils/validation";

// the browser saves a Blob through a temporary link
const saveFile = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  // a moment later: some browsers cancel the save if the url goes at once
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// only files count as a drop, not e.g. selected text
const carriesFiles = (event) => event.dataTransfer.types.includes("Files");

// A task's or a subtask's "Attachments" section (R25, backend attachments-docs.md), like Jira's. Everyone who sees
// the task can list and download; `canEdit` adds the + button and dropping files on the section, and Delete where
// the file's `canDelete` allows it. After a change the list reloads, because the backend renames compressed images,
// and `onChanged` lets the page refresh the history. A subtask's files are its own (`taskId` = its id).
const TaskAttachments = ({ project, taskId, canEdit, onChanged }) => {
  const state = useAsync((signal) => listAttachments(project.id, taskId, signal), [project.id, taskId], {
    fallback: "Couldn't load the attachments. Please try again.",
    messages: TASK_ERROR_MESSAGES,
  });
  const [open, setOpen] = useState(true);
  const [filter, setFilter] = useState("all");
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0); // the share of the upload sent, from 0 to 1
  const [problem, setProblem] = useState(""); // files refused in the browser, or a failed download
  const [downloadingId, setDownloadingId] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const upload = useSubmit(TASK_ERROR_MESSAGES);
  const remove = useSubmit(ATTACHMENT_ERROR_MESSAGES);
  const fileInput = useRef(null);

  const attachments = state.data ?? [];
  const shown = filterAttachments(attachments, filter);
  const error = problem || upload.error;

  const changed = () => {
    state.reload();
    onChanged();
  };

  const clearError = () => {
    setProblem("");
    upload.clearError();
  };

  const send = async (files) => {
    if (upload.submitting) return;
    clearError();
    const found = validateAttachments(files);
    if (found.files) {
      setProblem(found.files);
      return;
    }
    setOpen(true);
    setFilter("all"); // what was just added must be in view
    setProgress(0);
    const { ok } = await upload.run(() => uploadAttachments(project.id, taskId, files, setProgress));
    if (ok) changed();
  };

  const download = async (attachment) => {
    setProblem("");
    setDownloadingId(attachment.id);
    try {
      saveFile(await downloadAttachment(attachment.id), attachment.fileName);
    } catch (err) {
      setViewing(null); // the message is on the page, behind the viewer
      setProblem(errorMessage(err, "Couldn't download the file. Please try again.", ATTACHMENT_ERROR_MESSAGES));
      if (errorCode(err) === "RESOURCE_NOT_FOUND") state.reload();
    } finally {
      setDownloadingId(null);
    }
  };

  const confirmDelete = async () => {
    const { ok, error: failure } = await remove.run(() => deleteAttachment(deleting.id));
    // already deleted by someone else: what the user asked for has happened
    if (!ok && errorCode(failure) !== "RESOURCE_NOT_FOUND") return;
    remove.clearError();
    setDeleting(null);
    changed();
  };

  const dropProps = canEdit && {
    onDragOver: (event) => {
      if (!carriesFiles(event)) return;
      event.preventDefault(); // or the browser opens the file instead of dropping it here
      setDragging(true);
    },
    onDragLeave: (event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false);
    },
    onDrop: (event) => {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      setDragging(false);
      send([...event.dataTransfer.files]);
    },
  };

  return (
    <Box
      {...dropProps}
      sx={{
        mt: 4,
        borderRadius: 1,
        outline: dragging ? 2 : 0,
        outlineStyle: "dashed",
        outlineColor: "primary.main",
        outlineOffset: 6,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1, mb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexGrow: 1 }}>
          <IconButton
            size="small"
            aria-label={open ? "Hide attachments" : "Show attachments"}
            aria-expanded={open}
            onClick={() => setOpen((prev) => !prev)}
            sx={{ ml: -0.5 }}
          >
            <ExpandMoreIcon fontSize="small" sx={{ transform: open ? "none" : "rotate(-90deg)", transition: "transform 150ms" }} />
          </IconButton>
          <Typography sx={{ fontWeight: 600 }}>Attachments</Typography>
          {attachments.length > 0 && (
            <Box
              component="span"
              sx={{ ml: 0.5, px: 0.75, borderRadius: 1, bgcolor: "action.selected", fontSize: 12, fontWeight: 600, lineHeight: "20px" }}
            >
              {attachments.length}
            </Box>
          )}
        </Box>
        {attachments.length > 0 && (
          <ToggleButtonGroup
            exclusive
            size="small"
            value={filter}
            aria-label="Show"
            onChange={(_, value) => value && setFilter(value)}
          >
            {ATTACHMENT_FILTERS.map(({ value, label }) => (
              <ToggleButton key={value} value={value} sx={{ py: 0.25, px: 1, textTransform: "none", fontSize: 13 }}>
                {label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}
        {canEdit && (
          <Tooltip title="Attach files">
            <span>
              <IconButton
                size="small"
                aria-label="Attach files"
                disabled={upload.submitting}
                onClick={() => fileInput.current.click()}
              >
                <AddRoundedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>

      {canEdit && (
        <input
          ref={fileInput}
          type="file"
          multiple
          hidden
          accept={ATTACHMENT_ACCEPT}
          onChange={(event) => {
            send([...event.target.files]);
            event.target.value = ""; // so the same file can be picked again after a refusal
          }}
        />
      )}

      <Collapse in={open}>
        {upload.submitting && (
          <Box sx={{ mb: 1.5 }} role="status">
            <Typography variant="caption" color="text.secondary">
              Uploading...
            </Typography>
            {/* once everything is sent the backend still checks and compresses the files */}
            <LinearProgress
              variant={progress < 1 ? "determinate" : "indeterminate"}
              value={progress * 100}
              aria-label="Uploading files"
            />
          </Box>
        )}

        {error && (
          <Alert severity="error" onClose={clearError} sx={{ mb: 1.5 }}>
            {error}
          </Alert>
        )}

        {!state.data ? (
          <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
            <LoadState loading={!state.error} error={state.error} onRetry={state.reload} rows={2} />
          </Paper>
        ) : attachments.length === 0 ? (
          canEdit ? (
            <ButtonBase
              onClick={() => fileInput.current.click()}
              disabled={upload.submitting}
              sx={{
                display: "block",
                width: "100%",
                p: 2,
                textAlign: "center",
                border: 1,
                borderStyle: "dashed",
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <Typography variant="body2">
                Drop files here, or{" "}
                <Box component="span" sx={{ color: "navActive.text", fontWeight: 600 }}>
                  browse
                </Box>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Up to {MAX_ATTACHMENT_FILES} files at once, {MAX_ATTACHMENT_MB} MB each
              </Typography>
            </ButtonBase>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No attachments.
            </Typography>
          )
        ) : shown.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No files of this kind.
          </Typography>
        ) : (
          <AttachmentTable
            attachments={shown}
            canEdit={canEdit}
            downloadingId={downloadingId}
            onView={setViewing}
            onDownload={download}
            onDelete={setDeleting}
          />
        )}
      </Collapse>

      {viewing && (
        <AttachmentViewer
          attachment={viewing}
          downloading={downloadingId === viewing.id}
          onDownload={() => download(viewing)}
          onClose={() => setViewing(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete this attachment?"
          message={`"${deleting.fileName}" will be removed from this task. This can't be undone.`}
          confirmLabel="Delete attachment"
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

export default TaskAttachments;
