import { Box, Button, Card, Divider, Link, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Add, ChevronRight, GroupsOutlined } from "@mui/icons-material";
import MemberStack from "./MemberStack";

function TeamsPanel({ teams }) {
    return (
        <Card>
            <Box sx={{ p: 2.5, pb: 1.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <GroupsOutlined />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>Teams</Typography>
                    </Box>
                    <Button size="small" startIcon={<Add />}>Create team</Button>
                </Box>
                <Typography variant="body2" color="text.secondary">Teams in this workspace.</Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 1 }}>
                {teams.map((t) => (
                    <Box key={t.code} sx={{
                        display: "flex", alignItems: "center", gap: 1.5, p: 1.25, borderRadius: 2,
                        cursor: "pointer", "&:hover": { bgcolor: "action.hover" },
                    }}>
                        <Box sx={(th) => ({
                            width: 40, height: 40, borderRadius: 1.5, flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 700, fontSize: 13,
                            bgcolor: alpha(th.palette.primary.main, 0.12), color: "primary.main",
                        })}>
                            {t.code}
                        </Box>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 600 }} noWrap>{t.name}</Typography>
                            <Typography variant="body2" color="text.secondary">{t.members} members</Typography>
                        </Box>
                        <MemberStack count={t.members} />
                        <ChevronRight sx={{ color: "text.secondary" }} />
                    </Box>
                ))}
            </Box>
            <Divider />
            <Box sx={{ p: 2 }}>
                <Link component="button" underline="none" sx={{ display: "flex", alignItems: "center" }}>
                    View all teams <ChevronRight fontSize="small" />
                </Link>
            </Box>
        </Card>
    );
}

export default TeamsPanel;