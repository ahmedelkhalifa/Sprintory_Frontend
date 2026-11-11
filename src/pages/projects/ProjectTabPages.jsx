import { useParams } from "react-router-dom";
import { Alert, Box, Paper, Snackbar, Stack } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LoadState from "../../components/general/LoadState";
import ProjectMembersTab from "../../components/projects/ProjectMembersTab";
import ProjectSettingsTab from "../../components/projects/ProjectSettingsTab";
import ProjectStats from "../../components/projects/overview/ProjectStats";
import ProjectDescriptionCard from "../../components/projects/overview/ProjectDescriptionCard";
import ProjectDetailsCard from "../../components/projects/overview/ProjectDetailsCard";
import ProjectMembersCard from "../../components/projects/overview/ProjectMembersCard";
import ComingSoonPanel from "../../components/projects/overview/ComingSoonPanel";
import BacklogTab from "../../components/backlog/BacklogTab";
import BoardTab from "../../components/board/BoardTab";
import SprintsTab from "../../components/sprints/SprintsTab";
import SprintSummaryPage from "../../components/sprints/SprintSummaryPage";
import CharterGoals from "../../components/charter/CharterGoals";
import CharterScope from "../../components/charter/CharterScope";
import CharterStakeholders from "../../components/charter/CharterStakeholders";
import CharterHistory from "../../components/charter/CharterHistory";
import { useCharter } from "../../components/charter/useCharter";
import { tabLabel } from "../../components/projects/overview/tabList";
import { canOpenProjectChat } from "../../utils/chat";
import { useProjectAccess, useWorkspaceAccess } from "../../hooks/useResourceAccess";
import { useProjectPage } from "../../hooks/useProjectPage";

// The project page's tabs, one route each (see App.jsx), rendered inside ProjectPage's layout.
// Only the tab's own content mounts and unmounts when the tab changes; what they share comes from useProjectPage().

// .../projects/:projectId: the stats, the description and the charter (members only), with the project's
// details and members on the side. The stakeholder register and the history get the full width (wide tables).
export const ProjectOverviewPage = () => {
  const { workspace } = useWorkspaceAccess();
  const { project } = useProjectAccess();
  const page = useProjectPage();
  // the charter is members only (a workspace admin outside the project would get 404), like the chat
  const member = canOpenProjectChat(project);
  const charter = useCharter(project, { writable: page.writable, enabled: member });
  const { charter: data, goals, editable } = charter;

  return (
    <Stack spacing={3}>
      <ProjectStats project={project} />
      {charter.readOnlyReason && (
        <Alert severity="info" icon={<LockOutlinedIcon fontSize="inherit" />}>
          {charter.readOnlyReason} You can read the charter.
        </Alert>
      )}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 2fr) minmax(0, 1fr)" },
          gap: 3,
          alignItems: "start",
        }}
      >
        <Stack spacing={3} sx={{ minWidth: 0 }}>
          <ProjectDescriptionCard
            project={project}
            canEdit={page.canEdit}
            onEdit={() => page.openDialog({ type: "edit" })}
          />
          {member && !data && (
            <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
              <LoadState
                loading={!charter.state.error}
                error={charter.state.error}
                onRetry={charter.state.reload}
                rows={4}
              />
            </Paper>
          )}
          {data && (
            <>
              <CharterGoals
                project={project}
                goals={goals}
                editable={editable}
                reordering={charter.reordering}
                onReorder={charter.reorder}
                onChanged={charter.afterChange}
                onNotice={charter.showNotice}
              />
              <CharterScope
                project={project}
                charter={data}
                editable={editable}
                onSaved={charter.afterChange}
                onNotice={charter.showNotice}
              />
            </>
          )}
        </Stack>
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

      {data && (
        <>
          <CharterStakeholders
            project={project}
            workspace={workspace}
            stakeholders={data.stakeholders ?? []}
            editable={editable}
            onChanged={charter.state.reload}
            onNotice={charter.showNotice}
          />
          <CharterHistory project={project} goals={goals} version={charter.historyVersion} />
        </>
      )}

      <Snackbar
        open={Boolean(charter.notice)}
        autoHideDuration={5000}
        onClose={charter.clearNotice}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={charter.notice?.severity ?? "success"}
          variant="filled"
          onClose={charter.clearNotice}
          sx={{ width: "100%" }}
        >
          {charter.notice?.text}
        </Alert>
      </Snackbar>
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
      filters={page.taskFilters}
      onFiltersChange={page.setTaskFilters}
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
      filters={page.taskFilters}
      onFiltersChange={page.setTaskFilters}
      onCreateTask={() => page.openDialog({ type: "create-task" })}
      onOpenBacklog={() => page.goToTab("backlog")}
      onOpenSettings={() => page.goToTab("settings")}
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

// .../sprints (Scrum only, like the backlog)
export const ProjectSprintsPage = () => {
  const { project } = useProjectAccess();
  const page = useProjectPage();
  return <SprintsTab project={project} onOpenBacklog={() => page.goToTab("backlog")} />;
};

// .../sprints/:sprintId: one sprint's page, ended ones included (the Sprints tab stays selected)
export const ProjectSprintSummaryPage = () => {
  const { project } = useProjectAccess();
  const { sprintId } = useParams();
  const page = useProjectPage();
  // remounts for another sprint, so nothing of the previous one shows
  return <SprintSummaryPage key={sprintId} project={project} sprintId={sprintId} onBack={() => page.goToTab("sprints")} />;
};

// .../reports, /files until they are built
export const ProjectComingSoonPage = ({ tab }) => <ComingSoonPanel title={tabLabel(tab)} />;
