import { useState } from "react";
import { Button, ListItemIcon, Menu, MenuItem } from "@mui/material";
import { Check, KeyboardArrowDown } from "@mui/icons-material";

// "In: Acme ▾": picks where the search looks (everywhere / the workspace / this project).
// `scopes` come from searchScopes; `onChange` gets the picked scope. `sx` styles the button (e.g. white on the top bar).
const ScopeMenu = ({ scope, scopes, onChange, sx }) => {
  const [anchor, setAnchor] = useState(null);
  if (scopes.length < 2) return null;

  const pick = (next) => {
    setAnchor(null);
    if (next.id !== scope.id) onChange(next);
  };

  return (
    <>
      <Button
        size="small"
        color="inherit"
        endIcon={<KeyboardArrowDown />}
        // inside the search field: don't let the click focus the input and open its dropdown
        onClick={(e) => {
          e.stopPropagation();
          setAnchor(e.currentTarget);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        aria-label={`Search in: ${scope.label}`}
        sx={{ fontWeight: 500, whiteSpace: "nowrap", minWidth: 0, ...sx }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>In: {scope.label}</span>
      </Button>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        // the search field takes the focus back itself
        disableRestoreFocus
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { mt: 0.5, minWidth: 200 } } }}
      >
        {scopes.map((option) => (
          <MenuItem key={option.id} selected={option.id === scope.id} onClick={() => pick(option)}>
            <ListItemIcon>{option.id === scope.id && <Check fontSize="small" />}</ListItemIcon>
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default ScopeMenu;
