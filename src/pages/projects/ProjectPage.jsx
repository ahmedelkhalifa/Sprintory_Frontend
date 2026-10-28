import { useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { Alert } from "@mui/material";
import PageLayout from "../../components/layouts/PageLayout";
import AddPeopleDialog from "../../components/projects/AddPeopleDialog";
import AddTeamDialog from "../../components/projects/AddTeamDialog";
import RemoveMemberDialog from "../../components/projects/RemoveMemberDialog";
import ProjectRolesDialog from "../../components/projects/ProjectRolesDialog";
import EditProjectDialog from "../../components/projects/EditProjectDialog";
import ProjectStatusDialog from "../../components/projects/ProjectStatusDialog";
import ProjectOverviewHeader from "../../components/projects/overview/ProjectOverviewHeader";
import QuickActionsMenu from "../../components/projects/overview/QuickActionsMenu";
import ProjectSettingsMenu from "../../components/projects/overview/ProjectSettingsMenu";
import ProjectTabs from "../../components/projects/overview/ProjectTabs";
import { tabsFor } from "../../components/projects/overview/tabList";
import { listProjectMembers } from "../../api/projectsApi";
import { useAsync } from "../../hooks/useAsync";
import { useProjectAccess, useWorkspaceAccess } from "../../hooks/useResourceAccess";
import { can, isProjectArchived, projectPath, projectTabOf, projectTabPath, projectsPath } from "../../utils/project";
import { isWorkspaceArchived } from "../../utils/workspace";
import { PERMISSIONS } from "../../constants/projects";

// the overview loads one page of members (to find the Project Managers and name people in the activity)
// and the members card shows the first 5, Project Managers first
const MEMBERS_PREVIEW_SIZE = 20;

// /workspaces/:workspaceSlug/projects/:projectId/...: ProjectAccessGuard has loaded the project (and remounts
// this page when the project changes, so dialogs start fresh).
// Layout of one project: the header, the tabs and the page's windows, with the current tab's route in <Outlet />
// (ProjectTabPages.jsx). It stays mounted while the tab changes, so none of this reloads; the tab is in the url.
// Kanban projects have no Backlog / Sprints. Project Managers and workspace admins (MANAGE_MEMBERS)
// can add and remove people, MANAGE_ROLES changes their roles; EDIT_SETTINGS / ARCHIVE_PROJECT unlock the settings menu.
const ProjectPage = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // the guard's { workspace, project, ... }, passed on so the tabs can still read it
  const parent = useOutletContext();
  const { workspace } = useWorkspaceAccess();
  const { project, reloadProject } = useProjectAccess();
  // which window is open: add-people / add-team / remove (+ member) / roles (+ member) / edit / archive / restore / delete
  const [dialog, setDialog] = useState(null);
  // bumped after every membership change, so member lists load again
  const [version, setVersion] = useState(0);

  const previewState = useAsync(
    (signal) => listProjectMembers(project.id, { size: MEMBERS_PREVIEW_SIZE }, signal),
    [project.id, version],
  );

  const workspaceArchived = isWorkspaceArchived(workspace);
  const projectArchived = isProjectArchived(project);
  // hiding is only for usability, the backend refuses anyway
  const writable = !workspaceArchived && !projectArchived;
  const canManage = can(project, PERMISSIONS.MANAGE_MEMBERS) && writable;
  const tabs = tabsFor(project.template);
  const tab = projectTabOf(pathname, projectPath(workspace, project));
  const tabPath = (id) => projectTabPath(workspace, project, id);

  const closeDialog = () => setDialog(null);
  const afterChange = () => {
    closeDialog();
    setVersion((v) => v + 1);
    reloadProject(); // roles, name or status may have changed (or the user removed themselves)
  };
  const afterStatusChange = () => {
    if (dialog?.type === "delete") navigate(projectsPath(workspace), { replace: true });
    else afterChange();
  };

  // an unknown tab, or Backlog / Sprints in a Kanban project: Overview instead
  if (!tabs.some((t) => t.id === tab)) return <Navigate to={tabPath("overview")} replace />;

  const page = {
    preview: previewState.data,
    version,
    writable,
    workspaceArchived,
    canManage,
    canEditRoles: can(project, PERMISSIONS.MANAGE_ROLES) && writable,
    canEdit: can(project, PERMISSIONS.EDIT_SETTINGS) && writable,
    openDialog: setDialog,
    afterChange,
    goToTab: (id) => navigate(tabPath(id)),
  };

  return (
    <PageLayout>
      <ProjectOverviewHeader
        project={project}
        preview={previewState.data}
        actions={
          <>
            <QuickActionsMenu
              template={project.template}
              canInvite={canManage}
              onInvite={() => setDialog({ type: "add-people" })}
            />
            {!workspaceArchived && (
              <ProjectSettingsMenu project={project} onAction={(type) => setDialog({ type })} />
            )}
          </>
        }
      />

      {(workspaceArchived || projectArchived) && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {workspaceArchived
            ? "This workspace is archived. Projects are read-only."
            : "This project is archived. Restore it from Project settings to make changes."}
        </Alert>
      )}

      <ProjectTabs value={tab} tabs={tabs} pathFor={tabPath} />

      <Outlet context={{ ...parent, page }} />

      {dialog?.type === "add-people" && <AddPeopleDialog project={project} onClose={closeDialog} onAdded={afterChange} />}
      {dialog?.type === "add-team" && <AddTeamDialog project={project} onClose={closeDialog} onAdded={afterChange} />}
      {dialog?.type === "remove" && (
        <RemoveMemberDialog project={project} member={dialog.member} onClose={closeDialog} onRemoved={afterChange} />
      )}
      {dialog?.type === "roles" && (
        <ProjectRolesDialog project={project} member={dialog.member} onClose={closeDialog} onSaved={afterChange} />
      )}
      {dialog?.type === "edit" && <EditProjectDialog project={project} onClose={closeDialog} onSaved={afterChange} />}
      {["archive", "restore", "delete"].includes(dialog?.type) && (
        <ProjectStatusDialog action={dialog.type} project={project} onClose={closeDialog} onDone={afterStatusChange} />
      )}
    </PageLayout>
  );
};

export default ProjectPage;
