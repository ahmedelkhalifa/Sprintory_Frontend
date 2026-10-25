import { Box, Button } from "@mui/material";
import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import SectionCard from "../general/SectionCard";
import SearchField from "../general/SearchField";
import LoadState from "../general/LoadState";
import Pager from "../general/Pager";
import MembersTable from "./MembersTable";
import { listProjectMembers } from "../../api/projectsApi";
import { usePagedList } from "../../hooks/usePagedList";

// The project page's Members tab: every member with their roles, searchable and paged.
// People who may manage members also get Add people / Add team and a remove button per row.
// `version` changes after every add/remove, so the list loads again.
const ProjectMembersTab = ({ project, version, canManage, onAddPeople, onAddTeam, onRemove }) => {
  const members = usePagedList(
    (params, signal) => listProjectMembers(project.id, params, signal),
    [project.id, version],
    { fallback: "Couldn't load the members. Please try again." },
  );
  const query = members.search.trim();

  return (
    <SectionCard
      title="Members"
      count={members.loading || members.error ? undefined : members.total}
      toolbar={
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
          <SearchField value={members.search} onChange={members.setSearch} placeholder="Search members" />
          {canManage && (
            <>
              <Button variant="outlined" startIcon={<GroupAddOutlinedIcon />} onClick={onAddTeam}>
                Add team
              </Button>
              <Button variant="contained" startIcon={<PersonAddAlt1OutlinedIcon />} onClick={onAddPeople}>
                Add people
              </Button>
            </>
          )}
        </Box>
      }
    >
      <LoadState
        loading={members.loading}
        error={members.error}
        onRetry={members.reload}
        isEmpty={members.items.length === 0}
        emptyMessage={query ? `No members match "${query}".` : "This project has no members yet."}
      >
        <MembersTable members={members.items} template={project.template} onRemove={canManage ? onRemove : undefined} />
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
  );
};

export default ProjectMembersTab;
