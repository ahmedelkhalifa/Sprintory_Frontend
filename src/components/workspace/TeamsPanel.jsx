import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Card, Divider, Link, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Add, ChevronRight, GroupsOutlined } from "@mui/icons-material";
import { initials } from "../../utils/people";
import MemberStack from "./MemberStack";

// first few teams of the workspace on the overview; the full list is on teamsPath
const TeamsPanel = ({ teams, teamsPath, canCreate, onCreate }) => {
  return (
    <Card>
      <Box sx={{ p: 2.5, pb: 1.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <GroupsOutlined />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Teams</Typography>
          </Box>
          {canCreate && <Button size="small" startIcon={<Add />} onClick={onCreate}>Create team</Button>}
        </Box>
        <Typography variant="body2" color="text.secondary">Teams in this workspace.</Typography>
      </Box>
      <Divider />

      <Box sx={{ p: 1 }}>
        {teams.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 1.25 }}>No teams yet.</Typography>
        )}
        {teams.map((t) => (
          <Box key={t.id} sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.25 }}>
            <Box
              sx={(theme) => ({
                width: 40,
                height: 40,
                borderRadius: 1.5,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 13,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: "primary.main",
              })}
            >
              {initials(t.name)}
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 600 }} noWrap>{t.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t.memberCount} {t.memberCount === 1 ? "member" : "members"}
              </Typography>
            </Box>
            <MemberStack members={t.memberPreview} total={t.memberCount} />
          </Box>
        ))}
      </Box>
      <Divider />

      <Box sx={{ p: 2 }}>
        <Link component={RouterLink} to={teamsPath} underline="none" sx={{ display: "flex", alignItems: "center" }}>
          View all teams <ChevronRight fontSize="small" />
        </Link>
      </Box>
    </Card>
  );
};

export default TeamsPanel;
