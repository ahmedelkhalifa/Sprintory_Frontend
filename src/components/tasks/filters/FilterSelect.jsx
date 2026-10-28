import { useState } from "react";
import { Box, Button, Divider, ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CheckIcon from "@mui/icons-material/Check";

// One filter of the filter bar as a dropdown button ("Type", or "Type: Bug" once picked).
// `options` are { value, label, Icon?, tone? }; one value at a time (the backend takes one per filter),
// and the first item clears it. `emptyText` shows when there is nothing to pick yet (e.g. no labels).
const FilterSelect = ({ label, value, options, onChange, emptyText = "Nothing to filter by yet" }) => {
  const [anchor, setAnchor] = useState(null);
  const picked = options.find((option) => option.value === value);

  const choose = (next) => {
    setAnchor(null);
    onChange(next);
  };

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        color={picked ? "primary" : "inherit"}
        endIcon={<KeyboardArrowDownIcon />}
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        sx={{
          height: 40,
          maxWidth: 220,
          fontWeight: 500,
          borderColor: picked ? "primary.main" : "divider",
          bgcolor: picked ? "navActive.background" : "background.paper",
        }}
      >
        <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {picked ? `${label}: ${picked.label}` : label}
        </Box>
      </Button>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { mt: 0.5, minWidth: 200, maxHeight: 360 } } }}
      >
        <MenuItem selected={!picked} onClick={() => choose(null)}>
          <ListItemText>Any {label.toLowerCase()}</ListItemText>
        </MenuItem>
        <Divider />
        {options.length === 0 && (
          <MenuItem disabled>
            <ListItemText>{emptyText}</ListItemText>
          </MenuItem>
        )}
        {options.map((option) => (
          <MenuItem key={option.value} selected={option.value === value} onClick={() => choose(option.value)}>
            {option.Icon && (
              <ListItemIcon sx={{ color: option.tone }}>
                <option.Icon fontSize="small" />
              </ListItemIcon>
            )}
            <ListItemText>{option.label}</ListItemText>
            {option.value === value && <CheckIcon fontSize="small" sx={{ ml: 1.5, color: "primary.main" }} />}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default FilterSelect;
