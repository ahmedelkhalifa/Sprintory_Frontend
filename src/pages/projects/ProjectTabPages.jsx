import { Box, Stack } from "@mui/material";
import ProjectMembersTab from "../../components/projects/ProjectMembersTab";
import ProjectSettingsTab from "../../components/projects/ProjectSettingsTab";
import ProjectStats from "../../components/projects/overview/ProjectStats";
import RecentActivityCard from "../../components/projects/overview/RecentActivityCard";
import ProjectDetailsCard from "../../components/projects/overview/ProjectDetailsCard";
import ProjectMembersCard from "../../components/projects/overview/ProjectMembersCard";
import ComingSoonPanel from "../../components/projects/overview/ComingSoonPanel";
import BacklogTab from "../../components/backlog/BacklogTab";
import BoardTab from "../../components/board/BoardTab";
import { tabLabel } from "../../components/projects/overview/tabList";
import { useProjectAccess, useWorkspaceAccess } from "../../hooks/useResourceAccess";
import { useProjectPage } from "../../hooks/useProjectPage";

// The project page's tabs, one route each (see App.jsx), rendered inside ProjectPage's layout.
// Only the tab's own content mounts and unmounts when the tab changes; what they share comes from useProjectPage().

// .../projects/:projectId
export const ProjectOverviewPage = () => {
  const { workspace } = useWorkspaceAccess();
  const { project } = useProjectAccess();
  const page = useProjectPage();

  return (
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
        <RecentActivityCard project={project} members={page.preview?.content} loading={!page.preview} />
        <Stack spacing={3}>
          <ProjectDetailsCard
            project={project}
            workspace={workspace}
            canEdit={page.canEdit}
            onEdit={() => page.openDialog({ type: "edit" })}
          />
          <ProjectMembersCard
            project={project}
            preview={page.preview}
            loading={!page.preview}
            canManage={page.canManage}
            onSeeAll={() => page.goToTab("members")}
            onAdd={() => page.openDialog({ type: "add-people" })}
          />
        </Stack>
      </Box>
    </Stack>
  );
};

// .../members
export const ProjectMembersPage = () => {
  const { project } = useProjectAccess();
  const page = useProjectPage();

  return (
    <ProjectMembersTab
      project={project}
      version={page.version}
      canManage={page.canManage}
      canEditRoles={page.canEditRoles}
      onAddPeople={() => page.openDialog({ type: "add-people" })}
      onAddTeam={() => page.openDialog({ type: "add-team" })}
      onRemove={(member) => page.openDialog({ type: "remove", member })}
      onEditRoles={(member) => page.openDialog({ type: "roles", member })}
    />
  );
};

// .../backlog (Scrum only; ProjectPage sends Kanban projects back to Overview)
export const ProjectBacklogPage = () => {
  const { project } = useProjectAccess();
  const page = useProjectPage();
  return (
    <BacklogTab
      project={project}
      writable={page.writable}
      taskVersion={page.taskVersion}
      onCreateTask={() => page.openDialog({ type: "create-task" })}
    />
  );
};

// .../board
export const ProjectBoardPage = () => {
  const { project } = useProjectAccess();
  const page = useProjectPage();
  return (
    <BoardTab
      project={project}
      writable={page.writable}
      taskVersion={page.taskVersion}
      onCreateTask={() => page.openDialog({ type: "create-task" })}
      onOpenBacklog={() => page.goToTab("backlog")}
    />
  );
};

// .../settings
export const ProjectSettingsPage = () => {
  const { project } = useProjectAccess();
  const page = useProjectPage();

  return (
    <ProjectSettingsTab
      project={project}
      writable={page.writable}
      workspaceArchived={page.workspaceArchived}
      onSaved={page.afterChange}
      onAction={(type) => page.openDialog({ type })}
    />
  );
};

// .../sprints, /reports, /files until they are built
export const ProjectComingSoonPage = ({ tab }) => <ComingSoonPanel title={tabLabel(tab)} />;
