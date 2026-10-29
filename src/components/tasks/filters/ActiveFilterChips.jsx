import { Box, Chip } from "@mui/material";
import { pickedLabel } from "../../../utils/taskFilters";

// The filters picked in the Filter window, as chips under the bar ("Type: Bug ✕"); ✕ clears that one filter
const ActiveFilterChips = ({ filters, groups, onRemove }) => {
  const picked = groups.filter((group) => pickedLabel(group, filters[group.id]));
  if (picked.length === 0) return null;

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
      {picked.map((group) => (
        <Chip
          key={group.id}
          size="small"
          label={
            <>
              {group.name}:{" "}
              <Box component="strong" sx={{ fontWeight: 700 }}>
                {pickedLabel(group, filters[group.id])}
              </Box>
            </>
          }
          onDelete={() => onRemove(group.id)}
          sx={{
            height: 28,
            maxWidth: "100%",
            bgcolor: "navActive.background",
            color: "navActive.text",
            fontWeight: 500,
            "& .MuiChip-deleteIcon": { color: "navActive.text", opacity: 0.6, "&:hover": { opacity: 1, color: "navActive.text" } },
          }}
        />
      ))}
    </Box>
  );
};

export default ActiveFilterChips;
