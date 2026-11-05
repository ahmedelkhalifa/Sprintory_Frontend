import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { Alert, Box, Button, Typography, useMediaQuery } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PageLayout from "../../components/layouts/PageLayout";
import PageHeader from "../../components/general/PageHeader";
import SectionCard from "../../components/general/SectionCard";
import LoadState from "../../components/general/LoadState";
import Pager from "../../components/general/Pager";
import NotFound from "../../components/general/NotFound";
import AuditFilters from "../../components/audit/AuditFilters";
import AuditLogTable from "../../components/audit/AuditLogTable";
import AuditLogCards from "../../components/audit/AuditLogCards";
import { listAuditActors, listAuditLog } from "../../api/auditApi";
import { listProjects } from "../../api/projectsApi";
import { useAsync } from "../../hooks/useAsync";
import { usePagedList } from "../../hooks/usePagedList";
import { useWorkspaceAccess } from "../../hooks/useResourceAccess";
import { AUDIT_PAGE_SIZE } from "../../constants/audit";
import {
  EMPTY_AUDIT_FILTERS,
  auditQuery,
  filtersFromSearchParams,
  filtersToSearchParams,
  hasAuditFilters,
} from "../../utils/audit";
import { isWorkspaceAdmin, workspacePath } from "../../utils/workspace";

const NO_ITEMS = [];

// shown instead of the log to anyone who isn't a workspace admin (a page, not an error toast)
const AdminsOnly = ({ workspace }) => (
  <Box sx={{ textAlign: "center", py: 8, px: 2 }}>
    <LockOutlinedIcon sx={{ fontSize: 48, color: "text.secondary" }} />
    <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mt: 1 }}>
      Only workspace admins can view the audit log
    </Typography>
    <Typography color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
      Ask an admin of {workspace.name} if you need to see who changed what.
    </Typography>
    <Button component={RouterLink} to={workspacePath(workspace)} variant="outlined">
      Back to workspace
    </Button>
  </Box>
);

// /workspaces/:workspaceSlug/audit-log: WorkspaceAccessGuard has loaded the workspace.
// The workspace's key actions, newest first and paged: who did what to what, in which project, when, and what
// changed (old → new). Workspace admins only; the filters (date range, actor, action, project) live in the page url.
// Read-only: the log is append-only and the API has no way to edit or delete an entry.
const AuditLogPage = () => {
  const { workspace } = useWorkspaceAccess();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = isWorkspaceAdmin(workspace);
  // the wide table doesn't fit a phone: one sentence per entry instead
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down("sm"));
  const filters = filtersFromSearchParams(searchParams);
  const filtersKey = JSON.stringify(filters);

  // the dropdowns; if one fails the filter still works, it only offers "Any"
  const actors = useAsync((signal) => listAuditActors(workspace.id, signal), [workspace.id], { enabled: isAdmin });
  const projects = useAsync(
    (signal) => listProjects(workspace.id, { size: 100 }, signal),
    [workspace.id],
    { enabled: isAdmin },
  );

  const log = usePagedList(
    (params, signal) => listAuditLog(workspace.id, { ...auditQuery(filters), ...params }, signal),
    [workspace.id, filtersKey],
    { enabled: isAdmin, size: AUDIT_PAGE_SIZE, fallback: "Couldn't load the audit log. Please try again." },
  );

  // a filter change goes back to the first page
  const applyFilters = (next) => {
    log.setPage(0);
    setSearchParams(filtersToSearchParams(next));
  };
  const filtered = hasAuditFilters(filters);

  const denied = !isAdmin || log.errorCode === "ACCESS_DENIED";

  // the workspace is gone or the user was removed from it since the guard loaded it: its usual not-found screen
  if (log.errorCode === "RESOURCE_NOT_FOUND") {
    return (
      <PageLayout>
        <NotFound title="Workspace not found" backTo="/workspaces" backLabel="Back to workspaces" />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="Audit log"
        subtitle={`${workspace.name} · a read-only record of key actions. Times are in your local time; hover for UTC.`}
        breadcrumb={
          <Button component={RouterLink} to={workspacePath(workspace)} startIcon={<ArrowBackIcon />} color="inherit">
            Back to workspace
          </Button>
        }
      />

      <SectionCard
        title="Entries"
        count={denied || log.loading || log.error ? undefined : log.total}
      >
        {denied ? (
          <AdminsOnly workspace={workspace} />
        ) : (
          <>
            {/* the key resets the draft when the applied filters change (clear, or the browser's back button) */}
            <AuditFilters
              key={filtersKey}
              filters={filters}
              actors={actors.data ?? NO_ITEMS}
              projects={projects.data?.content ?? NO_ITEMS}
              onApply={applyFilters}
              onClear={() => applyFilters(EMPTY_AUDIT_FILTERS)}
            />
            {(actors.error || projects.error) && (
              <Alert severity="warning" sx={{ mx: { xs: 2, sm: 3 }, mb: 2 }}>
                Couldn't load the {actors.error ? "actor" : "project"} list for the filters. The log still works.
              </Alert>
            )}

            <LoadState loading={log.loading} error={log.error} onRetry={log.reload} isEmpty={false} rows={6}>
              {log.items.length === 0 ? (
                <Box sx={{ p: { xs: 3, sm: 5 }, textAlign: "center" }}>
                  <Typography color="text.secondary">
                    {filtered ? "No entries match these filters." : "No activity has been recorded yet."}
                  </Typography>
                  {filtered && (
                    <Button sx={{ mt: 1.5 }} onClick={() => applyFilters(EMPTY_AUDIT_FILTERS)}>
                      Clear filters
                    </Button>
                  )}
                </Box>
              ) : (
                <>
                  {phone ? <AuditLogCards entries={log.items} /> : <AuditLogTable entries={log.items} />}
                  <Pager
                    page={log.page}
                    size={log.size}
                    total={log.total}
                    totalPages={log.totalPages}
                    shown={log.items.length}
                    noun="entry"
                    nounPlural="entries"
                    onPageChange={log.setPage}
                  />
                </>
              )}
            </LoadState>
          </>
        )}
      </SectionCard>
    </PageLayout>
  );
};

export default AuditLogPage;
