import { useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { Alert, Box, Button, Snackbar } from "@mui/material";
import PageLayout from "../../components/layouts/PageLayout";
import AddPeopleDialog from "../../components/projects/AddPeopleDialog";
import AddTeamDialog from "../../components/projects/AddTeamDialog";
import RemoveMemberDialog from "../../components/projects/RemoveMemberDialog";
import ProjectRolesDialog from "../../components/projects/ProjectRolesDialog";
import EditProjectDialog from "../../components/projects/EditProjectDialog";
import ProjectStatusDialog from "../../components/projects/ProjectStatusDialog";
import CreateTaskDialog from "../../components/tasks/CreateTaskDialog";
import ProjectOverviewHeader from "../../components/projects/overview/ProjectOverviewHeader";
import QuickActionsMenu from "../../components/projects/overview/QuickActionsMenu";
import ProjectSettingsMenu from "../../components/projects/overview/ProjectSettingsMenu";
import ProjectTabs from "../../components/projects/overview/ProjectTabs";
import { projectActionsFor } from "../../components/projects/projectActions";
import { tabsFor } from "../../components/projects/overview/tabList";
import { canOpenProjectChat } from "../../utils/chat";
import { listProjectMembers } from "../../api/projectsApi";
import { useAsync } from "../../hooks/useAsync";
import { useLatched } from "../../hooks/useLatched";
import { slideIn } from "../../theme/motion";
import { useProjectAccess, useWorkspaceAccess } from "../../hooks/useResourceAccess";
import { useTasksChanged } from "../../hooks/useTasksChanged";
import {
  can,
  isProjectArchived,
  projectPath,
  projectSettingsPath,
  projectTabOf,
  projectTabPath,
  projectsPath,
} from "../../utils/project";
import { isWorkspaceArchived } from "../../utils/workspace";
import { EMPTY_TASK_FILTERS } from "../../utils/taskFilters";
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
  // which window is open: create-task / add-people / add-team / remove (+ member) / roles (+ member) / edit /
  // archive / restore / delete
  const [dialog, setDialog] = useState(null);
  const shown = useLatched(dialog);
  const isOpen = (type) => dialog?.type === type;
  // bumped after every membership change, so member lists load again
  const [version, setVersion] = useState(0);
  // bumped after a task is created from Quick actions or restored, so the Backlog / Board tab loads again
  const [taskVersion, setTaskVersion] = useState(0);
  const [createdTask, setCreatedTask] = useState(null);
  // the Board and Backlog's filter bar: kept here (this layout stays mounted while the tab changes),
  // so the filters stay when switching between those tabs
  const [taskFilters, setTaskFilters] = useState(EMPTY_TASK_FILTERS);

  // a task came back (Undo after a delete): the open Backlog / Board loads again, like after a create
  useTasksChanged(project.id, () => setTaskVersion((v) => v + 1));

  const previewState = useAsync(
    (signal) => listProjectMembers(project.id, { size: MEMBERS_PREVIEW_SIZE }, signal),
    [project.id, version],
  );

  const workspaceArchived = isWorkspaceArchived(workspace);
  const projectArchived = isProjectArchived(project);
  // hiding is only for usability, the backend refuses anyway
  const writable = !workspaceArchived && !projectArchived;
  const canManage = can(project, PERMISSIONS.MANAGE_MEMBERS) && writable;
  const canCreateTask = can(project, PERMISSIONS.EDIT_TASKS) && writable;
  const scrum = project.template === "SCRUM";
  // where a new task shows up: last in the backlog (Scrum), the board's first column (Kanban)
  const workTab = scrum ? "backlog" : "board";
  const tabs = tabsFor(project.template, canOpenProjectChat(project));
  const tab = projectTabOf(pathname, projectPath(workspace, project));
  const tabPath = (id) => projectTabPath(workspace, project, id);
  // which way the last tab change went (+1 right, -1 left, 0 none), so the content comes in from that side
  const [tabMove, setTabMove] = useState({ tab, direction: 0 });
  if (tabMove.tab !== tab) {
    const from = tabs.findIndex((t) => t.id === tabMove.tab);
    const to = tabs.findIndex((t) => t.id === tab);
    setTabMove({ tab, direction: from < 0 || to < 0 ? 0 : Math.sign(to - from) });
  }

  const closeDialog = () => setDialog(null);
  const afterChange = () => {
    closeDialog();
    setVersion((v) => v + 1);
    reloadProject(); // roles, name or status may have changed (or the user removed themselves)
  };
  const afterTaskCreated = (task) => {
    closeDialog();
    setCreatedTask(task);
    setTaskVersion((v) => v + 1);
  };
  const afterStatusChange = () => {
    if (dialog?.type === "delete") navigate(projectsPath(workspace), { replace: true });
    else afterChange();
  };

  const settingsPath = (section) => projectSettingsPath(workspace, project, section);

  // the members used to be their own tab: old links land on Settings → People and access
  if (tab === "members") return <Navigate to={settingsPath("people")} replace />;
  // an unknown tab, or Backlog / Sprints in a Kanban project: Overview instead
  if (!tabs.some((t) => t.id === tab)) return <Navigate to={tabPath("overview")} replace />;

  const page = {
    preview: previewState.data,
    version,
    taskVersion,
    taskFilters,
    setTaskFilters,
    writable,
    workspaceArchived,
    canManage,
    canEditRoles: can(project, PERMISSIONS.MANAGE_ROLES) && writable,
    canEdit: can(project, PERMISSIONS.EDIT_SETTINGS) && writable,
    openDialog: setDialog,
    afterChange,
    goToTab: (id) => navigate(tabPath(id)),
    goToSettings: (section) => navigate(settingsPath(section)),
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
              canCreateTask={canCreateTask}
              onCreateTask={() => setDialog({ type: "create-task" })}
              canInvite={canManage}
              onInvite={() => setDialog({ type: "add-people" })}
            />
            {/* in an archived workspace only its links are left: nothing can be edited, archived or deleted */}
            <ProjectSettingsMenu
              actions={workspaceArchived ? [] : projectActionsFor(project)}
              onAction={(type) => setDialog({ type })}
              peoplePath={settingsPath("people")}
              settingsPath={settingsPath("general")}
            />
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

      {/* a new tab follows the underline: it comes in from the side the underline went to (keyed on the tab, so
          Settings sections and a sprint's page don't move) */}
      <Box key={tab} sx={slideIn(tabMove.direction * 16)}>
        <Outlet context={{ ...parent, page }} />
      </Box>

      {/* rendered from `shown` (kept a moment after closing, so the window can play its close), open from `dialog` */}
      {shown?.type === "create-task" && (
        <CreateTaskDialog open={isOpen("create-task")} project={project} onClose={closeDialog} onCreated={afterTaskCreated} />
      )}
      {shown?.type === "add-people" && (
        <AddPeopleDialog open={isOpen("add-people")} project={project} onClose={closeDialog} onAdded={afterChange} />
      )}
      {shown?.type === "add-team" && (
        <AddTeamDialog open={isOpen("add-team")} project={project} onClose={closeDialog} onAdded={afterChange} />
      )}
      {shown?.type === "remove" && (
        <RemoveMemberDialog
          open={isOpen("remove")}
          project={project}
          member={shown.member}
          onClose={closeDialog}
          onRemoved={afterChange}
        />
      )}
      {shown?.type === "roles" && (
        <ProjectRolesDialog
          open={isOpen("roles")}
          project={project}
          member={shown.member}
          onClose={closeDialog}
          onSaved={afterChange}
        />
      )}
      {shown?.type === "edit" && (
        <EditProjectDialog open={isOpen("edit")} project={project} onClose={closeDialog} onSaved={afterChange} />
      )}
      {["archive", "restore", "delete"].includes(shown?.type) && (
        <ProjectStatusDialog
          open={isOpen(shown.type)}
          action={shown.type}
          project={project}
          onClose={closeDialog}
          onDone={afterStatusChange}
        />
      )}

      <Snackbar
        open={Boolean(createdTask)}
        autoHideDuration={6000}
        onClose={() => setCreatedTask(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setCreatedTask(null)}
          action={
            // already looking at it: nothing to open
            tab !== workTab && (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  setCreatedTask(null);
                  navigate(tabPath(workTab));
                }}
              >
                {scrum ? "Open backlog" : "Open board"}
              </Button>
            )
          }
          sx={{ width: "100%" }}
        >
          {createdTask?.key} was added to {scrum ? "the backlog" : "the board"}.
        </Alert>
      </Snackbar>
    </PageLayout>
  );
};

export default ProjectPage;
