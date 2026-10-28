import { Link as RouterLink } from "react-router-dom";
import { Box, Tab, Tabs } from "@mui/material";

// Overview / Members / Backlog / Board / Sprints / Reports / Files / Settings. Each tab is a link to its own url,
// so the browser's back button and a refresh keep the tab. `tabs` come from tabsFor(template),
// `pathFor(id)` builds a tab's url.
const ProjectTabs = ({ value, tabs, pathFor }) => {
  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
      <Tabs
        value={value}
        variant="scrollable"
        scrollButtons={false}
        sx={{ minHeight: 44, "& .MuiTabs-indicator": { height: 3, borderRadius: 1 } }}
      >
        {tabs.map(({ id, label, Icon }) => (
          <Tab
            key={id}
            value={id}
            label={label}
            component={RouterLink}
            to={pathFor(id)}
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
