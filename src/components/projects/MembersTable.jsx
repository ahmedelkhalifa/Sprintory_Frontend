import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import UserAvatar from "../general/UserAvatar";
import RoleChip from "./RoleChip";

const headCellSx = { color: "text.secondary", fontWeight: 500, borderColor: "divider" };
// on smaller screens the email moves under the name, to keep the table narrow
const emailCellSx = { display: { xs: "none", md: "table-cell" }, width: "34%" };
const rolesCellSx = { width: { xs: 130, sm: 240 } };
// long names/emails get "…" instead of making the table wider than the screen
const ellipsisSx = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };

// Table of a project's members: avatar, name, email and their project roles.
// `template` decides how MEMBER is shown ("Developer" in Scrum, "Member" in Kanban).
const MembersTable = ({ members, template }) => {
  return (
    <TableContainer>
      {/* fixed layout: column widths come from the header, so content can't stretch the table */}
      <Table sx={{ tableLayout: "fixed" }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...headCellSx, pl: { xs: 2, sm: 3 } }}>Name</TableCell>
            <TableCell sx={{ ...headCellSx, ...emailCellSx }}>Email</TableCell>
            <TableCell sx={{ ...headCellSx, ...rolesCellSx, pr: { xs: 2, sm: 3 } }}>Role</TableCell>
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
                      {member.firstName} {member.lastName}
                    </Typography>
                    <Typography noWrap variant="body2" color="text.secondary" sx={{ display: { xs: "block", md: "none" } }}>
                      {member.email}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>

              <TableCell sx={{ ...emailCellSx, ...ellipsisSx, color: "text.secondary" }}>{member.email}</TableCell>

              <TableCell sx={{ ...rolesCellSx, pr: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {member.roles.map((role) => (
                    <RoleChip key={role} role={role} template={template} />
                  ))}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default MembersTable;
