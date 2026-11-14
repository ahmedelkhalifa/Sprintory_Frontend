import { Box, Button, Divider, Typography } from "@mui/material";
import SectionCard from "../../general/SectionCard";

// what each archive / restore / delete row says; the confirmation dialog repeats it before anything happens
const STATUS_ROWS = {
  archive: {
    title: "Archive this project",
    text: "It becomes read-only and moves to the Archived tab. You can restore it at any time.",
  },
  restore: {
    title: "Restore this project",
    text: "It becomes active again, and its members can work on it.",
  },
  delete: {
    title: "Delete this project",
    text: "The project and everything in it are deleted for everyone. This can't be undone.",
  },
};

// the same colors as the confirmation windows: delete red, archive amber, restore plain
const buttonColor = (action, danger) => (danger ? "error" : action === "archive" ? "warning" : "inherit");

// Settings → Archive or delete. `actions` from statusActionsFor; each opens the same confirmation dialog as the
// "Project settings" menu, through `onAction(type)`.
const ArchiveSection = ({ actions, onAction }) => (
  <SectionCard title="Archive or delete">
    {actions.map(({ action, label, Icon, danger }, index) => (
      <Box key={action}>
        {index > 0 && <Divider />}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { sm: "center" },
            justifyContent: "space-between",
            gap: 2,
            px: { xs: 2, sm: 3 },
            py: 2,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600 }}>{STATUS_ROWS[action].title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {STATUS_ROWS[action].text}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color={buttonColor(action, danger)}
            startIcon={<Icon />}
            onClick={() => onAction(action)}
            sx={{
              flexShrink: 0,
              alignSelf: { xs: "flex-start", sm: "center" },
              borderColor: buttonColor(action, danger) === "inherit" ? "divider" : undefined,
            }}
          >
            {label}
          </Button>
        </Box>
      </Box>
    ))}
  </SectionCard>
);

export default ArchiveSection;
