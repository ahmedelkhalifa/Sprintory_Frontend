import { useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import SectionCard from "../general/SectionCard";
import ToneChip from "../general/ToneChip";
import ConfirmDialog from "../general/ConfirmDialog";
import StakeholderDialog from "./StakeholderDialog";
import LinkedUserLink from "./LinkedUserLink";
import { deleteStakeholder } from "../../api/charterApi";
import { useSubmit } from "../../hooks/useSubmit";
import { CHARTER_ERROR_MESSAGES, STAKEHOLDER_LEVEL_LABEL, STAKEHOLDER_LEVEL_TONE } from "../../constants/charter";
import { safeHref } from "../../utils/richText";

const headCellSx = { color: "text.secondary", fontWeight: 500, borderColor: "divider", whiteSpace: "nowrap" };
// on phones only the name column stays; the rest moves under the name
const wide = { display: { xs: "none", md: "table-cell" } };
const medium = { display: { xs: "none", sm: "table-cell" } };

const Level = ({ value }) =>
  value ? <ToneChip label={STAKEHOLDER_LEVEL_LABEL[value] ?? value} tone={STAKEHOLDER_LEVEL_TONE[value]} dot /> : <Muted>—</Muted>;

const Muted = ({ children }) => (
  <Typography component="span" variant="body2" color="text.secondary">
    {children}
  </Typography>
);

// a mailto link only for an address that is one (the backend checked it; this keeps odd values as text)
const Email = ({ value }) => {
  if (!value) return <Muted>—</Muted>;
  const href = safeHref(`mailto:${value}`);
  return href ? (
    <Link href={href} underline="hover" sx={{ wordBreak: "break-all" }}>
      {value}
    </Link>
  ) : (
    <Typography variant="body2">{value}</Typography>
  );
};

// The stakeholder register: name (linked to the workspace user's profile when there is one), organization,
// role, interest, influence and contact email. Contact details stay in this tab, which only project members can
// open (the backend's 404 for everyone else); nothing here goes into a shared store. `editable` shows the actions.
const CharterStakeholders = ({ project, workspace, stakeholders, editable, onChanged, onNotice }) => {
  const [dialog, setDialog] = useState(null); // { type: "add" | "edit" | "delete", stakeholder? }
  const remove = useSubmit(CHARTER_ERROR_MESSAGES);

  const close = () => {
    setDialog(null);
    remove.clearError();
  };

  const saved = (text) => {
    setDialog(null);
    onNotice(text);
    onChanged();
  };

  const confirmDelete = async () => {
    const { ok } = await remove.run(() => deleteStakeholder(project.id, dialog.stakeholder.id));
    if (ok) saved(`${dialog.stakeholder.name} was removed from the stakeholders.`);
  };

  return (
    <SectionCard
      title="Stakeholders"
      count={stakeholders.length}
      toolbar={
        editable && (
          <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={() => setDialog({ type: "add" })}>
            Add stakeholder
          </Button>
        )
      }
    >
      {stakeholders.length === 0 ? (
        <Box sx={{ p: { xs: 3, sm: 4 }, textAlign: "center" }}>
          <Typography color="text.secondary">No stakeholders recorded yet.</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {editable
              ? "Add the sponsor, clients and anyone else with a stake in the project. They don't need an account."
              : "The Project Manager records who has a stake in the project here."}
          </Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table size="small" aria-label="Stakeholder register">
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...headCellSx, pl: { xs: 2, sm: 3 } }}>Name</TableCell>
                <TableCell sx={{ ...headCellSx, ...wide }}>Organization</TableCell>
                <TableCell sx={{ ...headCellSx, ...medium }}>Role</TableCell>
                <TableCell sx={{ ...headCellSx, ...medium }}>Interest</TableCell>
                <TableCell sx={{ ...headCellSx, ...medium }}>Influence</TableCell>
                <TableCell sx={{ ...headCellSx, ...wide }}>Contact</TableCell>
                {editable && (
                  <TableCell sx={{ ...headCellSx, pr: { xs: 2, sm: 3 }, position: "relative" }} align="right">
                    {/* named for screen readers only */}
                    <Box
                      component="span"
                      sx={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}
                    >
                      Actions
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {stakeholders.map((stakeholder) => (
                <TableRow
                  key={stakeholder.id}
                  hover
                  sx={{ "& td": { borderColor: "divider", py: 1.25 }, "&:last-child td": { border: 0 }, verticalAlign: "top" }}
                >
                  <TableCell sx={{ pl: { xs: 2, sm: 3 }, minWidth: 160 }}>
                    <Typography variant="body2" component="div" sx={{ fontWeight: 600, wordBreak: "break-word" }}>
                      {stakeholder.linkedUserId != null ? (
                        <LinkedUserLink workspace={workspace} userId={stakeholder.linkedUserId} userName={stakeholder.linkedUserName}>
                          {stakeholder.name}
                        </LinkedUserLink>
                      ) : (
                        stakeholder.name
                      )}
                    </Typography>
                    {stakeholder.linkedUserId != null && (
                      <Typography variant="caption" color="text.secondary" component="div">
                        Sprintory user: {stakeholder.linkedUserName}
                      </Typography>
                    )}
                    {/* phones: what the hidden columns show */}
                    <Box sx={{ display: { xs: "block", md: "none" }, mt: 0.5 }}>
                      {[stakeholder.organization, stakeholder.projectRole].filter(Boolean).length > 0 && (
                        <Typography variant="caption" color="text.secondary" component="div" sx={{ display: { sm: "none" } }}>
                          {[stakeholder.organization, stakeholder.projectRole].filter(Boolean).join(" · ")}
                        </Typography>
                      )}
                      {stakeholder.organization && (
                        <Typography variant="caption" color="text.secondary" component="div" sx={{ display: { xs: "none", sm: "block" } }}>
                          {stakeholder.organization}
                        </Typography>
                      )}
                      {stakeholder.contactEmail && (
                        <Box sx={{ typography: "caption" }}>
                          <Email value={stakeholder.contactEmail} />
                        </Box>
                      )}
                      {(stakeholder.interest || stakeholder.influence) && (
                        <Box sx={{ display: { xs: "flex", sm: "none" }, gap: 0.75, mt: 0.75, flexWrap: "wrap" }}>
                          {stakeholder.interest && (
                            <ToneChip label={`Interest: ${STAKEHOLDER_LEVEL_LABEL[stakeholder.interest]}`} tone={STAKEHOLDER_LEVEL_TONE[stakeholder.interest]} />
                          )}
                          {stakeholder.influence && (
                            <ToneChip label={`Influence: ${STAKEHOLDER_LEVEL_LABEL[stakeholder.influence]}`} tone={STAKEHOLDER_LEVEL_TONE[stakeholder.influence]} />
                          )}
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={wide}>
                    {stakeholder.organization ? <Typography variant="body2">{stakeholder.organization}</Typography> : <Muted>—</Muted>}
                  </TableCell>
                  <TableCell sx={medium}>
                    {stakeholder.projectRole ? <Typography variant="body2">{stakeholder.projectRole}</Typography> : <Muted>—</Muted>}
                  </TableCell>
                  <TableCell sx={medium}>
                    <Level value={stakeholder.interest} />
                  </TableCell>
                  <TableCell sx={medium}>
                    <Level value={stakeholder.influence} />
                  </TableCell>
                  <TableCell sx={{ ...wide, maxWidth: 240 }}>
                    <Email value={stakeholder.contactEmail} />
                  </TableCell>
                  {editable && (
                    <TableCell align="right" sx={{ pr: { xs: 1, sm: 2 }, whiteSpace: "nowrap" }}>
                      <Tooltip title="Edit">
                        <IconButton size="small" aria-label={`Edit ${stakeholder.name}`} onClick={() => setDialog({ type: "edit", stakeholder })}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove">
                        <IconButton
                          size="small"
                          aria-label={`Remove ${stakeholder.name}`}
                          onClick={() => setDialog({ type: "delete", stakeholder })}
                        >
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {(dialog?.type === "add" || dialog?.type === "edit") && (
        <StakeholderDialog
          projectId={project.id}
          workspaceId={workspace.id}
          stakeholder={dialog.stakeholder ?? null}
          onClose={close}
          onSaved={(result) => saved(dialog.type === "add" ? `${result.name} was added to the stakeholders.` : "Stakeholder saved.")}
        />
      )}
      {dialog?.type === "delete" && (
        <ConfirmDialog
          tone="danger"
          title="Remove stakeholder?"
          message={`${dialog.stakeholder.name} will be removed from the stakeholder register. This can't be undone.`}
          confirmLabel="Remove"
          loading={remove.submitting}
          error={remove.error}
          onConfirm={confirmDelete}
          onClose={close}
        />
      )}
    </SectionCard>
  );
};

export default CharterStakeholders;
