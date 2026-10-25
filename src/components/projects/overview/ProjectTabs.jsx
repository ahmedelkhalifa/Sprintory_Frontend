import { Box, Tab, Tabs } from "@mui/material";
import { tabsFor } from "./tabList";

// Overview / Members / Backlog / Sprints / Reports / Files / Settings, switched inside the page.
// Backlog and Sprints only show for Scrum projects.
const ProjectTabs = ({ value, onChange, template }) => {
  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
      <Tabs
        value={value}
        onChange={(_, next) => onChange(next)}
        variant="scrollable"
        scrollButtons={false}
        sx={{ minHeight: 44, "& .MuiTabs-indicator": { height: 3, borderRadius: 1 } }}
      >
        {tabsFor(template).map(({ id, label, Icon }) => (
          <Tab
            key={id}
            value={id}
            label={label}
            icon={<Icon fontSize="small" />}
            iconPosition="start"
            sx={{ minHeight: 44, minWidth: 0, px: { xs: 1.25, sm: 2 }, gap: 0.5, textTransform: "none", fontWeight: 600, fontSize: 15 }}
          />
        ))}
      </Tabs>
    </Box>
  );
};

export default ProjectTabs;
