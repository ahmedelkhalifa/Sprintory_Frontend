import { useState } from "react";
import { Box, Button, List, ListItemButton, ListItemIcon, ListItemText, Popover, Typography } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FilterOptionList from "./FilterOptionList";
import { countPickedFilters, pickedLabel } from "../../../utils/taskFilters";

// The "Filter" button and its window, Jira style: the filter types on the left (each showing what is picked),
// the options of the selected type on the right. Picking applies at once; Done closes, Clear all resets every
// filter in the window (the search box on the bar stays). `groups` come from TaskFilterBar.
const FilterPanel = ({ filters, onChange, groups }) => {
  const [anchor, setAnchor] = useState(null);
  const [pane, setPane] = useState(groups[0].id);
  const count = countPickedFilters(filters);
  const group = groups.find((g) => g.id === pane) ?? groups[0];

  const clearAll = () =>
    onChange({ ...filters, ...Object.fromEntries(groups.map((g) => [g.id, null])) });

  return (
    <>
      <Button
        variant="outlined"
        color={count > 0 ? "primary" : "inherit"}
        startIcon={<FilterListIcon />}
        endIcon={<KeyboardArrowDownIcon />}
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-haspopup="dialog"
        aria-expanded={Boolean(anchor)}
        sx={{
          height: 40,
          fontWeight: 600,
          borderColor: count > 0 ? "primary.main" : "divider",
          bgcolor: count > 0 ? "navActive.background" : "background.paper",
        }}
      >
        Filter
        {count > 0 && (
          <Box
            component="span"
            sx={{
              ml: 1,
              minWidth: 20,
              height: 20,
              px: 0.75,
              borderRadius: 10,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              bgcolor: "primary.main",
              color: "primary.contrastText",
            }}
          >
            {count}
          </Box>
        )}
      </Button>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            role: "dialog",
            "aria-label": "Filter tasks",
            // phones: full width minus the popover's 16px margin on each side
            sx: { mt: 0.75, width: { xs: "calc(100vw - 32px)", sm: 620 }, maxWidth: 620, borderRadius: 2.5 },
          },
        }}
      >
        <Typography sx={{ px: 2.25, py: 1.75, fontWeight: 700, fontSize: 16, borderBottom: 1, borderColor: "divider" }}>
          Filter tasks
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "136px minmax(0, 1fr)", sm: "210px minmax(0, 1fr)" },
            height: { xs: 420, sm: 360 },
            "& > *": { minHeight: 0 },
          }}
        >
          {/* left: the filter types */}
          <List
            sx={(theme) => ({ p: 1, overflowY: "auto", borderRight: 1, borderColor: "divider", bgcolor: theme.palette.action.hover })}
            aria-label="Filter by"
          >
            {groups.map((g) => {
              const picked = pickedLabel(g, filters[g.id]);
              return (
                <ListItemButton
                  key={g.id}
                  selected={g.id === group.id}
                  onClick={() => setPane(g.id)}
                  sx={{
                    borderRadius: 1.5,
                    mb: 0.25,
                    gap: 1.25,
                    px: { xs: 1, sm: 1.25 },
                    "&.Mui-selected, &.Mui-selected:hover": { bgcolor: "navActive.background", color: "navActive.text" },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, color: "inherit", display: { xs: "none", sm: "flex" } }}>
                    <g.Icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={g.name}
                    secondary={picked || null}
                    slotProps={{
                      primary: { noWrap: true, fontWeight: 600 },
                      secondary: { noWrap: true, sx: { color: "primary.main", fontWeight: 600, fontSize: 12 } },
                    }}
                    sx={{ my: 0, minWidth: 0 }}
                  />
                  {picked && <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main", flexShrink: 0 }} />}
                  {/* no room on phones; the names need it more */}
                  <ChevronRightIcon fontSize="small" sx={{ color: "text.secondary", flexShrink: 0, display: { xs: "none", sm: "block" } }} />
                </ListItemButton>
              );
            })}
          </List>

          {/* right: the options of the selected type; remounted per type so its search starts empty */}
          <FilterOptionList
            key={group.id}
            group={group}
            value={filters[group.id] ?? null}
            onChange={(value) => onChange({ ...filters, [group.id]: value })}
          />
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", px: 1.75, py: 1.25, borderTop: 1, borderColor: "divider" }}>
          <Button color="inherit" onClick={clearAll} disabled={count === 0} sx={{ color: "text.secondary" }}>
            Clear all
          </Button>
          <Button variant="contained" onClick={() => setAnchor(null)}>
            Done
          </Button>
        </Box>
      </Popover>
    </>
  );
};

export default FilterPanel;
