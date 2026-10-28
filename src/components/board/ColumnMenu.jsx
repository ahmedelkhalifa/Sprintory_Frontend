import { useState } from "react";
import { Divider, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

// The "⋯" menu in a column's header. WIP limits and deleting are Kanban features, so they show only when `kanban`.
const ColumnMenu = ({ column, kanban, canMoveLeft, canMoveRight, onRename, onMoveLeft, onMoveRight, onEditWip, onClearWip, onDelete }) => {
    const [anchor, setAnchor] = useState(null);
    const close = () => setAnchor(null);
    const run = (action) => () => {
        close();
        action();
    };
    const hasLimit = column.wipLimit != null;
    const empty = column.tasks.length === 0;

    return (
        <>
            <Tooltip title="Column actions">
                <IconButton size="small" aria-label={`Actions for ${column.name}`} onClick={(event) => setAnchor(event.currentTarget)}>
                    <MoreHorizIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close} slotProps={{ paper: { sx: { minWidth: 220 } } }}>
                <MenuItem onClick={run(onRename)}>
                    <ListItemIcon><EditOutlinedIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Rename</ListItemText>
                </MenuItem>
                <MenuItem disabled={!canMoveLeft} onClick={run(onMoveLeft)}>
                    <ListItemIcon><ArrowBackRoundedIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Move left</ListItemText>
                </MenuItem>
                <MenuItem disabled={!canMoveRight} onClick={run(onMoveRight)}>
                    <ListItemIcon><ArrowForwardRoundedIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Move right</ListItemText>
                </MenuItem>
                {kanban && <Divider />}
                {kanban && (
                    <MenuItem onClick={run(onEditWip)}>
                        <ListItemIcon><SpeedOutlinedIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>{hasLimit ? "Change WIP limit" : "Set WIP limit"}</ListItemText>
                    </MenuItem>
                )}
                {kanban && hasLimit && (
                    <MenuItem onClick={run(onClearWip)}>
                        <ListItemText inset>Remove WIP limit</ListItemText>
                    </MenuItem>
                )}
                {kanban && <Divider />}
                {kanban && (
                    <MenuItem disabled={!empty} onClick={run(onDelete)} sx={{ color: "error.main" }}>
                        <ListItemIcon sx={{ color: "inherit" }}><DeleteOutlineRoundedIcon fontSize="small" /></ListItemIcon>
                        <ListItemText secondary={empty ? null : "Move its tasks out first"}>Delete column</ListItemText>
                    </MenuItem>
                )}
            </Menu>
        </>
    );
};

export default ColumnMenu;