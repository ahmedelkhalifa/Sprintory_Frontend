import { useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import WorkspaceHeader from "./WorkspaceHeader";
import StatCards from "./StatCards";
import ProjectsTable from "./ProjectsTable";
import TeamsPanel from "./TeamsPanel";
import RecentActivity from "./RecentActivity";
import { ACTIVITY, PROJECTS, STATS, TEAMS, WORKSPACE } from "./mockData";

const TABS = ["Overview", "Projects", "Teams", "People", "Settings"];

function WorkspacePage() {
    const [tab, setTab] = useState(0);

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
            <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2, md: 4 }, py: 4 }}>
                <WorkspaceHeader {...WORKSPACE} />

                <Box sx={{ borderBottom: 1, borderColor: "divider", mt: 3, mb: 3 }}>
                    <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                        {TABS.map((t) => (
                            <Tab key={t} label={t} sx={{ textTransform: "none", fontWeight: 500 }} />
                        ))}
                    </Tabs>
                </Box>

                {tab === 0 && (
                    <Box sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 2fr) minmax(0, 1fr)" },
                        gap: 3,
                        alignItems: "start",
                    }}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <StatCards stats={STATS} />
                            <ProjectsTable projects={PROJECTS} />
                        </Box>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <TeamsPanel teams={TEAMS} />
                            <RecentActivity items={ACTIVITY} />
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
}

export default WorkspacePage;