import { Link as RouterLink, useParams } from "react-router-dom";
import { Box, Breadcrumbs, Link, Skeleton, Typography } from "@mui/material";
import PageLayout from "../../components/layouts/PageLayout";
import PageHeader from "../../components/general/PageHeader";
import SectionCard from "../../components/general/SectionCard";
import SearchField from "../../components/general/SearchField";
import LoadState from "../../components/general/LoadState";
import Pager from "../../components/general/Pager";
import ProjectAvatar from "../../components/projects/ProjectAvatar";
import ProjectNotFound from "../../components/projects/ProjectNotFound";
import MembersTable from "../../components/projects/MembersTable";
import TemplateChip from "../../components/projects/TemplateChip";
import StatusChip from "../../components/projects/StatusChip";
import RoleChip from "../../components/projects/RoleChip";
import { getProject, listProjectMembers } from "../../api/projectsApi";
import { useAsync } from "../../hooks/useAsync";
import { usePagedList } from "../../hooks/usePagedList";

const PROJECT_ERRORS = { fallback: "Couldn't load the project. Please try again." };
const MEMBER_ERRORS = { fallback: "Couldn't load the members. Please try again." };

// template, status and the user's own roles under the project name
const ProjectDetails = ({ project }) => (
  <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
    <TemplateChip template={project.template} />
    <StatusChip status={project.status} />
    {project.roles.length > 0 && (
      <>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
          Your role:
        </Typography>
        {project.roles.map((role) => (
          <RoleChip key={role} role={role} template={project.template} />
        ))}
      </>
    )}
  </Box>
);

// /projects/:projectId: one project and its members
const ProjectPage = () => {
  const { projectId } = useParams();
  const projectState = useAsync(() => getProject(projectId), [projectId], { messages: PROJECT_ERRORS });
  const project = projectState.data;

  const members = usePagedList((params) => listProjectMembers(projectId, params), [projectId], {
    enabled: Boolean(project),
    messages: MEMBER_ERRORS,
  });

  if (projectState.errorCode === "RESOURCE_NOT_FOUND") {
    return (
      <PageLayout>
        <ProjectNotFound />
      </PageLayout>
    );
  }

  const query = members.search.trim();

  return (
    <PageLayout>
      <PageHeader
        breadcrumb={
          <Breadcrumbs>
            <Link component={RouterLink} to="/projects" underline="hover" color="text.secondary">
              Projects
            </Link>
            <Typography color="text.primary">{project?.name ?? "…"}</Typography>
          </Breadcrumbs>
        }
        avatar={
          project ? (
            <ProjectAvatar project={project} size={56} />
          ) : (
            projectState.loading && <Skeleton variant="rounded" width={56} height={56} />
          )
        }
        title={project?.name ?? (projectState.loading ? <Skeleton width={240} /> : "Project")}
        subtitle={project && <ProjectDetails project={project} />}
      />

      <SectionCard
        title="Members"
        count={members.loading || members.error || !project ? undefined : members.total}
        toolbar={<SearchField value={members.search} onChange={members.setSearch} placeholder="Search members" />}
      >
        <LoadState
          loading={projectState.loading || (Boolean(project) && members.loading)}
          error={projectState.error || members.error}
          onRetry={projectState.error ? projectState.reload : members.reload}
          isEmpty={members.items.length === 0}
          emptyMessage={query ? `No members match "${query}".` : "This project has no members yet."}
        >
          <MembersTable members={members.items} template={project?.template} />
          <Pager
            page={members.page}
            size={members.size}
            total={members.total}
            totalPages={members.totalPages}
            shown={members.items.length}
            noun="member"
            onPageChange={members.setPage}
          />
        </LoadState>
      </SectionCard>
    </PageLayout>
  );
};

export default ProjectPage;
