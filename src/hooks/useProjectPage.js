import { useOutletContext } from "react-router-dom";

// What the project page layout (ProjectPage) shares with its tab routes, which stay below it in the tree, so the
// header, the member preview and the dialogs live on while only the tab changes:
// { preview, version, taskVersion (up after a task is created from Quick actions), writable, workspaceArchived, canManage, canEditRoles, canEdit, openDialog, afterChange, goToTab }
// openDialog({ type, member? }) opens one of the page's windows; afterChange() reloads after a change;
// goToTab(id) switches tab. The project and workspace themselves still come from useProjectAccess() / useWorkspaceAccess().
export const useProjectPage = () => useOutletContext().page;
