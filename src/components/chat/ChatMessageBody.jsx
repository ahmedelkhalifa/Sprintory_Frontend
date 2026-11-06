import { Box, Link } from "@mui/material";
import { safeChatHref } from "../../utils/chat.js";

const mentionName = (node, currentNames) => {
  const kind = node.attrs?.kind === "team" ? "team" : "user";
  const match = currentNames?.find((item) => item.kind === kind && String(item.id) === String(node.attrs?.id));
  return match?.name || node.attrs?.label || "Unknown";
};

// Render only allowlisted TipTap nodes and marks as React elements. Never inject HTML from chat content.
const renderNode = (node, key, currentNames) => {
  if (!node || typeof node !== "object") return null;
  if (node.type === "hardBreak") return <br key={key} />;
  if (node.type === "horizontalRule") return <hr key={key} />;
  if (node.type === "mention") {
    return <Box component="span" key={key} className="chat-mention" title={node.attrs?.kind === "team" ? "Team" : "Project member"}>
      @{mentionName(node, currentNames)}
    </Box>;
  }
  if (node.type === "text") {
    let text = node.text || "";
    (node.marks || []).forEach((mark, index) => {
      if (mark.type === "bold") text = <strong key={index}>{text}</strong>;
      if (mark.type === "italic") text = <em key={index}>{text}</em>;
      if (mark.type === "underline") text = <u key={index}>{text}</u>;
      if (mark.type === "strike") text = <s key={index}>{text}</s>;
      if (mark.type === "code") text = <code key={index}>{text}</code>;
      if (mark.type === "link") {
        const href = safeChatHref(mark.attrs?.href);
        if (href) text = <Link key={index} href={href} target="_blank" rel="noopener noreferrer">{text}</Link>;
      }
    });
    return <span key={key}>{text}</span>;
  }
  const children = (Array.isArray(node.content) ? node.content : []).map((child, index) =>
    renderNode(child, `${key}-${index}`, currentNames));
  const common = { key };
  switch (node.type) {
    case "doc": return <Box key={key} className="chat-rich-text">{children}</Box>;
    case "paragraph": return <p {...common}>{children}</p>;
    case "heading": {
      const level = [1, 2, 3].includes(node.attrs?.level) ? node.attrs.level : 3;
      return level === 1 ? <h1 {...common}>{children}</h1> : level === 2 ? <h2 {...common}>{children}</h2> : <h3 {...common}>{children}</h3>;
    }
    case "blockquote": return <blockquote {...common}>{children}</blockquote>;
    case "bulletList": return <ul {...common}>{children}</ul>;
    case "orderedList": return <ol {...common} start={Math.max(1, Number(node.attrs?.start) || 1)}>{children}</ol>;
    case "listItem": return <li {...common}>{children}</li>;
    case "codeBlock": return <pre {...common}><code>{children}</code></pre>;
    default: return null;
  }
};

export default function ChatMessageBody({ content, mentions = [] }) {
  if (!content || content.type !== "doc") return null;
  return renderNode(content, "doc", mentions);
}
