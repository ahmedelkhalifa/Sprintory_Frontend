// Rich text is a TipTap document (backend mentions-docs.md §2). Task descriptions and comments send and return it
// as a JSON string, the chat as a JSON object. These helpers are shared by the editor and the read-only view.

export const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

// a plain text as a document, one paragraph per line (descriptions saved before 4 Nov 2026 are plain text)
const plainTextDoc = (text) => ({
  type: "doc",
  content: text.split("\n").map((line) => (line ? { type: "paragraph", content: [{ type: "text", text: line }] } : { type: "paragraph" })),
});

// whatever is stored (a JSON string, a document, an old plain text, null) as a document the editor can open
export const toDoc = (value) => {
  if (!value) return EMPTY_DOC;
  if (typeof value === "object") return value.type === "doc" ? value : EMPTY_DOC;
  try {
    const doc = JSON.parse(value);
    if (doc?.type === "doc") return doc;
  } catch {
    // not JSON: an old plain-text description
  }
  return plainTextDoc(String(value));
};

const BLOCKS = new Set(["paragraph", "heading", "blockquote", "codeBlock", "listItem", "bulletList", "orderedList"]);

// the document as plain text: mentions as "@label", blocks on their own lines (like the backend's plain text)
export const docText = (doc) => {
  const visit = (node) => {
    if (!node || typeof node !== "object") return "";
    if (node.type === "text") return node.text || "";
    if (node.type === "mention") return `@${node.attrs?.label || node.attrs?.id || ""}`;
    if (node.type === "hardBreak") return "\n";
    const inner = (node.content || []).map(visit).join("");
    return BLOCKS.has(node.type) ? `${inner}\n` : inner;
  };
  return visit(doc).replace(/\n+$/, "");
};

// no characters other than spaces and no mention: the backend treats it as empty
export const isEmptyDoc = (doc) => !docText(doc).trim();

// what a form keeps and sends: "" for an empty document (no description), else the JSON string
export const richTextValue = (doc) => (isEmptyDoc(doc) ? "" : JSON.stringify(doc));

// only http, https and mailto links are allowed (mentions-docs §2.2); anything else is not a link
export const safeHref = (href) => {
  if (typeof href !== "string" || !href.trim() || href.length > 2000) return null;
  try {
    const url = new URL(href.trim());
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
};

// a text the backend refused: not a valid document, too long, or mentioning someone outside the project.
// The message says which and is shown next to the editor; the draft stays.
export const isRichTextError = (err) => ["INVALID_RICH_TEXT", "INVALID_MENTION"].includes(err?.response?.data?.code);

// the name to show for a mention node: the current one from the response's `mentions`, else the stored label
export const mentionName = (node, mentions = []) => {
  const kind = node.attrs?.kind === "team" ? "team" : "user";
  const match = mentions.find((item) => item.kind === kind && String(item.id) === String(node.attrs?.id));
  return match?.name || node.attrs?.label || "unknown";
};
