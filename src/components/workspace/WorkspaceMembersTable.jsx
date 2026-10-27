import {
  Box,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import UserAvatar from "../general/UserAvatar";
import ToneChip from "../general/ToneChip";
import { WORKSPACE_ROLE_OPTIONS, WORKSPACE_ROLES } from "../../constants/workspaces";
import { memberLabel } from "../../utils/people";
import { ROLE_LABEL } from "../../utils/workspace";

const headCellSx = { color: "text.secondary", fontWeight: 500, borderColor: "divider" };
// on smaller screens the email moves under the name, to keep the table narrow
const emailCellSx = { display: { xs: "none", md: "table-cell" }, width: "36%" };
const roleCellSx = { width: { xs: 140, sm: 180 }, pr: { xs: 2, sm: 3 } };
const ellipsisSx = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };

// Table of a workspace's members with their workspace role (Admin or Member).
// With `canChange` (workspace admins, active workspace) the role is a dropdown; otherwise a plain label.
// `onChangeRole(member, role)` is called when another role is picked; `savingId` is the member being saved.
// The shown role is always the saved one: it only changes once the list has loaded again.
const WorkspaceMembersTable = ({ members, canChange, currentUserId, savingId, onChangeRole }) => {
  return (
    <TableContainer>
      <Table sx={{ tableLayout: "fixed" }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...headCellSx, pl: { xs: 2, sm: 3 } }}>Name</TableCell>
            <TableCell sx={{ ...headCellSx, ...emailCellSx }}>Email</TableCell>
            <TableCell sx={{ ...headCellSx, ...roleCellSx }}>Role</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {members.map((member) => {
            const label = memberLabel(member);
            return (
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
                        {label}
                        {member.userId === currentUserId && (
                          <Typography component="span" color="text.secondary" sx={{ fontWeight: 400 }}>
                            {" "}
                            (you)
                          </Typography>
                        )}
                      </Typography>
                      <Typography noWrap variant="body2" color="text.secondary" sx={{ display: { xs: "block", md: "none" } }}>
                        {member.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>

                <TableCell sx={{ ...emailCellSx, ...ellipsisSx, color: "text.secondary" }}>{member.email}</TableCell>

                <TableCell sx={roleCellSx}>
                  {canChange ? (
                    <Select
                      size="small"
                      fullWidth
                      value={member.role}
                      disabled={savingId === member.userId}
                      onChange={(e) => onChangeRole(member, e.target.value)}
                      slotProps={{ input: { "aria-label": `Workspace role of ${label}` } }}
                    >
                      {WORKSPACE_ROLE_OPTIONS.map((role) => (
                        <MenuItem key={role} value={role}>
                          {ROLE_LABEL[role]}
                        </MenuItem>
                      ))}
                    </Select>
                  ) : (
                    <ToneChip
                      label={ROLE_LABEL[member.role] ?? member.role}
                      tone={member.role === WORKSPACE_ROLES.WORKSPACE_ADMIN ? "primary.dark" : "text.secondary"}
                    />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default WorkspaceMembersTable;
