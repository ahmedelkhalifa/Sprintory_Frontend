import { alpha } from "@mui/material/styles";

// The look of rich text, shared by the editor and the read-only RichText, from theme tokens (so it follows dark mode).
// Mentions carry the class "mention" in both.
export const richTextSx = (theme) => ({
  overflowWrap: "anywhere",
  lineHeight: 1.6,
  "& p": { m: 0, mb: 0.75 },
  "& p:last-child": { mb: 0 },
  "& h1, & h2, & h3": { mt: 1.5, mb: 0.5, lineHeight: 1.3, fontWeight: 600 },
  "& h1": { fontSize: "1.35rem" },
  "& h2": { fontSize: "1.2rem" },
  "& h3": { fontSize: "1.05rem" },
  "& ul, & ol": { pl: 3, my: 0.75 },
  "& li p": { mb: 0.25 },
  "& blockquote": { m: 0, my: 1, pl: 1.5, borderLeft: 3, borderColor: "divider", color: "text.secondary" },
  "& code": { px: 0.5, borderRadius: 0.5, bgcolor: "action.selected", fontFamily: "monospace", fontSize: "0.9em" },
  "& pre": { p: 1.5, my: 1, borderRadius: 1, bgcolor: "action.hover", overflowX: "auto", whiteSpace: "pre-wrap" },
  "& pre code": { p: 0, bgcolor: "transparent" },
  "& hr": { border: 0, borderTop: 1, borderColor: "divider", my: 1.5 },
  "& a": { color: "navActive.text" },
  "& .mention": {
    px: 0.5,
    borderRadius: 0.5,
    fontWeight: 600,
    color: "navActive.text",
    bgcolor: alpha(theme.palette.primary.main, 0.12),
  },
});
