import { useState } from "react";
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Radio, Typography } from "@mui/material";
import SearchField from "../../general/SearchField";

// What sits before an option's name: an avatar (people), an icon in its color (types, priorities)
// or a small colored dot (labels)
const OptionLead = ({ option }) => {
  if (option.avatar) return option.avatar;
  if (option.Icon) return <option.Icon fontSize="small" sx={{ color: option.tone }} />;
  if (option.dotTone) return <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: option.dotTone }} />;
  return null;
};

// one choice of the list, with a radio (only one value per filter)
const OptionRow = ({ checked, onClick, option, label }) => (
  <ListItemButton selected={checked} onClick={onClick} sx={{ borderRadius: 1.5, py: 0.75, gap: 1.5 }}>
    <Radio checked={checked} tabIndex={-1} disableRipple size="small" sx={{ p: 0 }} slotProps={{ input: { "aria-label": label } }} />
    {option && (
      <ListItemIcon sx={{ minWidth: 0 }}>
        <OptionLead option={option} />
      </ListItemIcon>
    )}
    <ListItemText
      primary={label}
      secondary={option?.secondary}
      slotProps={{ primary: { noWrap: true, fontWeight: 500 }, secondary: { noWrap: true } }}
      sx={{ my: 0, minWidth: 0 }}
    />
  </ListItemButton>
);

// The Filter window's right side: the options of one filter type ("Any …" clears it).
// Types with many options (people, labels) get a search field; the list scrolls inside the window.
// `group` is { id, name, anyLabel, options: [{ value, label, secondary?, avatar?, Icon?, tone?, dotTone? }],
// searchPlaceholder?, emptyText? }; the parent remounts this per group, so the search starts empty.
const FilterOptionList = ({ group, value, onChange }) => {
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const shown = q
    ? group.options.filter((option) => `${option.label} ${option.secondary ?? ""}`.toLowerCase().includes(q))
    : group.options;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0, height: "100%" }}>
      <Box sx={{ px: 1.75, pt: 1.5, pb: 1 }}>
        <Typography sx={{ fontWeight: 700, mb: group.searchPlaceholder ? 1 : 0 }}>{group.name}</Typography>
        {group.searchPlaceholder && (
          <SearchField value={search} onChange={setSearch} placeholder={group.searchPlaceholder} sx={{ width: "100%" }} />
        )}
      </Box>

      {/* min-height 0 lets the list scroll inside the window instead of pushing the footer down */}
      <List dense sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 1, pt: 0 }} aria-label={`${group.name} options`}>
        <OptionRow checked={value === null} onClick={() => onChange(null)} label={group.anyLabel} />
        {shown.map((option) => (
          <OptionRow
            key={option.value}
            option={option}
            label={option.label}
            checked={option.value === value}
            onClick={() => onChange(option.value)}
          />
        ))}
        {group.options.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ px: 1.5, py: 2 }}>
            {group.emptyText ?? "Nothing to filter by yet."}
          </Typography>
        ) : (
          shown.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ px: 1.5, py: 2 }}>
              No matches for "{search.trim()}".
            </Typography>
          )
        )}
      </List>
    </Box>
  );
};

export default FilterOptionList;
