import { useState } from "react";
import { Box, Divider, Tab, Tabs } from "@mui/material";
import WorkspaceTopBar from "./WorkspaceTopBar";
import WorkspaceHeader from "./WorkspaceHeader";
import { WORKSPACE } from "./mockData";

const TABS = ["Overview", "Projects", "Teams", "People", "Settings"];

function WorkspacePage() {
    const [tab, setTab] = useState(0);

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
            <WorkspaceTopBar />
            <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2, md: 4 }, py: 4 }}>
                <WorkspaceHeader {...WORKSPACE} />

                <Box sx={{ borderBottom: 1, borderColor: "divider", mt: 3 }}>
                    <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                        {TABS.map((t) => (
                            <Tab key={t} label={t} sx={{ textTransform: "none", fontWeight: 500 }} />
                        ))}
                    </Tabs>
                </Box>

                {/* Overview content добавим в следующих коммитах */}
                <Divider sx={{ display: "none" }} />
            </Box>
        </Box>
    );
}

export default WorkspacePage;