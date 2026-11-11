import { Link as RouterLink } from "react-router-dom";
import { AvatarGroup, Box, Button, Link, List, ListItemButton, Typography } from "@mui/material";
import { Add, ChevronRight } from "@mui/icons-material";
import SectionCard from "../general/SectionCard";
import LoadState from "../general/LoadState";
import UserAvatar from "../general/UserAvatar";

// the overview's first few teams; each opens on the Teams page (which selects ?team=<id>)
// teams: { items: [{ ...team, memberCount, memberPreview }], total } once loaded
const TeamsPanel = ({ teams, loading, error, onRetry, teamsPath, canCreate, onCreate }) => {
  const items = teams?.items ?? [];

  return (
    <SectionCard
      title="Teams"
      count={teams ? teams.total : undefined}
      toolbar={
        canCreate && (
          <Button size="small" startIcon={<Add />} onClick={onCreate} sx={{ alignSelf: { xs: "flex-start", sm: "auto" } }}>
            Create team
          </Button>
        )
      }
    >
      <LoadState
        loading={loading}
        error={error}
        onRetry={onRetry}
        rows={3}
        isEmpty={items.length === 0}
        emptyMessage={canCreate ? "No teams yet. Create one to group people for projects." : "No teams yet."}
      >
        <List disablePadding>
          {items.map((team) => (
            <ListItemButton
              key={team.id}
              component={RouterLink}
              to={`${teamsPath}?team=${team.id}`}
              sx={{
                gap: 2,
                px: { xs: 2, sm: 2.5 },
                py: 1.25,
                borderBottom: 1,
                borderColor: "divider",
                transition: "background-color 120ms ease",
              }}
            >
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography noWrap sx={{ fontWeight: 500 }}>{team.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
                </Typography>
              </Box>
              {team.memberCount > 0 && (
                <AvatarGroup
                  max={4}
                  total={team.memberCount}
                  sx={{ "& .MuiAvatar-root": { width: 26, height: 26, fontSize: 10, borderColor: "background.paper" } }}
                >
                  {team.memberPreview.map((member) => (
                    <UserAvatar key={member.userId} user={member} size={26} />
                  ))}
                </AvatarGroup>
              )}
            </ListItemButton>
          ))}
        </List>
      </LoadState>

      <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 1.25 }}>
        <Link
          component={RouterLink}
          to={teamsPath}
          variant="body2"
          sx={{ display: "inline-flex", alignItems: "center", fontWeight: 500 }}
        >
          View all teams <ChevronRight fontSize="small" />
        </Link>
      </Box>
    </SectionCard>
  );
};

export default TeamsPanel;
