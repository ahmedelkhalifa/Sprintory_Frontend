import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, CircularProgress, Link, Popover, Stack, Typography } from "@mui/material";
import UserAvatar from "../general/UserAvatar";
import ToneChip from "../general/ToneChip";
import { listWorkspaceMembers } from "../../api/workspacesApi";
import { errorMessage } from "../../utils/apiError";
import { memberSearchTerm } from "../../utils/charter";
import { memberLabel } from "../../utils/people";
import { ROLE_LABEL, workspacePath } from "../../utils/workspace";

// The name of a stakeholder linked to a workspace user, as a link to that user's profile. The app has no
// profile page yet, so the profile is a card loaded from the workspace's member list (name, email, workspace
// role), with a way on to the Members page. The workspace's members can already see all of this there.
const LinkedUserLink = ({ workspace, userId, userName, children }) => {
  const [anchor, setAnchor] = useState(null);
  const [state, setState] = useState({ loading: false, member: null, error: "" });

  const open = async (event) => {
    setAnchor(event.currentTarget);
    if (state.member) return;
    setState({ loading: true, member: null, error: "" });
    try {
      // the member search matches one name or the email at a time, so search by the first name and pick the id
      const page = await listWorkspaceMembers(workspace.id, { q: memberSearchTerm(userName), size: 100 });
      const member = (page.content ?? []).find((m) => Number(m.userId) === Number(userId));
      setState({ loading: false, member: member ?? null, error: member ? "" : "This user is no longer in the workspace." });
    } catch (err) {
      setState({ loading: false, member: null, error: errorMessage(err, "Couldn't load the profile.") });
    }
  };

  const { member } = state;

  return (
    <>
      <Link
        component="button"
        type="button"
        onClick={open}
        underline="hover"
        aria-haspopup="dialog"
        title={`Linked to ${userName}`}
        sx={{ fontWeight: 600, textAlign: "left", font: "inherit", color: "navActive.text", verticalAlign: "baseline" }}
      >
        {children}
      </Link>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{ paper: { sx: { p: 2, width: 300, maxWidth: "calc(100vw - 32px)" }, role: "dialog", "aria-label": "Profile" } }}
      >
        {state.loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Stack spacing={1.5}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
              <UserAvatar user={member ?? { userId, firstName: userName }} size={44} />
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ fontWeight: 700 }}>
                  {member ? memberLabel(member) : userName}
                </Typography>
                {member?.email && (
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {member.email}
                  </Typography>
                )}
              </Box>
            </Box>
            {member?.role && (
              <Box>
                <ToneChip label={`Workspace ${ROLE_LABEL[member.role] ?? member.role}`} tone="navActive.text" />
              </Box>
            )}
            {state.error && (
              <Typography variant="body2" color="text.secondary">
                {state.error}
              </Typography>
            )}
            <Button
              component={RouterLink}
              to={`${workspacePath(workspace)}/members`}
              size="small"
              variant="outlined"
              sx={{ alignSelf: "flex-start" }}
            >
              Open workspace members
            </Button>
          </Stack>
        )}
      </Popover>
    </>
  );
};

export default LinkedUserLink;
