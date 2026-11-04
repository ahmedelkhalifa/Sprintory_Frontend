import { useState } from "react";
import { Divider, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

// The "⋯" menu in a column's header, for people who configure the board. `rules` (columnRules in utils/board.js)
// say what this column allows; a delete that isn't allowed stays in the menu with the reason under it.
const ColumnMenu = ({ column, rules, onEdit, onMoveLeft, onMoveRight, onEditWip, onClearWip, onDelete }) => {
  const [anchor, setAnchor] = useState(null);
  const close = () => setAnchor(null);
  const run = (action) => () => {
    close();
    action();
  };
  const hasLimit = column.wipLimit != null;

  return (
    <>
      <Tooltip title="Column actions">
        <IconButton size="small" aria-label={`Actions for ${column.name}`} onClick={(event) => setAnchor(event.currentTarget)}>
          <MoreHorizIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close} slotProps={{ paper: { sx: { minWidth: 230 } } }}>
        <MenuItem onClick={run(onEdit)}>
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit column</ListItemText>
        </MenuItem>
        <MenuItem disabled={!rules.canMoveLeft} onClick={run(onMoveLeft)}>
          <ListItemIcon>
            <ArrowBackRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Move left</ListItemText>
        </MenuItem>
        <MenuItem disabled={!rules.canMoveRight} onClick={run(onMoveRight)}>
          <ListItemIcon>
            <ArrowForwardRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Move right</ListItemText>
        </MenuItem>
        {rules.canSetWip && <Divider />}
        {rules.canSetWip && (
          <MenuItem onClick={run(onEditWip)}>
            <ListItemIcon>
              <SpeedOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{hasLimit ? "Change WIP limit" : "Set WIP limit"}</ListItemText>
          </MenuItem>
        )}
        {rules.canSetWip && hasLimit && (
          <MenuItem onClick={run(onClearWip)}>
            <ListItemText inset>Remove WIP limit</ListItemText>
          </MenuItem>
        )}
        <Divider />
        <MenuItem disabled={!rules.canDelete} onClick={run(onDelete)} sx={{ color: "error.main" }}>
          <ListItemIcon sx={{ color: "inherit" }}>
            <DeleteOutlineRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText secondary={rules.keepReason}>Delete column</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default ColumnMenu;
