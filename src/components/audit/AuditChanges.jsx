import { Box, Tooltip, Typography } from "@mui/material";
import { truncateText, visibleChanges } from "../../utils/audit";

// a value in the table: long text is cut, the full text is in the tooltip
const Value = ({ text, strike = false }) => {
  const { text: shown, truncated } = truncateText(text);
  const content = (
    <Box
      component="span"
      sx={{ fontWeight: 600, ...(strike && { textDecoration: "line-through", color: "text.secondary", fontWeight: 400 }) }}
    >
      {shown}
    </Box>
  );
  return truncated ? <Tooltip title={text}>{content}</Tooltip> : content;
};

// What an entry changed, one line per change: "Roles: Member → Project Manager, Member".
// Added (nothing before) shows the new value, removed (nothing after) the old one struck through.
const AuditChanges = ({ entry }) => {
  const changes = visibleChanges(entry);
  if (changes.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        —
      </Typography>
    );
  }

  return (
    <Box component="ul" sx={{ m: 0, p: 0, listStyle: "none", display: "grid", gap: 0.5 }}>
      {changes.map((change) => (
        <Typography component="li" variant="body2" key={change.key} sx={{ overflowWrap: "anywhere" }}>
          <Box component="span" sx={{ color: "text.secondary" }}>
            {change.label}:{" "}
          </Box>
          {change.kind === "changed" && (
            <>
              <Value text={change.oldText} /> → <Value text={change.newText} />
            </>
          )}
          {change.kind === "added" && (
            <>
              <Value text={change.newText} />
              <Box component="span" sx={{ color: "text.secondary" }}>
                {" "}
                (added)
              </Box>
            </>
          )}
          {change.kind === "removed" && (
            <>
              <Value text={change.oldText} strike />
              <Box component="span" sx={{ color: "text.secondary" }}>
                {" "}
                (removed)
              </Box>
            </>
          )}
        </Typography>
      ))}
    </Box>
  );
};

export default AuditChanges;
