import { useState } from "react";
import { Alert, Box, FormControlLabel, Snackbar, Stack, Switch, Typography } from "@mui/material";
import ConfirmDialog from "../general/ConfirmDialog";
import RetroColumn from "./RetroColumn";
import RetroHeader from "./RetroHeader";
import { useRetroBoard } from "./useRetroBoard";
import { useLatched } from "../../hooks/useLatched";
import { RETRO_COLUMNS } from "../../constants/retro";
import { columnItems } from "../../utils/retro";
import { revealChildren } from "../../theme/motion";

// The loaded retro: how the sprint ended, then the three columns with their cards. It keeps the retro from here on
// (useRetroBoard), so a saved card shows without loading the page again.
const RetroBoard = ({ loaded, workspace, project }) => {
  const { retro, addItem, editItem, deleteItem, toggleVote } = useRetroBoard(loaded);
  const [byVotes, setByVotes] = useState(false);
  const [deleting, setDeleting] = useState(null); // the card being deleted
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState("");
  const shownDeleting = useLatched(deleting);
  // at the bottom of the page: the card it's about may be gone, or its vote button with it
  const [voteError, setVoteError] = useState(null);
  const shownVoteError = useLatched(voteError);

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

  const vote = async (item) => {
    const failure = await toggleVote(item);
    if (failure) setVoteError(failure);
  };

  return (
    <>
      <Stack spacing={2} sx={revealChildren(0)}>
        <RetroHeader retro={retro} workspace={workspace} project={project} />
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
              projectId={project.id}
              canContribute={retro.canContribute}
              votesLeft={retro.votesLeft}
              onAdd={(body) => addItem(value, body)}
              onEdit={editItem}
              onDelete={askDelete}
              onVote={vote}
            />
          ))}
        </Box>
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
      <Snackbar
        open={Boolean(voteError)}
        autoHideDuration={6000}
        onClose={() => setVoteError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" variant="filled" onClose={() => setVoteError(null)} sx={{ width: "100%" }}>
          {shownVoteError}
        </Alert>
      </Snackbar>
    </>
  );
};

export default RetroBoard;
