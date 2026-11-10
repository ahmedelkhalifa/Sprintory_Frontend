import { useState } from "react";
import { Alert, Box, Button, Typography } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import DoNotDisturbOnOutlinedIcon from "@mui/icons-material/DoNotDisturbOnOutlined";
import SectionCard from "../general/SectionCard";
import RichText from "../editor/RichText";
import RichTextEditor from "../editor/RichTextEditor";
import { updateCharterScope } from "../../api/charterApi";
import { useSubmit } from "../../hooks/useSubmit";
import { CHARTER_ERROR_MESSAGES } from "../../constants/charter";
import { isScopeEmpty, scopeRequest } from "../../utils/charter";
import { richTextValue } from "../../utils/richText";

const PARTS = [
  {
    field: "inScope",
    label: "In scope",
    Icon: CheckCircleOutlineRoundedIcon,
    tone: "success.main",
    empty: "Nothing recorded as in scope yet.",
    placeholder: "What the project will deliver…",
  },
  {
    field: "outOfScope",
    label: "Out of scope",
    Icon: DoNotDisturbOnOutlinedIcon,
    tone: "error.main",
    empty: "Nothing recorded as out of scope yet.",
    placeholder: "What the project explicitly won't do…",
  },
];

const PartTitle = ({ part, id }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
    <part.Icon sx={{ fontSize: 20, color: part.tone }} aria-hidden />
    <Typography id={id} variant="subtitle1" component="h3" sx={{ fontWeight: 700 }}>
      {part.label}
    </Typography>
  </Box>
);

// In scope / Out of scope: two rich texts (TipTap, saved as JSON strings and drawn by RichText node by node,
// never as HTML, so nothing in them runs). Writing out of scope explicitly is what guards against scope creep.
// Both are saved together (the backend replaces both); each change lands in the charter history.
// No @mentions here: scope is a document, not a conversation, and mentions in it notify nobody.
const CharterScope = ({ project, charter, editable, onSaved, onNotice }) => {
  const [draft, setDraft] = useState(null); // { inScope, outOfScope } as JSON strings while editing
  const submit = useSubmit(CHARTER_ERROR_MESSAGES);

  const startEditing = () => {
    submit.clearError();
    setDraft({ inScope: charter.inScope ?? "", outOfScope: charter.outOfScope ?? "" });
  };

  const save = async () => {
    const { ok, result } = await submit.run(() => updateCharterScope(project.id, scopeRequest(draft)));
    if (!ok) return; // the draft stays, with the message under the editors
    setDraft(null);
    onNotice("Scope saved.");
    onSaved(result);
  };

  // INVALID_RICH_TEXT and every other refusal show their message under both editors; the draft stays
  const editing = draft !== null && editable;

  return (
    <SectionCard
      title="Scope"
      toolbar={
        editable &&
        !editing && (
          <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={startEditing}>
            Edit scope
          </Button>
        )
      }
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) minmax(0, 1fr)" },
          gap: { xs: 2.5, md: 3 },
          px: { xs: 2, sm: 3 },
          py: 2.5,
        }}
      >
        {PARTS.map((part) => {
          const titleId = `charter-${part.field}-title`;
          return (
            <Box key={part.field} component="section" aria-labelledby={titleId} sx={{ minWidth: 0 }}>
              <PartTitle part={part} id={titleId} />
              {editing ? (
                <RichTextEditor
                  value={charter[part.field]}
                  onChange={(doc) => setDraft((prev) => ({ ...prev, [part.field]: richTextValue(doc) }))}
                  placeholder={part.placeholder}
                  ariaLabel={part.label}
                  disabled={submit.submitting}
                  minHeight={140}
                  error={Boolean(submit.error)}
                />
              ) : isScopeEmpty(charter[part.field]) ? (
                <Typography variant="body2" color="text.secondary">
                  {part.empty}
                </Typography>
              ) : (
                <RichText value={charter[part.field]} />
              )}
            </Box>
          );
        })}
      </Box>

      {editing && (
        <Box sx={{ px: { xs: 2, sm: 3 }, pb: 2.5 }}>
          {submit.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submit.error}
            </Alert>
          )}
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button color="inherit" onClick={() => setDraft(null)} disabled={submit.submitting}>
              Cancel
            </Button>
            <Button variant="contained" onClick={save} loading={submit.submitting}>
              Save scope
            </Button>
          </Box>
        </Box>
      )}
    </SectionCard>
  );
};

export default CharterScope;
