import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Stack } from "@mui/material";
import PageLayout from "../../components/layouts/PageLayout";
import ProjectMembersTab from "../../components/projects/ProjectMembersTab";
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
import ProjectStats from "../../components/projects/overview/ProjectStats";
import RecentActivityCard from "../../components/projects/overview/RecentActivityCard";
import ProjectDetailsCard from "../../components/projects/overview/ProjectDetailsCard";
import ProjectMembersCard from "../../components/projects/overview/ProjectMembersCard";
import ComingSoonPanel from "../../components/projects/overview/ComingSoonPanel";
import BacklogTab from "../../components/backlog/BacklogTab";
import BoardTab from "../../components/board/BoardTab";
import { tabsFor } from "../../components/projects/overview/tabList";
import { listProjectMembers } from "../../api/projectsApi";
import { useAsync } from "../../hooks/useAsync";
import { useProjectAccess, useWorkspaceAccess } from "../../hooks/useResourceAccess";
import { can, isProjectArchived, projectsPath } from "../../utils/project";
import { isWorkspaceArchived } from "../../utils/workspace";
import { PERMISSIONS } from "../../constants/projects";

// the overview loads one page of members (to find the Project Managers and name people in the activity)
// and the members card shows the first 5, Project Managers first
const MEMBERS_PREVIEW_SIZE = 20;

// /workspaces/:workspaceId/projects/:projectId: ProjectAccessGuard has loaded the project (and remounts
// this page when the project changes, so tabs and dialogs start fresh).
// One project: Overview (stats, activity, details, members), Members, Backlog, Board, and tabs that are coming soon.
// Kanban projects have no Backlog / Sprints. Project Managers and workspace admins (MANAGE_MEMBERS)
// can add and remove people, MANAGE_ROLES changes their roles; EDIT_SETTINGS / ARCHIVE_PROJECT unlock the settings menu.
const ProjectPage = () => {
  const navigate = useNavigate();
  const { workspace } = useWorkspaceAccess();
  const { project, reloadProject } = useProjectAccess();
  const [tab, setTab] = useState("overview");
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
  const canEditRoles = can(project, PERMISSIONS.MANAGE_ROLES) && writable;
  const canEdit = can(project, PERMISSIONS.EDIT_SETTINGS) && writable;
  // a Kanban project has no Backlog / Sprints tab: fall back to Overview
  const tabs = tabsFor(project.template);
  const currentTab = tabs.some((t) => t.id === tab) ? tab : "overview";

  const closeDialog = () => setDialog(null);
  const afterChange = () => {
    closeDialog();
    setVersion((v) => v + 1);
    reloadProject(); // roles, name or status may have changed (or the user removed themselves)
  };
  const afterStatusChange = () => {
    if (dialog?.type === "delete") navigate(projectsPath(project.workspaceId), { replace: true });
    else afterChange();
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

      <ProjectTabs value={currentTab} onChange={setTab} template={project.template} />

      {currentTab === "overview" && (
        <Stack spacing={3}>
          <ProjectStats project={project} />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 2fr) minmax(0, 1fr)" },
              gap: 3,
              alignItems: "start",
            }}
          >
            <RecentActivityCard project={project} members={previewState.data?.content} loading={!previewState.data} />
            <Stack spacing={3}>
              <ProjectDetailsCard
                project={project}
                workspace={workspace}
                canEdit={canEdit}
                onEdit={() => setDialog({ type: "edit" })}
              />
              <ProjectMembersCard
                project={project}
                preview={previewState.data}
                loading={!previewState.data}
                canManage={canManage}
                onSeeAll={() => setTab("members")}
                onAdd={() => setDialog({ type: "add-people" })}
              />
            </Stack>
          </Box>
        </Stack>
      )}

      {currentTab === "members" && (
        <ProjectMembersTab
          project={project}
          version={version}
          canManage={canManage}
          canEditRoles={canEditRoles}
          onAddPeople={() => setDialog({ type: "add-people" })}
          onAddTeam={() => setDialog({ type: "add-team" })}
          onRemove={(member) => setDialog({ type: "remove", member })}
          onEditRoles={(member) => setDialog({ type: "roles", member })}
        />
      )}

      {currentTab === "backlog" && <BacklogTab project={project} writable={writable} />}

      {currentTab === "board" && (
        <BoardTab project={project} writable={writable} onOpenBacklog={() => setTab("backlog")} />
      )}

      {!["overview", "members", "backlog", "board"].includes(currentTab) && (
        <ComingSoonPanel title={tabs.find((t) => t.id === currentTab).label} />
      )}

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
