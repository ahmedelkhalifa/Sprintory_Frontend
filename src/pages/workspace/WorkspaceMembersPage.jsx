import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Alert, Box, Button, Snackbar } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";
import PageLayout from "../../components/layouts/PageLayout";
import PageHeader from "../../components/general/PageHeader";
import SectionCard from "../../components/general/SectionCard";
import SearchField from "../../components/general/SearchField";
import LoadState from "../../components/general/LoadState";
import Pager from "../../components/general/Pager";
import WorkspaceMembersTable from "../../components/workspace/WorkspaceMembersTable";
import InviteDialog from "../../components/workspace/InviteDialog";
import { changeWorkspaceMemberRole, listWorkspaceMembers } from "../../api/workspacesApi";
import { useAuth } from "../../context/AuthContext";
import { usePagedList } from "../../hooks/usePagedList";
import { useSubmit } from "../../hooks/useSubmit";
import { useWorkspaceAccess } from "../../hooks/useResourceAccess";
import { WORKSPACE_ERROR_MESSAGES } from "../../constants/workspaces";
import { memberLabel } from "../../utils/people";
import { ROLE_LABEL, isWorkspaceAdmin, isWorkspaceArchived } from "../../utils/workspace";

// /workspaces/:workspaceId/members: WorkspaceAccessGuard has loaded the workspace
// (and remounts this page when the workspace changes).
// Everyone in the workspace sees its members and their roles. Workspace admins can switch a member between
// Admin and Member (and invite people); the backend refuses to leave the workspace without an admin.
const WorkspaceMembersPage = () => {
  const { user } = useAuth();
  const { workspace, reloadWorkspace } = useWorkspaceAccess();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [notice, setNotice] = useState("");
  const submit = useSubmit(WORKSPACE_ERROR_MESSAGES);

  const members = usePagedList(
    (params, signal) => listWorkspaceMembers(workspace.id, params, signal),
    [workspace.id],
    { fallback: "Couldn't load the members. Please try again." },
  );
  const query = members.search.trim();

  const archived = isWorkspaceArchived(workspace);
  // hiding is only for usability, the backend refuses anyway
  const isAdmin = isWorkspaceAdmin(workspace);
  const canChange = isAdmin && !archived;

  const handleChangeRole = async (member, role) => {
    if (role === member.role) return;
    setSavingId(member.userId);
    const { ok } = await submit.run(() => changeWorkspaceMemberRole(workspace.id, member.userId, role));
    setSavingId(null);
    if (!ok) return;
    setNotice(`${memberLabel(member)} is now ${ROLE_LABEL[role]}.`);
    members.reload();
    // the user's own role decides what this page and the workspace show
    if (member.userId === user?.id) reloadWorkspace();
  };

  return (
    <PageLayout>
      <PageHeader
        title="Members"
        subtitle={workspace.name}
        breadcrumb={
          <Button component={RouterLink} to={`/workspaces/${workspace.id}`} startIcon={<ArrowBackIcon />} color="inherit">
            Back to workspace
          </Button>
        }
        actions={
          canChange && (
            <Button variant="contained" startIcon={<PersonAddAlt1OutlinedIcon />} onClick={() => setInviteOpen(true)}>
              Invite people
            </Button>
          )
        }
      />

      {archived && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This workspace is archived. Roles are read-only.
        </Alert>
      )}
      {submit.error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={submit.clearError}>
          {submit.error}
        </Alert>
      )}

      <SectionCard
        title="Members"
        count={members.loading || members.error ? undefined : members.total}
        toolbar={
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
            <SearchField value={members.search} onChange={members.setSearch} placeholder="Search members" />
          </Box>
        }
      >
        <LoadState
          loading={members.loading}
          error={members.error}
          onRetry={members.reload}
          isEmpty={members.items.length === 0}
          emptyMessage={query ? `No members match "${query}".` : "This workspace has no members yet."}
        >
          <WorkspaceMembersTable
            members={members.items}
            canChange={canChange}
            currentUserId={user?.id}
            savingId={savingId}
            onChangeRole={handleChangeRole}
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

      {canChange && <InviteDialog open={inviteOpen} workspaceId={workspace.id} onClose={() => setInviteOpen(false)} />}
      <Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice("")} message={notice} />
    </PageLayout>
  );
};

export default WorkspaceMembersPage;
