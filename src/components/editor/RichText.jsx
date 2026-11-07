import { Box, Link } from "@mui/material";
import { richTextSx } from "./richTextSx";
import { mentionName, safeHref, toDoc } from "../../utils/richText";

const HEADINGS = { 1: "h1", 2: "h2", 3: "h3" };

// one text node with its marks, innermost first
const renderText = (node, key) =>
  (node.marks || []).reduce((inner, mark, i) => {
    const markKey = `${key}-m${i}`;
    switch (mark.type) {
      case "bold":
        return <strong key={markKey}>{inner}</strong>;
      case "italic":
        return <em key={markKey}>{inner}</em>;
      case "underline":
        return <u key={markKey}>{inner}</u>;
      case "strike":
        return <s key={markKey}>{inner}</s>;
      case "code":
        return <code key={markKey}>{inner}</code>;
      case "link": {
        const href = safeHref(mark.attrs?.href);
        return href ? (
          <Link key={markKey} href={href} target="_blank" rel="noopener noreferrer nofollow">
            {inner}
          </Link>
        ) : (
          inner
        );
      }
      default:
        return inner;
    }
  }, node.text || "");

// Only the allowed nodes and marks (backend mentions-docs §2), drawn as React elements: never HTML from the text.
const renderNode = (node, key, mentions) => {
  if (!node || typeof node !== "object") return null;
  const children = () => (node.content || []).map((child, i) => renderNode(child, `${key}-${i}`, mentions));
  switch (node.type) {
    case "text":
      return <span key={key}>{renderText(node, key)}</span>;
    case "mention":
      return (
        <span key={key} className="mention" title={node.attrs?.kind === "team" ? "Team" : undefined}>
          @{mentionName(node, mentions)}
        </span>
      );
    case "hardBreak":
      return <br key={key} />;
    case "horizontalRule":
      return <hr key={key} />;
    case "paragraph":
      return <p key={key}>{children()}</p>;
    case "heading": {
      const Tag = HEADINGS[node.attrs?.level] ?? "h3";
      return <Tag key={key}>{children()}</Tag>;
    }
    case "blockquote":
      return <blockquote key={key}>{children()}</blockquote>;
    case "bulletList":
      return <ul key={key}>{children()}</ul>;
    case "orderedList":
      return (
        <ol key={key} start={Math.max(1, Number(node.attrs?.start) || 1)}>
          {children()}
        </ol>
      );
    case "listItem":
      return <li key={key}>{children()}</li>;
    case "codeBlock":
      return (
        <pre key={key}>
          <code>{children()}</code>
        </pre>
      );
    default:
      return null;
  }
};

// A stored rich text, read-only: a description, a comment or a chat message. `value` is a JSON string, a document
// or an old plain text; `mentions` (from the response) give mentioned people's and teams' current names.
const RichText = ({ value, mentions = [], sx }) => {
  const doc = toDoc(value);
  return (
    <Box sx={[(theme) => richTextSx(theme), ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}>
      {(doc.content || []).map((node, i) => renderNode(node, `n${i}`, mentions))}
    </Box>
  );
};

export default RichText;
