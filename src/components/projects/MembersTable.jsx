import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import UserAvatar from "../general/UserAvatar";
import RoleChip from "./RoleChip";
import { formatDate } from "../../utils/format";

const headCellSx = { color: "text.secondary", fontWeight: 500, borderColor: "divider" };
// on phones the email moves under the name, and "Joined" is hidden, to keep the table narrow
const emailCellSx = { display: { xs: "none", md: "table-cell" }, width: "32%" };
const roleCellSx = { width: { xs: 96, sm: 112 } };
const joinedCellSx = { display: { xs: "none", sm: "table-cell" }, width: 140 };
// long names/emails get "…" instead of making the table wider than the screen
const ellipsisSx = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };

// Table of a project's members: avatar, name, email, role and join date
const MembersTable = ({ members }) => {
  return (
    <TableContainer>
      {/* fixed layout: column widths come from the header, so content can't stretch the table */}
      <Table sx={{ tableLayout: "fixed" }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...headCellSx, pl: { xs: 2, sm: 3 } }}>Name</TableCell>
            <TableCell sx={{ ...headCellSx, ...emailCellSx }}>Email</TableCell>
            <TableCell sx={{ ...headCellSx, ...roleCellSx }}>Role</TableCell>
            <TableCell sx={{ ...headCellSx, ...joinedCellSx, pr: { xs: 2, sm: 3 } }}>Joined</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {members.map((member) => (
            <TableRow
              key={member.id}
              hover
              sx={{ "& td": { borderColor: "divider" }, "&:last-child td": { border: 0 } }}
            >
              <TableCell sx={{ pl: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                  <UserAvatar user={member} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ fontWeight: 600 }}>
                      {member.firstName} {member.lastName}
                    </Typography>
                    <Typography
                      noWrap
                      variant="body2"
                      color="text.secondary"
                      sx={{ display: { xs: "block", md: "none" } }}
                    >
                      {member.email}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>

              <TableCell sx={{ ...emailCellSx, ...ellipsisSx, color: "text.secondary" }}>{member.email}</TableCell>

              <TableCell>
                <RoleChip role={member.role} />
              </TableCell>

              <TableCell sx={{ ...joinedCellSx, pr: { xs: 2, sm: 3 }, color: "text.secondary", whiteSpace: "nowrap" }}>
                {formatDate(member.joinedAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default MembersTable;
