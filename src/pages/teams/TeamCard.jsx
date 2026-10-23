import { useState } from "react";
import { Avatar, Box, ButtonBase, Card, IconButton, Menu, MenuItem, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { DeleteOutlineRounded, EditOutlined, FolderOutlined, MoreHorizRounded } from "@mui/icons-material";
import { demoMembers } from "./teamsDemoData";
import { PersonAvatar, TeamIcon } from "./TeamVisuals";

const memberById = new Map(demoMembers.map((member) => [member.id, member]));

export default function TeamCard({ team, selected, onSelect, onEdit, onDelete }) {
  const [anchor, setAnchor] = useState(null);
  const members = team.members.map((id) => memberById.get(id)).filter(Boolean);

  return (
    <Card
      component="article"
      sx={{
        position: "relative",
        borderColor: selected ? "primary.main" : "divider",
        borderWidth: selected ? 2 : 1,
        bgcolor: "background.paper",
        boxShadow: "none",
        borderRadius: 2,
        transition: "border-color 130ms ease",
      }}
    >
      <ButtonBase
        onClick={onSelect}
        aria-label={`View ${team.name} team details`}
        aria-pressed={selected}
        sx={{
          width: "100%",
          textAlign: "left",
          alignItems: "flex-start",
          display: "flex",
          gap: { xs: 1.5, sm: 2 },
          p: { xs: 2, sm: 2.5 },
          pr: { xs: 5, sm: 6 },
        }}
      >
        <TeamIcon name={team.name} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 750, color: "text.primary", lineHeight: 1.3, mb: 0.5, overflowWrap: "anywhere" }}>
            {team.name}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.5, overflowWrap: "anywhere", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden" }}>
            {team.description || "No description yet."}
          </Typography>
          <Stack direction="row" sx={{ alignItems: "center", flexWrap: "wrap", gap: { xs: 1, sm: 1.75 }, mt: 1.5, color: "text.secondary" }}>
            <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0, gap: 0.4 }} aria-label={`${members.length} team members`}>
              {members.slice(0, 3).map((member) => <PersonAvatar key={member.id} member={member} size={29} />)}
              {members.length > 3 && (
                <Avatar sx={(theme) => ({ width: 29, height: 29, fontSize: "0.72rem", bgcolor: alpha(theme.palette.primary.main, 0.11), color: "primary.dark" })}>
                  +{members.length - 3}
                </Avatar>
              )}
            </Box>
            <Typography variant="caption" sx={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>{members.length} members</Typography>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.6 }}>
              <FolderOutlined sx={{ fontSize: 17 }} />
              <Typography variant="caption" sx={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>{team.projects.length} projects</Typography>
            </Box>
          </Stack>
        </Box>
      </ButtonBase>
      <IconButton
        aria-label={`Actions for ${team.name}`}
        size="small"
        sx={{ position: "absolute", right: 11, top: 13, color: "text.secondary" }}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        <MoreHorizRounded />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        <MenuItem onClick={() => { setAnchor(null); onEdit(); }}><EditOutlined fontSize="small" sx={{ mr: 1.25 }} />Edit team</MenuItem>
        <MenuItem onClick={() => { setAnchor(null); onDelete(); }} sx={{ color: "error.main" }}><DeleteOutlineRounded fontSize="small" sx={{ mr: 1.25 }} />Delete team</MenuItem>
      </Menu>
    </Card>
  );
}

