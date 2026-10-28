export const ROLE_LABEL = { WORKSPACE_ADMIN: "Admin", WORKSPACE_MEMBER: "Member" };

// role is per workspace: the same user can be admin in one and member in another
export const isWorkspaceAdmin = (workspace) => workspace?.role === "WORKSPACE_ADMIN";

// an archived workspace is read-only until an admin restores it
export const isWorkspaceArchived = (workspace) => Boolean(workspace?.archivedAt);

// ids in the url are user input: only accept positive whole numbers
export const parseWorkspaceId = (value) => {
  if (!/^[1-9]\d*$/.test(String(value ?? ""))) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
};

// browser urls name a workspace by its slug, which never changes (not even on rename);
// API calls keep using the numeric id
export const workspacePath = (workspace) => `/workspaces/${workspace.slug}`;

// the workspace a url segment names, from the user's own list: its slug, or its numeric id for links
// from before slugs. `bySlug` is false for an id match, so the caller can redirect to the slug url
export const findWorkspace = (workspaces, segment) => {
  const bySlug = workspaces.find((w) => w.slug === segment);
  if (bySlug) return { workspace: bySlug, bySlug: true };
  const id = parseWorkspaceId(segment);
  const byId = id ? workspaces.find((w) => w.id === id) : null;
  return { workspace: byId ?? null, bySlug: false };
};

export const byName =(a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
