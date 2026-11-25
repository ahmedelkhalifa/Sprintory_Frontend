import { Box, Paper, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import ToneChip from "../general/ToneChip";
import RetroCard from "./RetroCard";

// one of the three columns ("Went well", "To improve", "Ideas") with its cards, already in order
const RetroColumn = ({ label, items }) => (
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
    {items.length === 0 ? (
      <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 4, textAlign: "center" }}>
        No cards yet
      </Typography>
    ) : (
      <Box component="ol" sx={{ listStyle: "none", m: 0, p: 1, display: "flex", flexDirection: "column", gap: 1 }}>
        {items.map((item) => (
          <RetroCard key={item.id} item={item} />
        ))}
      </Box>
    )}
  </Paper>
);

export default RetroColumn;
