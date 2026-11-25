import { useState } from "react";
import { Box, FormControlLabel, Stack, Switch } from "@mui/material";
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
  const { retro, addItem, editItem, deleteItem } = useRetroBoard(loaded);
  const [byVotes, setByVotes] = useState(false);
  const [deleting, setDeleting] = useState(null); // the card being deleted
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState("");
  const shownDeleting = useLatched(deleting);

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

  return (
    <>
      <Stack spacing={2} sx={revealChildren(0)}>
        <RetroHeader retro={retro} workspace={workspace} project={project} />
        <Box>
          <FormControlLabel
            control={<Switch size="small" checked={byVotes} onChange={(e) => setByVotes(e.target.checked)} />}
            label="Sort by votes"
            sx={{ ml: 0, gap: 0.75 }}
          />
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
              onAdd={(body) => addItem(value, body)}
              onEdit={editItem}
              onDelete={askDelete}
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
    </>
  );
};

export default RetroBoard;
