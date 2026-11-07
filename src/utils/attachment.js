// what the backend takes (attachments-docs §3.1). The browser only checks first to save a round trip: the backend
// also reads the file's content, and it decides
export const MAX_ATTACHMENT_FILES = 5;
export const MAX_ATTACHMENT_MB = 20;
export const MAX_ATTACHMENT_BYTES = MAX_ATTACHMENT_MB * 1024 * 1024;

const KIND_EXTENSIONS = {
  pdf: ["pdf"],
  word: ["docx"],
  excel: ["xlsx"],
  powerpoint: ["pptx"],
  text: ["txt", "md", "csv"],
  image: ["png", "jpg", "jpeg", "gif", "webp"],
  zip: ["zip"],
};

export const ATTACHMENT_EXTENSIONS = Object.values(KIND_EXTENSIONS).flat();
// for the file picker
export const ATTACHMENT_ACCEPT = ATTACHMENT_EXTENSIONS.map((extension) => `.${extension}`).join(",");

// "Report.PDF" -> "pdf"; "" without an extension
export const fileExtension = (fileName) => {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
};

// which icon a file gets; the backend made sure the extension matches the content
export const attachmentKind = ({ fileName }) => {
  const extension = fileExtension(fileName);
  const found = Object.keys(KIND_EXTENSIONS).find((kind) => KIND_EXTENSIONS[kind].includes(extension));
  return found ?? "file";
};

export const ATTACHMENT_FILTERS = [
  { value: "all", label: "All" },
  { value: "images", label: "Images" },
  { value: "documents", label: "Documents" },
  { value: "other", label: "Other" },
];

const attachmentGroup = (attachment) => {
  const kind = attachmentKind(attachment);
  if (kind === "image") return "images";
  return kind === "zip" || kind === "file" ? "other" : "documents";
};

export const filterAttachments = (attachments, filter) =>
  filter === "all" ? attachments : attachments.filter((attachment) => attachmentGroup(attachment) === filter);

const COMPARE = {
  name: (a, b) => a.fileName.localeCompare(b.fileName, undefined, { sensitivity: "base", numeric: true }),
  // the id settles files uploaded together, like the backend's own order
  date: (a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt) || a.id - b.id,
  size: (a, b) => a.sizeBytes - b.sizeBytes,
};

// `by` is "name", "date" or "size"
export const sortAttachments = (attachments, { by = "date", direction = "desc" } = {}) => {
  const sign = direction === "asc" ? 1 : -1;
  return [...attachments].sort((a, b) => sign * COMPARE[by](a, b));
};

// 512 -> "512 B", 395264 -> "386 KB", 3250586 -> "3.1 MB"
export const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  const kilobytes = Math.round(bytes / 1024);
  return kilobytes < 1024 ? `${kilobytes} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};
