import { Box, Card, Typography } from "@mui/material";
import { ChevronRight, FolderOpenOutlined, GroupsOutlined, PersonOutlined, TrendingUp } from "@mui/icons-material";

const ICONS = {
    projects: <FolderOpenOutlined />,
    teams: <GroupsOutlined />,
    members: <PersonOutlined />,
    active: <TrendingUp />,
};

function StatCards({ stats }) {
    return (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
            {stats.map((s) => (
                <Card key={s.key} sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, cursor: "pointer" }}>
                    <Box sx={{
                        width: 56, height: 56, borderRadius: 2, flexShrink: 0,
                        bgcolor: "ai.background", color: "primary.main",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        {ICONS[s.key]}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.1 }}>{s.value}</Typography>
                        <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                    </Box>
                    <ChevronRight sx={{ color: "text.secondary" }} />
                </Card>
            ))}
        </Box>
    );
}

export default StatCards;