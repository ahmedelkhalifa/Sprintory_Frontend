import { useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { Breadcrumbs, Link, Skeleton, Typography } from "@mui/material";
import PageLayout from "../../components/layouts/PageLayout";
import PageHeader from "../../components/general/PageHeader";
import SectionCard from "../../components/general/SectionCard";
import SearchField from "../../components/general/SearchField";
import LoadState from "../../components/general/LoadState";
import ProjectAvatar from "../../components/projects/ProjectAvatar";
import MembersTable from "../../components/projects/MembersTable";
import { useProjectMembers } from "../../hooks/useProjectMembers";

// does the member's name or email contain the search text?
const matches = (member, query) =>
  [`${member.firstName} ${member.lastName}`, member.email].some((text) => text?.toLowerCase().includes(query));

// /projects/:projectId: one project and its members
const ProjectPage = () => {
  const { projectId } = useParams();
  const { project, members, loading, error, reload } = useProjectMembers(projectId);
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();
  const visible = query ? members.filter((member) => matches(member, query)) : members;

  // while loading show placeholders; if loading failed, a neutral title (the error shows in the card)
  const title = project?.name ?? (loading ? <Skeleton width={240} /> : "Project");

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
            loading && <Skeleton variant="rounded" width={56} height={56} />
          )
        }
        title={title}
        subtitle={project?.description}
      />

      <SectionCard
        title="Members"
        count={loading || error ? undefined : members.length}
        toolbar={<SearchField value={search} onChange={setSearch} placeholder="Search members" />}
      >
        <LoadState
          loading={loading}
          error={error}
          onRetry={reload}
          isEmpty={visible.length === 0}
          emptyMessage={query ? `No members match "${search.trim()}".` : "This project has no members yet."}
        >
          <MembersTable members={visible} />
        </LoadState>
      </SectionCard>
    </PageLayout>
  );
};

export default ProjectPage;
