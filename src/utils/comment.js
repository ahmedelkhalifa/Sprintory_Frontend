// Task comments (backend comments-docs.md) come oldest first, page by page; a posted, edited or deleted comment
// replaces the loaded copy. Later lists win for the same id, and the result is in the backend's order
// (createdAt, then id), so a page loaded after posting never shows a comment twice.
export const mergeComments = (...lists) => {
  const byId = new Map();
  for (const comment of lists.flat()) byId.set(comment.id, comment);
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id);
};

// how a comment looks once deleted (the backend keeps it as a placeholder without its text)
export const deletedComment = (comment) => ({
  ...comment,
  body: null,
  mentions: [],
  deleted: true,
  deletedAt: new Date().toISOString(),
  canEdit: false,
  canDelete: false,
});
