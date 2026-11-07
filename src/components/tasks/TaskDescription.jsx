import { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import RichText from "../editor/RichText";
import RichTextEditor from "../editor/RichTextEditor";
import { richTextValue } from "../../utils/richText";

// A task's or a subtask's description on its page: rich text (TipTap JSON with @mentions) until clicked, then the
// editor with Save and Cancel. `onSave(value)` answers { ok }; a failed save keeps the editor open, with `error`
// (e.g. the backend's INVALID_MENTION message) under it. `onEdit` clears an old error when editing starts.
const TaskDescription = ({ description, projectId, canEdit, saving, error, onEdit, onSave }) => {
  const [draft, setDraft] = useState(null); // null: showing the description

  // a click on a link in the description opens the link, not the editor
  const edit = (e) => {
    if (!canEdit || e?.target.closest?.("a")) return;
    onEdit();
    setDraft(description ?? "");
  };

  const save = async () => {
    const { ok } = await onSave(draft);
    if (ok) setDraft(null);
  };

  if (draft !== null) {
    return (
      <Box>
        <RichTextEditor
          value={description}
          onChange={(doc) => setDraft(richTextValue(doc))}
          onSubmit={save}
          projectId={projectId}
          placeholder="Add a description... Type @ to mention someone"
          autoFocus
          error={Boolean(error)}
          ariaLabel="Description"
          minHeight={140}
        />
        {error && (
          <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
            {error}
          </Typography>
        )}
        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
          <Button variant="contained" size="small" loading={saving} onClick={save}>
            Save
          </Button>
          <Button size="small" color="inherit" disabled={saving} onClick={() => setDraft(null)}>
            Cancel
          </Button>
        </Box>
      </Box>
    );
  }
  return (
    <Box
      role={canEdit ? "button" : undefined}
      tabIndex={canEdit ? 0 : undefined}
      aria-label={canEdit ? "Edit the description" : undefined}
      onClick={edit}
      onKeyDown={(e) => e.key === "Enter" && e.target === e.currentTarget && edit(e)}
      sx={{
        borderRadius: 1,
        px: 1,
        py: 0.5,
        mx: -1,
        minHeight: 40,
        cursor: canEdit ? "text" : "default",
        "&:hover": canEdit ? { bgcolor: "action.hover" } : undefined,
      }}
    >
      {description ? (
        <RichText value={description} />
      ) : (
        <Typography color="text.disabled">{canEdit ? "Add a description..." : "No description"}</Typography>
      )}
    </Box>
  );
};

export default TaskDescription;
