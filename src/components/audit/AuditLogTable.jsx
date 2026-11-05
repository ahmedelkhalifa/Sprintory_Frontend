import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from "@mui/material";
import UserAvatar from "../general/UserAvatar";
import ToneChip from "../general/ToneChip";
import AuditChanges from "./AuditChanges";
import { AUDIT_AREAS } from "../../constants/audit";
import { actorLabel, auditActionLabel, formatLocal, formatUtc } from "../../utils/audit";

const headCellSx = { color: "text.secondary", fontWeight: 500, borderColor: "divider", whiteSpace: "nowrap" };
const cellSx = { verticalAlign: "top" };

// The log as a table, newest first: time (local, the UTC time in the tooltip), actor, action, target, project and
// what changed. Names are the ones stored in the entry (a person who left, or a project renamed since, keep the
// old name), and nothing links to a target: it may be gone. Read-only: no edit or delete controls, the API has none.
const AuditLogTable = ({ entries }) => (
  // a wide table scrolls sideways on a phone instead of squeezing the columns
  <TableContainer>
    <Table sx={{ minWidth: 960 }}>
      <TableHead>
        <TableRow>
          <TableCell sx={{ ...headCellSx, pl: { xs: 2, sm: 3 }, width: 170 }}>Time</TableCell>
          <TableCell sx={{ ...headCellSx, width: 200 }}>Actor</TableCell>
          <TableCell sx={{ ...headCellSx, width: 190 }}>Action</TableCell>
          <TableCell sx={{ ...headCellSx, width: 190 }}>Target</TableCell>
          <TableCell sx={{ ...headCellSx, width: 150 }}>Project</TableCell>
          <TableCell sx={{ ...headCellSx, pr: { xs: 2, sm: 3 } }}>Details</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id} hover sx={{ "& td": { borderColor: "divider" }, "&:last-child td": { border: 0 } }}>
            <TableCell sx={{ ...cellSx, pl: { xs: 2, sm: 3 }, whiteSpace: "nowrap" }}>
              <Tooltip title={formatUtc(entry.occurredAt)}>
                <time dateTime={entry.occurredAt}>{formatLocal(entry.occurredAt)}</time>
              </Tooltip>
            </TableCell>

            <TableCell sx={cellSx}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                {entry.actor && <UserAvatar user={{ userId: entry.actor.id, firstName: entry.actor.name, email: entry.actor.email }} size={28} />}
                <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: "anywhere" }}>
                  {actorLabel(entry)}
                </Typography>
              </Box>
            </TableCell>

            <TableCell sx={cellSx}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {auditActionLabel(entry.action)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {AUDIT_AREAS[entry.area] ?? entry.area}
              </Typography>
            </TableCell>

            <TableCell sx={cellSx}>
              <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                {entry.target?.name || "—"}
              </Typography>
            </TableCell>

            <TableCell sx={cellSx}>
              {entry.project ? <ToneChip label={entry.project.name} tone="primary.main" /> : "—"}
            </TableCell>

            <TableCell sx={{ ...cellSx, pr: { xs: 2, sm: 3 } }}>
              <AuditChanges entry={entry} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

export default AuditLogTable;
