import { useRef, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import RichTextEditor from "../editor/RichTextEditor";
import { RETRO_CARD_MAX, RETRO_ERROR_MESSAGES } from "../../constants/retro";
import { docText, richTextValue, toDoc } from "../../utils/richText";

// Writing a card, or editing one (`initial` is its body): the editor, a counter, the error and the buttons.
// `onSave(body)` answers an error text or null; a refused text stays in the box. After a new card the box empties,
// ready for the next one. `locked`: the card can't be saved anymore (the retro was closed meanwhile), but what was
// typed stays so it can be copied.
const RetroCardForm = ({ projectId, initial = "", saveLabel, ariaLabel, locked = false, onSave, onCancel }) => {
  const editor = useRef(null);
  const [doc, setDoc] = useState(() => toDoc(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const body = richTextValue(doc);
  const length = docText(doc).length;
  const tooLong = length > RETRO_CARD_MAX;
  const message = locked
    ? RETRO_ERROR_MESSAGES.RETRO_CLOSED
    : tooLong
      ? `A card can have at most ${RETRO_CARD_MAX.toLocaleString()} characters.`
      : error;

  const save = async () => {
    if (!body || tooLong || saving || locked) return;
    setSaving(true);
    const failure = await onSave(body);
    setSaving(false);
    setError(failure ?? "");
    if (!failure && !initial) {
      editor.current?.clear();
      editor.current?.focus();
    }
  };

  if (locked && !body) return null;

  return (
    <Box>
      <RichTextEditor
        ref={editor}
        value={initial}
        onChange={(next) => {
          setDoc(next);
          setError("");
        }}
        onSubmit={save}
        projectId={projectId}
        placeholder="Write a card... Type @ to mention someone"
        autoFocus
        error={Boolean(message)}
        ariaLabel={ariaLabel}
        minHeight={64}
      />
      <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
        <Typography variant="caption" color="error" role="alert" sx={{ flexGrow: 1 }}>
          {message}
        </Typography>
        <Typography variant="caption" color={tooLong ? "error" : "text.secondary"} sx={{ flexShrink: 0 }}>
          {length} / {RETRO_CARD_MAX}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", gap: 1, mt: 0.5, justifyContent: "flex-end" }}>
        <Button size="small" color="inherit" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        {!locked && (
          <Button size="small" variant="contained" onClick={save} loading={saving} disabled={!body || tooLong}>
            {saveLabel}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default RetroCardForm;
