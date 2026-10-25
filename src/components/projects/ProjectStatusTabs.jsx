import { Box, Tab, Tabs } from "@mui/material";
import { PROJECT_STATUS } from "../../constants/projects";

export const ALL_PROJECTS = "ALL";

const TABS = [
  { value: ALL_PROJECTS, label: "All", countKey: "all" },
  { value: PROJECT_STATUS.ACTIVE, label: "Active", countKey: "active" },
  { value: PROJECT_STATUS.ARCHIVED, label: "Archived", countKey: "archived" },
];

// small number next to a tab's name ("All 22"); shows nothing until the counts are loaded
const TabCount = ({ value, selected }) => (
  <Box
    component="span"
    sx={{
      minWidth: 22,
      px: 0.75,
      borderRadius: 1,
      fontSize: 12,
      fontWeight: 600,
      lineHeight: "20px",
      textAlign: "center",
      bgcolor: selected ? "navActive.background" : "background.default",
      color: selected ? "navActive.text" : "text.secondary",
    }}
  >
    {value}
  </Box>
);

// All / Active / Archived tabs with how many projects each has
const ProjectStatusTabs = ({ value, onChange, counts }) => {
  return (
    <Tabs
      value={value}
      onChange={(_, next) => onChange(next)}
      variant="scrollable"
      scrollButtons={false}
      sx={{ minHeight: 40, "& .MuiTabs-indicator": { height: 3, borderRadius: 1 } }}
    >
      {TABS.map((tab) => (
        <Tab
          key={tab.value}
          value={tab.value}
          sx={{ minHeight: 40, minWidth: 0, px: { xs: 1, sm: 1.5 }, fontWeight: 600, textTransform: "none", fontSize: 15 }}
          label={
            <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
              {tab.label}
              {counts && <TabCount value={counts[tab.countKey]} selected={value === tab.value} />}
            </Box>
          }
        />
      ))}
    </Tabs>
  );
};

export default ProjectStatusTabs;
