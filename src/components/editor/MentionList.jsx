import { forwardRef, useImperativeHandle, useState } from "react";
import { Box, Chip, List, ListItemButton, ListItemText, Paper, Typography } from "@mui/material";

// The @ suggestion list, rendered by TipTap's ReactRenderer (so inside the editor's React tree and theme).
// `items` come from mentionSuggestion, `command(item)` inserts one. The parent forwards the arrow keys and Enter.
const MentionList = forwardRef(({ items, command }, ref) => {
  const [selected, setSelected] = useState(0);
  // the list changes while typing: keep the selection inside it
  const index = Math.min(selected, Math.max(items.length - 1, 0));

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (!items.length) return false;
      if (event.key === "ArrowUp") {
        setSelected((index + items.length - 1) % items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelected((index + 1) % items.length);
        return true;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        command(items[index]);
        return true;
      }
      return false;
    },
  }));

  return (
    <Paper elevation={6} sx={{ width: 280, maxWidth: "90vw", maxHeight: 260, overflowY: "auto", py: 0.5 }}>
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
          No matching members or teams
        </Typography>
      ) : (
        <List dense disablePadding role="listbox" aria-label="Mention suggestions">
          {items.map((item, i) => (
            <ListItemButton
              key={`${item.kind}-${item.id}`}
              selected={i === index}
              role="option"
              aria-selected={i === index}
              // keep the editor focused, so the mention goes where the caret is
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => command(item)}
            >
              <ListItemText
                primary={
                  <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box component="span" sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.label}
                    </Box>
                    {item.kind === "team" && <Chip label="team" size="small" variant="outlined" sx={{ height: 18, fontSize: 11 }} />}
                  </Box>
                }
                secondary={item.detail}
                slotProps={{ secondary: { noWrap: true, fontSize: 12 } }}
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Paper>
  );
});

MentionList.displayName = "MentionList";

export default MentionList;
