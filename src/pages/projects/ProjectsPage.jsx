import { useState } from "react";
import PageLayout from "../../components/layouts/PageLayout";
import PageHeader from "../../components/general/PageHeader";
import SectionCard from "../../components/general/SectionCard";
import SearchField from "../../components/general/SearchField";
import LoadState from "../../components/general/LoadState";
import ProjectsTable from "../../components/projects/ProjectsTable";
import { useProjects } from "../../hooks/useProjects";

// does the project's name, key or description contain the search text?
const matches = (project, query) =>
  [project.name, project.key, project.description].some((text) => text?.toLowerCase().includes(query));

// /projects: every project the user is part of
const ProjectsPage = () => {
  const { projects, loading, error, reload } = useProjects();
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();
  const visible = query ? projects.filter((project) => matches(project, query)) : projects;

  return (
    <PageLayout>
      <PageHeader title="Projects" subtitle="All projects you're part of. Open one to see its members." />

      <SectionCard
        title="All projects"
        count={loading || error ? undefined : projects.length}
        toolbar={<SearchField value={search} onChange={setSearch} placeholder="Search projects" />}
      >
        <LoadState
          loading={loading}
          error={error}
          onRetry={reload}
          isEmpty={visible.length === 0}
          emptyMessage={query ? `No projects match "${search.trim()}".` : "You're not part of any project yet."}
        >
          <ProjectsTable projects={visible} />
        </LoadState>
      </SectionCard>
    </PageLayout>
  );
};

export default ProjectsPage;
