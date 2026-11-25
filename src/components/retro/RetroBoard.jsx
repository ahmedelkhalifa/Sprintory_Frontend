import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Alert, Box, Button, FormControlLabel, Snackbar, Stack, Switch, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import ConfirmDialog from "../general/ConfirmDialog";
import RetroActionDialog from "./RetroActionDialog";
import RetroActions from "./RetroActions";
import RetroColumn from "./RetroColumn";
import RetroHeader from "./RetroHeader";
import { useRetroBoard } from "./useRetroBoard";
import { useLatched } from "../../hooks/useLatched";
import { RETRO_COLUMNS } from "../../constants/retro";
import { actionCreatedText, columnItems, retroPath } from "../../utils/retro";
import { revealChildren } from "../../theme/motion";

// The loaded retro: how the sprint ended, what the retro before it left unfinished, the three columns with their cards,
// and the actions. It keeps the retro from here on (useRetroBoard), so a saved card shows without loading the page again.
const RetroBoard = ({ loaded, workspace, project }) => {
  const { retro, addItem, editItem, deleteItem, toggleVote, createAction, close, reload } = useRetroBoard(loaded);
  const [byVotes, setByVotes] = useState(false);
  const [deleting, setDeleting] = useState(null); // the card being deleted
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState("");
  const shownDeleting = useLatched(deleting);
  const [refreshing, setRefreshing] = useState(false);
  const [askClose, setAskClose] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState("");
  // someone else closed it meanwhile: there's nothing left to confirm
  const closeOpen = askClose && retro.canManage;
  const shownClose = useLatched(closeOpen || null);
  const [making, setMaking] = useState(null); // the action being made: { item: its card or null, openedAt }
  const shownMaking = useLatched(making);
  // at the bottom of the page: what it's about may be gone (a vote's card) or out of sight (a new action)
  const [notice, setNotice] = useState(null); // { severity, text }
  const shownNotice = useLatched(notice);

  const askDelete = (item) => {
    setRemoveError("");
    setDeleting(item);
  };

  const confirmDelete = async () => {
    setRemoving(true);
    const failure = await deleteItem(deleting.id);
    setRemoving(false);
    if (failure) setRemoveError(failure);
    else setDeleting(null);
  };

  const refresh = async () => {
    setRefreshing(true);
    const failure = await reload();
    setRefreshing(false);
    if (failure) setNotice({ severity: "error", text: failure });
  };

  const openClose = () => {
    setCloseError("");
    setAskClose(true);
  };

  const confirmClose = async () => {
    setClosing(true);
    const failure = await close();
    setClosing(false);
    if (failure) {
      setCloseError(failure);
    } else {
      setAskClose(false);
      setNotice({ severity: "success", text: "The retrospective is closed." });
    }
  };

  const vote = async (item) => {
    const failure = await toggleVote(item);
    if (failure) setNotice({ severity: "error", text: failure });
  };

  const startAction = (item) => setMaking({ item, openedAt: Date.now() });

  const handleCreated = (action) => {
    setMaking(null);
    setNotice({ severity: "success", text: actionCreatedText(action) });
  };

  const previous = retro.previousActions;

  return (
    <>
      <Stack spacing={2} sx={revealChildren(0)}>
        <RetroHeader
          retro={retro}
          workspace={workspace}
          project={project}
          actions={
            <>
              <Button variant="outlined" size="small" startIcon={<RefreshIcon />} loading={refreshing} onClick={refresh}>
                Refresh
              </Button>
              {retro.canManage && (
                <Button variant="outlined" size="small" onClick={openClose}>
                  Close retro
                </Button>
              )}
            </>
          }
        />
        {previous && (
          <RetroActions
            title={`Unfinished actions from ${previous.sprintName}`}
            actions={previous.actions}
            workspace={workspace}
            project={project}
            action={
              <Button
                component={RouterLink}
                to={retroPath(workspace, project, previous.retroId)}
                variant="outlined"
                size="small"
                aria-label={`Open retro: ${previous.sprintName}`}
              >
                Open retro
              </Button>
            }
          />
        )}
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 2, rowGap: 0.5 }}>
          <FormControlLabel
            control={<Switch size="small" checked={byVotes} onChange={(e) => setByVotes(e.target.checked)} />}
            label="Sort by votes"
            sx={{ ml: 0, gap: 0.75, flexGrow: 1 }}
          />
          {retro.canContribute && (
            <Typography variant="body2" color="text.secondary" role="status">
              {`Votes left: ${retro.votesLeft} / ${retro.votesPerMember}`}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(3, minmax(0, 1fr))" },
            gap: 2,
            alignItems: "start",
          }}
        >
          {RETRO_COLUMNS.map(({ value, label }) => (
            <RetroColumn
              key={value}
              label={label}
              items={columnItems(retro.items, value, { byVotes })}
              retro={retro}
              onAdd={(body) => addItem(value, body)}
              onEdit={editItem}
              onDelete={askDelete}
              onVote={vote}
              onMakeAction={startAction}
            />
          ))}
        </Box>
        <RetroActions
          title="Actions"
          actions={retro.actions}
          emptyText={retro.canManage ? "No actions yet. Turn a card into one, or create one here." : "No actions yet"}
          workspace={workspace}
          project={project}
          action={
            retro.canManage && (
              <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => startAction(null)}>
                Create action
              </Button>
            )
          }
        />
      </Stack>

      {shownDeleting && (
        <ConfirmDialog
          open={Boolean(deleting)}
          title="Delete this card?"
          message="Its votes will be returned."
          confirmLabel="Delete card"
          tone="danger"
          loading={removing}
          error={removeError}
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      )}
      {shownClose && (
        <ConfirmDialog
          open={closeOpen}
          title="Close this retrospective?"
          message="Closing freezes cards, votes and actions, and it can't be opened again. The action tasks go on as normal."
          confirmLabel="Close retro"
          tone="warning"
          loading={closing}
          error={closeError}
          onConfirm={confirmClose}
          onClose={() => setAskClose(false)}
        />
      )}
      {shownMaking && (
        <RetroActionDialog
          // every time it opens it starts fresh, also right after it closed
          key={shownMaking.openedAt}
          open={Boolean(making)}
          retro={retro}
          item={shownMaking.item}
          project={project}
          onCreate={createAction}
          onCreated={handleCreated}
          onClose={() => setMaking(null)}
        />
      )}
      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={6000}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={shownNotice?.severity ?? "success"}
          variant="filled"
          onClose={() => setNotice(null)}
          sx={{ width: "100%" }}
        >
          {shownNotice?.text}
        </Alert>
      </Snackbar>
    </>
  );
};

export default RetroBoard;
