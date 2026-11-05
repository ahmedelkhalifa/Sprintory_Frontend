import { Box, Tooltip, Typography } from "@mui/material";
import ToneChip from "../general/ToneChip";
import AuditChanges from "./AuditChanges";
import { AUDIT_AREAS } from "../../constants/audit";
import { auditSentence, formatLocal, formatUtc, sentenceCoversChanges } from "../../utils/audit";

// The log on a phone, newest first: one sentence per entry instead of the wide table ("Ada changed Linus's roles
// in "Mobile App" from Member to Project Manager"), then the time (local, the UTC time in the tooltip), the area
// and the project. Names are the ones stored in the entry and nothing links to a target, like the table.
// Read-only: no edit or delete controls, the API has none.
const AuditLogCards = ({ entries }) => (
  <Box component="ul" sx={{ m: 0, p: 0, listStyle: "none" }}>
    {entries.map((entry) => (
      <Box
        component="li"
        key={entry.id}
        sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider", "&:last-child": { borderBottom: 0 } }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: "anywhere" }}>
          {auditSentence(entry)}
        </Typography>

        {!sentenceCoversChanges(entry.action) && (
          <Box sx={{ mt: 0.75 }}>
            <AuditChanges entry={entry} />
          </Box>
        )}

        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mt: 0.75 }}>
          <Typography variant="caption" color="text.secondary">
            <Tooltip title={formatUtc(entry.occurredAt)}>
              <time dateTime={entry.occurredAt}>{formatLocal(entry.occurredAt)}</time>
            </Tooltip>
            {" · "}
            {AUDIT_AREAS[entry.area] ?? entry.area}
          </Typography>
          {entry.project && <ToneChip label={entry.project.name} tone="primary.main" />}
        </Box>
      </Box>
    ))}
  </Box>
);

export default AuditLogCards;
