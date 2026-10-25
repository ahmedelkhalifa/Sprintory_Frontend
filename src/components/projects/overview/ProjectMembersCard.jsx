import { Box, Button, Skeleton, Tooltip, Typography } from "@mui/material";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import AddIcon from "@mui/icons-material/Add";
import OverviewCard from "./OverviewCard";
import UserAvatar from "../../general/UserAvatar";
import { PROJECT_MANAGER, projectRoleLabel } from "../../../constants/roles";

const SHOWN = 5;
const isManager = (member) => member.roles.includes(PROJECT_MANAGER);

// "Project members" card: up to 5 members with their role, Project Managers first (with a crown).
// "See all" opens the Members tab, "Add member" opens the Add people window.
const ProjectMembersCard = ({ project, preview, loading, canManage, onSeeAll, onAdd }) => {
  // sort is stable, so people keep the backend's alphabetical order within each group
  const shown = loading ? [] : [...preview.items].sort((a, b) => isManager(b) - isManager(a)).slice(0, SHOWN);

  return (
    <OverviewCard
      Icon={GroupOutlinedIcon}
      title="Project members"
      action={
        <Button size="small" onClick={onSeeAll} sx={{ fontWeight: 600 }}>
          See all{preview ? ` (${preview.total})` : ""}
        </Button>
      }
    >
      <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 1 }}>
        {loading
          ? [0, 1, 2].map((i) => <Skeleton key={i} height={52} />)
          : shown.map((member) => {
              return (
                <Box key={member.userId} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
                  <UserAvatar user={member} size={38} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: 15 }} noWrap>
                      {member.firstName} {member.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {member.roles.map((role) => projectRoleLabel(role, project.template)).join(", ")}
                    </Typography>
                  </Box>
                  {isManager(member) && (
                    <Tooltip title="Project Manager">
                      <WorkspacePremiumOutlinedIcon fontSize="small" sx={{ color: "warning.main" }} />
                    </Tooltip>
                  )}
                </Box>
              );
            })}

        {canManage && (
          <Button
            fullWidth
            startIcon={<AddIcon />}
            onClick={onAdd}
            sx={{ my: 1.5, py: 1, border: "1px dashed", borderColor: "divider", fontWeight: 600 }}
          >
            Add member
          </Button>
        )}
      </Box>
    </OverviewCard>
  );
};

export default ProjectMembersCard;
