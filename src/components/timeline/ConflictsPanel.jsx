import { useState } from "react";
import { Box, Button, Paper, Typography } from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { hoverTransition } from "../../theme/motion";

// how many show before "Show all"
const FIRST = 4;

const ITEM_SX = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  width: "100%",
  px: 1.5,
  py: 0.75,
  border: 0,
  borderTop: 1,
  borderColor: "divider",
  bgcolor: "transparent",
  color: "text.primary",
  textAlign: "left",
  cursor: "pointer",
  font: "inherit",
  transition: hoverTransition("background-color"),
  "&:hover": { bgcolor: "action.hover" },
  "&:focus-visible": { outline: "2px solid", outlineColor: (theme) => theme.palette.primary.main, outlineOffset: -2 },
};

// The schedule's conflicts (PMP-48 AC 17, 20; backend schedule-docs §2-3), each with the backend's sentence ("PMP-11
// starts before PMP-10 ends", "PMP-6 ends after milestone Beta release"). Picking one scrolls the chart to its row
// (`onSelect(conflict)`). Nothing shows without conflicts. They are only shown: saving dates is never blocked.
const ConflictsPanel = ({ conflicts, onSelect }) => {
  const [all, setAll] = useState(false);
  if (conflicts.length === 0) return null;
  const shown = all ? conflicts : conflicts.slice(0, FIRST);

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1 }}>
        <WarningAmberRoundedIcon sx={{ color: "error.main", fontSize: 20 }} />
        <Typography variant="body2" sx={{ fontWeight: 700, flexGrow: 1 }}>
          {conflicts.length} schedule {conflicts.length === 1 ? "conflict" : "conflicts"}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
          Pick one to see it on the chart
        </Typography>
      </Box>
      <Box component="ul" sx={{ m: 0, p: 0, listStyle: "none" }}>
        {shown.map((conflict) => (
          <li key={`${conflict.type}-${conflict.dependencyId ?? conflict.milestoneId}-${conflict.taskIds.join("-")}`}>
            <Box component="button" type="button" onClick={() => onSelect(conflict)} sx={ITEM_SX}>
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                {conflict.message}
              </Typography>
              <ChevronRightIcon fontSize="small" sx={{ color: "text.secondary" }} />
            </Box>
          </li>
        ))}
      </Box>
      {conflicts.length > FIRST && (
        <Box sx={{ borderTop: 1, borderColor: "divider", px: 0.5, py: 0.25 }}>
          <Button size="small" color="inherit" onClick={() => setAll((open) => !open)} sx={{ color: "text.secondary" }}>
            {all ? "Show fewer" : `Show all ${conflicts.length}`}
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default ConflictsPanel;
