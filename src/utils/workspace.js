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

export const byName = (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
