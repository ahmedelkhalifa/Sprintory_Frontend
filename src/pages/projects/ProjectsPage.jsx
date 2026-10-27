import { useState } from "react";
import { Alert, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PageLayout from "../../components/layouts/PageLayout";
import PageHeader from "../../components/general/PageHeader";
import SectionCard from "../../components/general/SectionCard";
import SearchField from "../../components/general/SearchField";
import LoadState from "../../components/general/LoadState";
import Pager from "../../components/general/Pager";
import ProjectsTable from "../../components/projects/ProjectsTable";
import ProjectStatusTabs, { ALL_PROJECTS } from "../../components/projects/ProjectStatusTabs";
import ProjectActionsMenu from "../../components/projects/ProjectActionsMenu";
import CreateProjectDialog from "../../components/projects/CreateProjectDialog";
import EditProjectDialog from "../../components/projects/EditProjectDialog";
import ProjectStatusDialog from "../../components/projects/ProjectStatusDialog";
import { listProjects } from "../../api/projectsApi";
import { usePagedList } from "../../hooks/usePagedList";
import { useMembersPreview, useProjectTabCounts } from "../../hooks/useProjectsOverview";
import { useWorkspaceAccess } from "../../hooks/useResourceAccess";
import { isWorkspaceArchived } from "../../utils/workspace";
import { PROJECT_STATUS } from "../../constants/projects";

const PROJECTS_PER_PAGE = 10;

const EMPTY_MESSAGES = {
  [ALL_PROJECTS]: "You're not in any project yet.",
  [PROJECT_STATUS.ACTIVE]: "No active projects.",
  [PROJECT_STATUS.ARCHIVED]: "No archived projects.",
};

// /workspaces/:workspaceId/projects: WorkspaceAccessGuard has loaded the workspace
// (and remounts this page when the workspace changes, so nothing from the previous one is shown).
// The workspace's projects, by tab (all / active / archived), searchable and paged.
// Any member of an active workspace can create a project; the ⋮ menu shows what each project allows.
const ProjectsPage = () => {
  const { workspace } = useWorkspaceAccess();
  const workspaceId = workspace.id;
  const [tab, setTab] = useState(ALL_PROJECTS);
  // which window is open: { type: "create" } or { type: "edit" | "archive" | "restore" | "delete", project }
  const [dialog, setDialog] = useState(null);
  // bumped after every change, so the tab counts are fetched again
  const [version, setVersion] = useState(0);
  const readOnly = isWorkspaceArchived(workspace);

  const list = usePagedList(
    (params, signal) =>
      listProjects(workspaceId, { ...params, status: tab === ALL_PROJECTS ? undefined : tab }, signal),
    [workspaceId, tab],
    {
      size: PROJECTS_PER_PAGE,
      fallback: "Couldn't load your projects. Please try again.",
    },
  );
  const counts = useProjectTabCounts(workspaceId, version);
  const previews = useMembersPreview(list.items.map((project) => project.id));

  const changeTab = (next) => {
    setTab(next);
    list.setPage(0);
  };

  const closeDialog = () => setDialog(null);
  const afterChange = () => {
    closeDialog();
    list.reload();
    setVersion((v) => v + 1);
  };

  const query = list.search.trim();

  return (
    <PageLayout>
      <PageHeader
        title="Projects"
        subtitle={`All projects in ${workspace.name}.`}
        actions={
          !readOnly && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ type: "create" })}>
              Create project
            </Button>
          )
        }
      />

      {readOnly && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This workspace is archived. Projects are read-only.
        </Alert>
      )}

      <SectionCard
        header={<ProjectStatusTabs value={tab} onChange={changeTab} counts={counts} />}
        toolbar={<SearchField value={list.search} onChange={list.setSearch} placeholder="Search projects" />}
      >
        <LoadState
          loading={list.loading}
          error={list.error}
          onRetry={list.reload}
          isEmpty={list.items.length === 0}
          emptyMessage={query ? `No projects match "${query}".` : EMPTY_MESSAGES[tab]}
        >
          <ProjectsTable
            projects={list.items}
            previews={previews}
            renderActions={
              readOnly
                ? undefined
                : (project) => (
                    <ProjectActionsMenu project={project} onAction={(type, target) => setDialog({ type, project: target })} />
                  )
            }
          />
          <Pager
            page={list.page}
            size={list.size}
            total={list.total}
            totalPages={list.totalPages}
            shown={list.items.length}
            noun="project"
            onPageChange={list.setPage}
          />
        </LoadState>
      </SectionCard>

      {dialog?.type === "create" && <CreateProjectDialog workspaceId={workspaceId} onClose={closeDialog} />}
      {dialog?.type === "edit" && <EditProjectDialog project={dialog.project} onClose={closeDialog} onSaved={afterChange} />}
      {["archive", "restore", "delete"].includes(dialog?.type) && (
        <ProjectStatusDialog action={dialog.type} project={dialog.project} onClose={closeDialog} onDone={afterChange} />
      )}
    </PageLayout>
  );
};

export default ProjectsPage;
