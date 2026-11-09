import { Box, Typography } from "@mui/material";
import { formatEstimate } from "../../utils/task";

const plural = (count, noun) => `${count} ${noun}${count === 1 ? "" : "s"}`;

// points on top, what they are, and how many items
const Count = ({ points, label, count, tone }) => (
  <Box sx={{ flex: 1, minWidth: 0, p: 1.5, border: 1, borderColor: "divider", borderRadius: 1.5, textAlign: "center" }}>
    <Typography sx={{ fontWeight: 700, fontSize: 24, color: tone }}>{formatEstimate(points) || "0"}</Typography>
    <Typography variant="body2" sx={{ fontWeight: 600 }}>
      {label}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {plural(count, "item")}
    </Typography>
  </Box>
);

// "20 done / 6 unfinished" from the close preview (sprints-docs §2): points, with the item counts beneath. No partial
// credit, so a story with open subtasks counts 0 points and is unfinished
export const PreviewCounts = ({ preview }) => (
  <Box
    sx={{ display: "flex", gap: 1.5 }}
    aria-label={`${formatEstimate(preview.donePoints) || 0} done / ${formatEstimate(preview.unfinishedPoints) || 0} unfinished`}
  >
    <Count points={preview.donePoints} label="points done" count={preview.doneCount} tone="success.main" />
    <Count
      points={preview.unfinishedPoints}
      label="points unfinished"
      count={preview.unfinishedCount}
      tone={preview.unfinishedCount > 0 ? "warning.main" : "text.secondary"}
    />
  </Box>
);

// the unfinished items in sprint order: key, title, column and open subtasks, points (or "not estimated")
export const UnfinishedList = ({ items }) => (
  <Box
    component="ul"
    aria-label="Unfinished items"
    sx={{ listStyle: "none", m: 0, p: 0, border: 1, borderColor: "divider", borderRadius: 1.5, maxHeight: 240, overflowY: "auto" }}
  >
    {items.map((item, index) => {
      const estimate = formatEstimate(item.estimate);
      const details = [item.statusName, item.openSubtasks > 0 && `${plural(item.openSubtasks, "open subtask")}`];
      return (
        <Box
          component="li"
          key={item.taskId}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 1.5,
            py: 1,
            borderTop: index === 0 ? 0 : 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, flexShrink: 0, minWidth: 56 }}>
            {item.key}
          </Typography>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap title={item.title}>
              {item.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {details.filter(Boolean).join(" · ")}
            </Typography>
          </Box>
          <Typography
            variant="caption"
            sx={{ flexShrink: 0, fontWeight: 600, color: estimate ? "text.primary" : "text.disabled" }}
          >
            {estimate ? `${estimate} ${Number(estimate) === 1 ? "point" : "points"}` : "not estimated"}
          </Typography>
        </Box>
      );
    })}
  </Box>
);
