import { forwardRef, useImperativeHandle, useState } from "react";
import { Paper, List, ListItemButton, ListItemText, Typography, Chip, Box } from "@mui/material";

const MentionList = forwardRef(({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index) => {
        const item = items[index];
        if (item) {
            command({ id: item.id, label: item.label, kind: item.kind });
        }
    };

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }) => {
            if (event.key === "ArrowUp") {
                setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
                return true;
            }
            if (event.key === "ArrowDown") {
                setSelectedIndex((prev) => (prev + 1) % items.length);
                return true;
            }
            if (event.key === "Enter") {
                selectItem(selectedIndex);
                return true;
            }
            return false;
        },
    }));

    if (!items.length) {
        return (
            <Paper elevation={3} sx={{ p: 1, minWidth: 200 }}>
                <Typography variant="body2" color="text.secondary">No results</Typography>
            </Paper>
        );
    }

    return (
        <Paper elevation={4} sx={{ maxHeight: 240, overflowY: "auto", width: 260 }}>
            <List size="small" disablePadding>
                {items.map((item, index) => (
                    <ListItemButton
                        key={`${item.kind}-${item.id}`}
                        selected={index === selectedIndex}
                        onClick={() => selectItem(index)}
                    >
                        <ListItemText
                            primary={
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Typography variant="body2" fontWeight={600}>{item.label}</Typography>
                                    {item.kind === "team" && <Chip label="team" size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} />}
                                </Box>
                            }
                            secondary={item.sub}
                            secondaryTypographyProps={{ fontSize: 11 }}
                        />
                    </ListItemButton>
                ))}
            </List>
        </Paper>
    );
});

export default MentionList;