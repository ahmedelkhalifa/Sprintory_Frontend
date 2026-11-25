import { useState } from "react";
import { Box, Button, Paper, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import ToneChip from "../general/ToneChip";
import RetroCard from "./RetroCard";
import RetroCardForm from "./RetroCardForm";

// One of the three columns ("Went well", "To improve", "Ideas") with its cards, already in order, and "Add a card" at
// the bottom, where a new card lands. `canContribute` and `votesLeft` are the retro's. `onAdd(body)` and
// `onEdit(itemId, body)` answer an error text or null.
const RetroColumn = ({ label, items, projectId, canContribute, votesLeft, onAdd, onEdit, onDelete, onVote }) => {
  const [adding, setAdding] = useState(false);

  return (
    <Paper
      component="section"
      aria-label={label}
      elevation={0}
      sx={(theme) => ({
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
        // the same faint slate as the board's columns, so the cards stand out
        bgcolor: alpha(theme.palette.text.primary, 0.03),
      })}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1.5, borderBottom: 1, borderColor: "divider" }}>
        <Typography variant="subtitle1" component="h3" sx={{ flexGrow: 1 }}>
          {label}
        </Typography>
        <ToneChip label={items.length} />
      </Box>
      {items.length > 0 ? (
        <Box component="ol" sx={{ listStyle: "none", m: 0, p: 1, display: "flex", flexDirection: "column", gap: 1 }}>
          {items.map((item) => (
            <RetroCard
              key={item.id}
              item={item}
              projectId={projectId}
              canContribute={canContribute}
              votesLeft={votesLeft}
              onEdit={onEdit}
              onDelete={onDelete}
              onVote={onVote}
            />
          ))}
        </Box>
      ) : (
        !adding && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 4, textAlign: "center" }}>
            No cards yet
          </Typography>
        )
      )}
      {adding && (
        <Box sx={{ p: 1 }}>
          <RetroCardForm
            projectId={projectId}
            saveLabel="Add"
            ariaLabel={`New card: ${label}`}
            locked={!canContribute}
            onSave={onAdd}
            onCancel={() => setAdding(false)}
          />
        </Box>
      )}
      {canContribute && !adding && (
        <Box sx={{ px: 1, pb: 1 }}>
          <Button
            fullWidth
            size="small"
            color="inherit"
            startIcon={<AddIcon />}
            onClick={() => setAdding(true)}
            aria-label={`Add a card: ${label}`}
          >
            Add a card
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default RetroColumn;
