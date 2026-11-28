import { useParams } from "react-router-dom";
import { Alert, Box, Paper, Snackbar, Stack } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LoadState from "../../components/general/LoadState";
import ProjectSettingsTab from "../../components/projects/settings/ProjectSettingsTab";
import ProjectStats from "../../components/projects/overview/ProjectStats";
import ProjectDescriptionCard from "../../components/projects/overview/ProjectDescriptionCard";
import ProjectDetailsCard from "../../components/projects/overview/ProjectDetailsCard";
import ProjectMembersCard from "../../components/projects/overview/ProjectMembersCard";
import ComingSoonPanel from "../../components/projects/overview/ComingSoonPanel";
import BacklogTab from "../../components/backlog/BacklogTab";
import BoardTab from "../../components/board/BoardTab";
import SprintsTab from "../../components/sprints/SprintsTab";
import SprintSummaryPage from "../../components/sprints/SprintSummaryPage";
import RetroPage from "../../components/retro/RetroPage";
import CharterGoals from "../../components/charter/CharterGoals";
import CharterScope from "../../components/charter/CharterScope";
import CharterStakeholders from "../../components/charter/CharterStakeholders";
import CharterHistory from "../../components/charter/CharterHistory";
import { useCharter } from "../../components/charter/useCharter";
import { tabLabel } from "../../components/projects/overview/tabList";
import { canOpenProjectChat } from "../../utils/chat";
import { projectSettingsPath } from "../../utils/project";
import { useProjectAccess, useWorkspaceAccess } from "../../hooks/useResourceAccess";
import { useProjectPage } from "../../hooks/useProjectPage";
import { LOADING_DELAY_SX, reveal, revealChildren } from "../../theme/motion";
import MilestonePage from "../../components/milestones/MilestonePage";
import ProjectMilestonesSection from "../../components/milestones/ProjectMilestonesSection";

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
  // ready once the charter has loaded or failed (or straight away for someone who can't see it)
  const charterReady = !member || Boolean(data) || Boolean(charter.state.error);

  return (
    <Stack spacing={3}>
      <ProjectStats project={project} taskVersion={page.taskVersion} />
      {/* the rest waits for the charter (members only), so the description, goals and scope arrive together
          instead of the column growing under the reader; a slow charter shows a skeleton after 200ms */}
      {!charterReady ? (
        <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2, ...LOADING_DELAY_SX }}>
          <LoadState loading rows={4} />
        </Paper>
      ) : (
        <>
          {charter.readOnlyReason && (
            <Alert severity="info" icon={<LockOutlinedIcon fontSize="inherit" />} sx={reveal(1)}>
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
            {/* the cards come in one after another, the main column a step ahead of the side one */}
            <Stack spacing={3} sx={{ minWidth: 0, ...revealChildren(1) }}>
              <ProjectDescriptionCard
                project={project}
                canEdit={page.canEdit}
                onEdit={() => page.openDialog({ type: "edit" })}
              />
              {/* the charter couldn't load: its error and Try again, under the description */}
              {member && !data && (
                <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
                  <LoadState error={charter.state.error} onRetry={charter.state.reload} />
                </Paper>
              )}
              {data && (
                <CharterGoals
                  project={project}
                  goals={goals}
                  editable={editable}
                  reordering={charter.reordering}
                  onReorder={charter.reorder}
                  onChanged={charter.afterChange}
                  onNotice={charter.showNotice}
                />
              )}
              {data && (
                <CharterScope
                  project={project}
                  charter={data}
                  editable={editable}
                  onSaved={charter.afterChange}
                  onNotice={charter.showNotice}
                />
              )}
            </Stack>
            <Stack spacing={3} sx={revealChildren(2)}>
              <ProjectDetailsCard
                project={project}
                workspace={workspace}
                canEdit={page.canEdit}
                onEdit={() => page.openDialog({ type: "edit" })}
              />
              {member && (
                  <ProjectMilestonesSection
                      key={project.id}
                      workspace={workspace}
                      project={project}
                      writable={page.writable}
                  />
              )}
              <ProjectMembersCard
                project={project}
                preview={page.preview}
                loading={!page.preview}
                canManage={page.canManage}
                onSeeAll={() => page.goToSettings("people")}
                onAdd={() => page.openDialog({ type: "add-people" })}
              />
            </Stack>
          </Box>

          {data && (
            <Stack spacing={3} sx={revealChildren(4)}>
              <CharterStakeholders
                project={project}
                workspace={workspace}
                stakeholders={data.stakeholders ?? []}
                editable={editable}
                onChanged={charter.state.reload}
                onNotice={charter.showNotice}
              />
              <CharterHistory project={project} goals={goals} version={charter.historyVersion} />
            </Stack>
          )}
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
      onOpenSettings={() => page.goToSettings("board")}
    />
  );
};

// .../settings and .../settings/:section (people, board, archive); the old .../members url lands on people
export const ProjectSettingsPage = () => {
  const { workspace } = useWorkspaceAccess();
  const { project } = useProjectAccess();
  const { section } = useParams();
  const page = useProjectPage();

  return (
    <ProjectSettingsTab
      project={project}
      section={section}
      pathFor={(id) => projectSettingsPath(workspace, project, id)}
      writable={page.writable}
      workspaceArchived={page.workspaceArchived}
      people={{
        version: page.version,
        canManage: page.canManage,
        canEditRoles: page.canEditRoles,
        onAddPeople: () => page.openDialog({ type: "add-people" }),
        onAddTeam: () => page.openDialog({ type: "add-team" }),
        onRemove: (member) => page.openDialog({ type: "remove", member }),
        onEditRoles: (member) => page.openDialog({ type: "roles", member }),
      }}
      onSaved={page.afterChange}
      onAction={(type) => page.openDialog({ type })}
    />
  );
};

// .../sprints (Scrum only, like the backlog)
export const ProjectSprintsPage = () => {
  const { workspace } = useWorkspaceAccess();
  const { project } = useProjectAccess();
  const page = useProjectPage();
  return (
    <SprintsTab
      workspace={workspace}
      project={project}
      writable={page.writable}
      onOpenBacklog={() => page.goToTab("backlog")}
    />
  );
};

// .../sprints/:sprintId: one sprint's page, ended ones included (the Sprints tab stays selected)
export const ProjectSprintSummaryPage = () => {
  const { workspace } = useWorkspaceAccess();
  const { project } = useProjectAccess();
  const { sprintId } = useParams();
  const page = useProjectPage();
  // remounts for another sprint, so nothing of the previous one shows
  return (
    <SprintSummaryPage
      key={sprintId}
      workspace={workspace}
      project={project}
      sprintId={sprintId}
      writable={page.writable}
      onBack={() => page.goToTab("sprints")}
    />
  );
};

// .../sprints/retros/:retroId: a sprint's retrospective (the Sprints tab stays selected)
export const ProjectRetroPage = () => {
  const { workspace } = useWorkspaceAccess();
  const { project } = useProjectAccess();
  const { retroId } = useParams();
  const page = useProjectPage();
  return (
    <RetroPage key={retroId} workspace={workspace} project={project} retroId={retroId} onBack={() => page.goToTab("sprints")} />
  );
};

// .../reports, /files until they are built
export const ProjectComingSoonPage = ({ tab }) => <ComingSoonPanel title={tabLabel(tab)} />;
export const ProjectMilestonePage = () => {
  const { workspace } = useWorkspaceAccess();
  const { project } = useProjectAccess();
  const { milestoneId } = useParams();
  const page = useProjectPage();
  return (
      <MilestonePage
          key={milestoneId}
          workspace={workspace}
          project={project}
          milestoneId={milestoneId}
          writable={page.writable}
          onBack={() => page.goToTab("overview")}
      />
  );
};
