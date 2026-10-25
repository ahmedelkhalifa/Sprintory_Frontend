import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Skeleton, Stack } from "@mui/material";
import PageLayout from "../../components/layouts/PageLayout";
import ProjectNotFound from "../../components/projects/ProjectNotFound";
import ProjectMembersTab from "../../components/projects/ProjectMembersTab";
import AddPeopleDialog from "../../components/projects/AddPeopleDialog";
import AddTeamDialog from "../../components/projects/AddTeamDialog";
import RemoveMemberDialog from "../../components/projects/RemoveMemberDialog";
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
import { tabsFor } from "../../components/projects/overview/tabList";
import { getProject, listProjectMembers } from "../../api/projectsApi";
import { getWorkspace } from "../../api/workspacesApi";
import { useAsync } from "../../hooks/useAsync";
import { can } from "../../utils/permissions";
import { PERMISSIONS, PROJECT_STATUS } from "../../constants/projects";

const PROJECT_ERRORS = { fallback: "Couldn't load the project. Please try again." };
// the overview loads one page of members (to find the Project Managers and name people in the activity)
// and the members card shows the first 5, Project Managers first
const MEMBERS_PREVIEW_SIZE = 20;

// skeleton of the header and the stat cards while the project loads
const PageSkeleton = () => (
  <Box>
    <Skeleton width={140} />
    <Box sx={{ display: "flex", gap: 2.5, alignItems: "center", mt: 2, mb: 4 }}>
      <Skeleton variant="rounded" width={72} height={72} />
      <Box sx={{ flex: 1 }}>
        <Skeleton width="40%" height={40} />
        <Skeleton width="60%" />
      </Box>
    </Box>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 2 }}>
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} variant="rounded" height={96} />
      ))}
    </Box>
  </Box>
);

// /projects/:projectId: one project. Overview (stats, activity, details, members), Members, and tabs that are
// coming soon. Kanban projects have no Backlog / Sprints. Project Managers and workspace admins
// (MANAGE_MEMBERS) can add and remove people; EDIT_SETTINGS / ARCHIVE_PROJECT unlock the settings menu.
const ProjectPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  // which window is open: add-people / add-team / remove (+ member) / edit / archive / restore / delete
  const [dialog, setDialog] = useState(null);
  // bumped after every membership change, so member lists load again
  const [version, setVersion] = useState(0);

  const projectState = useAsync(() => getProject(projectId), [projectId], { messages: PROJECT_ERRORS });
  const project = projectState.data;
  const workspaceState = useAsync(() => getWorkspace(project.workspaceId), [project?.workspaceId], {
    enabled: Boolean(project),
  });
  const previewState = useAsync(
    () => listProjectMembers(projectId, { size: MEMBERS_PREVIEW_SIZE }),
    [projectId, version],
    { enabled: Boolean(project) },
  );

  if (projectState.errorCode === "RESOURCE_NOT_FOUND") {
    return (
      <PageLayout>
        <ProjectNotFound />
      </PageLayout>
    );
  }

  if (!project) {
    return (
      <PageLayout>
        {projectState.error ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={projectState.reload}>
                Try again
              </Button>
            }
          >
            {projectState.error}
          </Alert>
        ) : (
          <PageSkeleton />
        )}
      </PageLayout>
    );
  }

  const workspace = workspaceState.data;
  const workspaceArchived = Boolean(workspace?.isArchived);
  const projectArchived = project.status === PROJECT_STATUS.ARCHIVED;
  // hiding is only for usability: the backend refuses these changes anyway
  const canManage = can(project, PERMISSIONS.MANAGE_MEMBERS) && Boolean(workspace) && !workspaceArchived && !projectArchived;
  const canEdit = can(project, PERMISSIONS.EDIT_SETTINGS) && Boolean(workspace) && !workspaceArchived && !projectArchived;
  // a Kanban project has no Backlog / Sprints tab: fall back to Overview
  const tabs = tabsFor(project.template);
  const currentTab = tabs.some((t) => t.id === tab) ? tab : "overview";

  const closeDialog = () => setDialog(null);
  const afterChange = () => {
    closeDialog();
    setVersion((v) => v + 1);
    projectState.reload(); // roles, name or status may have changed (or the user removed themselves)
  };
  const afterStatusChange = () => {
    if (dialog?.type === "delete") navigate("/projects", { replace: true });
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
            {workspace && !workspaceArchived && (
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
            <RecentActivityCard project={project} members={previewState.data?.items} loading={!previewState.data} />
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
          onAddPeople={() => setDialog({ type: "add-people" })}
          onAddTeam={() => setDialog({ type: "add-team" })}
          onRemove={(member) => setDialog({ type: "remove", member })}
        />
      )}

      {!["overview", "members"].includes(currentTab) && (
        <ComingSoonPanel title={tabs.find((t) => t.id === currentTab).label} />
      )}

      {dialog?.type === "add-people" && <AddPeopleDialog project={project} onClose={closeDialog} onAdded={afterChange} />}
      {dialog?.type === "add-team" && <AddTeamDialog project={project} onClose={closeDialog} onAdded={afterChange} />}
      {dialog?.type === "remove" && (
        <RemoveMemberDialog project={project} member={dialog.member} onClose={closeDialog} onRemoved={afterChange} />
      )}
      {dialog?.type === "edit" && <EditProjectDialog project={project} onClose={closeDialog} onSaved={afterChange} />}
      {["archive", "restore", "delete"].includes(dialog?.type) && (
        <ProjectStatusDialog action={dialog.type} project={project} onClose={closeDialog} onDone={afterStatusChange} />
      )}
    </PageLayout>
  );
};

export default ProjectPage;
