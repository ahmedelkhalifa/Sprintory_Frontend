// Can the logged-in user do `permission` in this project?
// The backend sends the caller's own permissions on every project (roles-docs.md §3).
// Hiding a control is only for usability: the backend refuses the request either way.
export function can(project, permission) {
  return Boolean(project?.permissions?.includes(permission));
}
