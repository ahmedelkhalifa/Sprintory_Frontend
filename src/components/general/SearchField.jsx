import { IconButton, InputAdornment, TextField } from "@mui/material";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import CloseIcon from "@mui/icons-material/Close";

// Small search input with a search icon and a clear (x) button
// onChange receives the new text, not the event
const SearchField = ({ value, onChange, placeholder = "Search...", sx }) => {
  return (
    <TextField
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      slotProps={{
        htmlInput: { "aria-label": placeholder },
        input: {
          startAdornment: (
            <InputAdornment position="start" sx={{ color: "text.secondary" }}>
              <SearchOutlinedIcon fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: value && (
            <InputAdornment position="end">
              <IconButton size="small" edge="end" aria-label="Clear search" onClick={() => onChange("")}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
      sx={{
        width: { xs: "100%", sm: 260 },
        "& .MuiOutlinedInput-root": { bgcolor: "background.paper" },
        "& .MuiOutlinedInput-notchedOutline": { borderColor: "divider" },
        ...sx,
      }}
    />
  );
};

export default SearchField;
