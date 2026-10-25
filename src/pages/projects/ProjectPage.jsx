import { useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { Alert, Box, Breadcrumbs, Button, Link, Skeleton, Typography } from "@mui/material";
import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
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
import AddPeopleDialog from "../../components/projects/AddPeopleDialog";
import AddTeamDialog from "../../components/projects/AddTeamDialog";
import RemoveMemberDialog from "../../components/projects/RemoveMemberDialog";
import { getProject, listProjectMembers } from "../../api/projectsApi";
import { getWorkspace } from "../../api/workspacesApi";
import { useAsync } from "../../hooks/useAsync";
import { usePagedList } from "../../hooks/usePagedList";
import { can } from "../../utils/permissions";
import { PERMISSIONS, PROJECT_STATUS } from "../../constants/projects";

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

// /projects/:projectId: one project and its members.
// Project Managers and workspace admins (permission MANAGE_MEMBERS) can add people, add a team and remove people.
const ProjectPage = () => {
  const { projectId } = useParams();
  // which window is open: { type: "add-people" | "add-team" } or { type: "remove", member }
  const [dialog, setDialog] = useState(null);

  const projectState = useAsync(() => getProject(projectId), [projectId], { messages: PROJECT_ERRORS });
  const project = projectState.data;
  // the project's workspace: archived workspaces are read-only
  const workspaceState = useAsync(() => getWorkspace(project.workspaceId), [project?.workspaceId], {
    enabled: Boolean(project),
  });

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

  const workspaceArchived = Boolean(workspaceState.data?.isArchived);
  const projectArchived = project?.status === PROJECT_STATUS.ARCHIVED;
  // hiding is only for usability: the backend refuses these changes anyway
  const canManage =
    can(project, PERMISSIONS.MANAGE_MEMBERS) && Boolean(workspaceState.data) && !workspaceArchived && !projectArchived;

  const closeDialog = () => setDialog(null);
  const afterChange = () => {
    closeDialog();
    members.reload();
    projectState.reload(); // the user's own roles may have changed (or they removed themselves)
  };

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
        actions={
          canManage && (
            <>
              <Button variant="outlined" startIcon={<GroupAddOutlinedIcon />} onClick={() => setDialog({ type: "add-team" })}>
                Add team
              </Button>
              <Button
                variant="contained"
                startIcon={<PersonAddAlt1OutlinedIcon />}
                onClick={() => setDialog({ type: "add-people" })}
              >
                Add people
              </Button>
            </>
          )
        }
      />

      {(workspaceArchived || projectArchived) && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {workspaceArchived
            ? "This workspace is archived. Projects are read-only."
            : "This project is archived. Restore it from the projects list to make changes."}
        </Alert>
      )}

      <SectionCard
        title="Members"
        count={members.loading || members.error || !project ? undefined : members.total}
        toolbar={<SearchField value={members.search} onChange={members.setSearch} placeholder="Search members" />}
      >
        <LoadState
          loading={(!project && projectState.loading) || (Boolean(project) && members.loading)}
          error={projectState.error || members.error}
          onRetry={projectState.error ? projectState.reload : members.reload}
          isEmpty={members.items.length === 0}
          emptyMessage={query ? `No members match "${query}".` : "This project has no members yet."}
        >
          <MembersTable
            members={members.items}
            template={project?.template}
            onRemove={canManage ? (member) => setDialog({ type: "remove", member }) : undefined}
          />
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

      {dialog?.type === "add-people" && <AddPeopleDialog project={project} onClose={closeDialog} onAdded={afterChange} />}
      {dialog?.type === "add-team" && <AddTeamDialog project={project} onClose={closeDialog} onAdded={afterChange} />}
      {dialog?.type === "remove" && (
        <RemoveMemberDialog project={project} member={dialog.member} onClose={closeDialog} onRemoved={afterChange} />
      )}
    </PageLayout>
  );
};

export default ProjectPage;
