import { Box, ButtonBase, Card, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import { DeleteOutlineRounded, EditOutlined, MoreHorizRounded } from "@mui/icons-material";
import { useState } from "react";
import { TeamIcon } from "./TeamVisuals";

export default function TeamCard({ team, selected, canManage, onSelect, onEdit, onDelete }) {
  const [menuAnchor, setMenuAnchor] = useState(null);
  return (
    <Card component="article" sx={{ position: "relative", minWidth: 0, borderWidth: selected ? 2 : 1, borderColor: selected ? "primary.main" : "divider", bgcolor: "background.paper", boxShadow: "none", borderRadius: 2 }}>
      <ButtonBase onClick={onSelect} aria-pressed={selected} aria-label={`View ${team.name} team details`}
        sx={{ width: "100%", textAlign: "left", display: "flex", justifyContent: "flex-start", gap: 2, p: { xs: 2, sm: 2.5 }, pr: canManage ? 6 : 2 }}>
        <TeamIcon name={team.name} size={48} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 750, overflowWrap: "anywhere" }}>{team.name}</Typography>
          <Typography variant="caption" color="text.secondary">Team in this workspace</Typography>
        </Box>
      </ButtonBase>
      {canManage && (
        <>
          <IconButton aria-label={`Actions for ${team.name}`} size="small" sx={{ position: "absolute", right: 12, top: 12 }} onClick={(event) => setMenuAnchor(event.currentTarget)}>
            <MoreHorizRounded />
          </IconButton>
          <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
            <MenuItem onClick={() => { setMenuAnchor(null); onEdit(); }}><EditOutlined sx={{ mr: 1 }} fontSize="small" />Rename team</MenuItem>
            <MenuItem onClick={() => { setMenuAnchor(null); onDelete(); }} sx={{ color: "error.main" }}><DeleteOutlineRounded sx={{ mr: 1 }} fontSize="small" />Delete team</MenuItem>
          </Menu>
        </>
      )}
    </Card>
  );
}
