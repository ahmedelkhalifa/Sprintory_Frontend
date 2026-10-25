import { useState } from "react";
import { Alert } from "@mui/material";
import PageLayout from "../../components/layouts/PageLayout";
import PageHeader from "../../components/general/PageHeader";
import SectionCard from "../../components/general/SectionCard";
import SearchField from "../../components/general/SearchField";
import LoadState from "../../components/general/LoadState";
import Pager from "../../components/general/Pager";
import ProjectsTable from "../../components/projects/ProjectsTable";
import ProjectStatusTabs, { ALL_PROJECTS } from "../../components/projects/ProjectStatusTabs";
import { listWorkspaceProjects } from "../../api/projectsApi";
import { useCurrentWorkspace } from "../../hooks/useCurrentWorkspace";
import { usePagedList } from "../../hooks/usePagedList";
import { useMembersPreview, useProjectTabCounts } from "../../hooks/useProjectsOverview";
import { PROJECT_STATUS } from "../../constants/projects";

const EMPTY_MESSAGES = {
  [ALL_PROJECTS]: "You're not in any project yet.",
  [PROJECT_STATUS.ACTIVE]: "No active projects.",
  [PROJECT_STATUS.ARCHIVED]: "No archived projects.",
};

// /projects: the projects of the current workspace, by tab (all / active / archived), searchable and paged
const ProjectsPage = () => {
  const workspace = useCurrentWorkspace();
  const [tab, setTab] = useState(ALL_PROJECTS);
  const workspaceId = workspace.workspace?.id;

  const list = usePagedList(
    (params) => listWorkspaceProjects(workspaceId, { ...params, status: tab === ALL_PROJECTS ? undefined : tab }),
    [workspaceId, tab],
    { enabled: Boolean(workspaceId), messages: { fallback: "Couldn't load your projects. Please try again." } },
  );
  const counts = useProjectTabCounts(workspaceId);
  const previews = useMembersPreview(list.items.map((project) => project.id));

  const changeTab = (next) => {
    setTab(next);
    list.setPage(0);
  };

  const noWorkspace = !workspace.loading && !workspace.error && !workspace.workspace;
  const query = list.search.trim();

  return (
    <PageLayout>
      <PageHeader
        title="Projects"
        subtitle={workspace.workspace ? `All projects in ${workspace.workspace.name}.` : "Plan and track your team's work."}
      />

      {workspace.workspace?.isArchived && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This workspace is archived. Projects are read-only.
        </Alert>
      )}

      <SectionCard
        header={<ProjectStatusTabs value={tab} onChange={changeTab} counts={counts} />}
        toolbar={<SearchField value={list.search} onChange={list.setSearch} placeholder="Search projects" />}
      >
        <LoadState
          loading={workspace.loading || (!noWorkspace && list.loading)}
          error={workspace.error || list.error}
          onRetry={workspace.error ? workspace.reload : list.reload}
          isEmpty={noWorkspace || list.items.length === 0}
          emptyMessage={
            noWorkspace
              ? "You're not in any workspace yet."
              : query
                ? `No projects match "${query}".`
                : EMPTY_MESSAGES[tab]
          }
        >
          <ProjectsTable projects={list.items} previews={previews} />
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
    </PageLayout>
  );
};

export default ProjectsPage;
