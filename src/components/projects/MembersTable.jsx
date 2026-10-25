import {
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import PersonRemoveOutlinedIcon from "@mui/icons-material/PersonRemoveOutlined";
import UserAvatar from "../general/UserAvatar";
import RoleChip from "./RoleChip";
import { memberLabel } from "../../utils/people";

const headCellSx = { color: "text.secondary", fontWeight: 500, borderColor: "divider" };
// on smaller screens the email moves under the name, to keep the table narrow
const emailCellSx = { display: { xs: "none", md: "table-cell" }, width: "34%" };
const rolesCellSx = { width: { xs: 130, sm: 240 } };
const removeCellSx = { width: { xs: 48, sm: 64 }, pr: { xs: 1, sm: 3 }, textAlign: "right" };
// long names/emails get "…" instead of making the table wider than the screen
const ellipsisSx = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };

// Table of a project's members: avatar, name, email and their project roles.
// `template` decides how MEMBER is shown ("Developer" in Scrum, "Member" in Kanban).
// Pass `onRemove(member)` to add a remove button per row (only for people who may manage members).
const MembersTable = ({ members, template, onRemove }) => {
  const rolesSx = { ...rolesCellSx, ...(!onRemove && { pr: { xs: 2, sm: 3 } }) };
  return (
    <TableContainer>
      {/* fixed layout: column widths come from the header, so content can't stretch the table */}
      <Table sx={{ tableLayout: "fixed" }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...headCellSx, pl: { xs: 2, sm: 3 } }}>Name</TableCell>
            <TableCell sx={{ ...headCellSx, ...emailCellSx }}>Email</TableCell>
            <TableCell sx={{ ...headCellSx, ...rolesSx }}>Role</TableCell>
            {onRemove && <TableCell sx={{ ...headCellSx, ...removeCellSx }} aria-label="Actions" />}
          </TableRow>
        </TableHead>

        <TableBody>
          {members.map((member) => (
            <TableRow
              key={member.userId}
              hover
              sx={{ "& td": { borderColor: "divider" }, "&:last-child td": { border: 0 } }}
            >
              <TableCell sx={{ pl: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                  <UserAvatar user={member} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ fontWeight: 600 }}>
                      {memberLabel(member)}
                    </Typography>
                    <Typography noWrap variant="body2" color="text.secondary" sx={{ display: { xs: "block", md: "none" } }}>
                      {member.email}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>

              <TableCell sx={{ ...emailCellSx, ...ellipsisSx, color: "text.secondary" }}>{member.email}</TableCell>

              <TableCell sx={rolesSx}>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {member.roles.map((role) => (
                    <RoleChip key={role} role={role} template={template} />
                  ))}
                </Box>
              </TableCell>

              {onRemove && (
                <TableCell sx={removeCellSx}>
                  <Tooltip title="Remove from project">
                    <IconButton
                      size="small"
                      aria-label={`Remove ${memberLabel(member)} from the project`}
                      onClick={() => onRemove(member)}
                    >
                      <PersonRemoveOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default MembersTable;
