import { Avatar, Box, Card, Link, Typography } from "@mui/material";
import { AccessTime } from "@mui/icons-material";

function RecentActivity({ items }) {
    return (
        <Card sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AccessTime />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Recent activity</Typography>
                </Box>
                <Link component="button" underline="none" variant="body2">View all</Link>
            </Box>
            {items.map((a) => (
                <Box key={a.initials + a.when} sx={{ display: "flex", gap: 1.5, py: 1 }}>
                    <Avatar sx={{ width: 40, height: 40, fontSize: 14, bgcolor: "ai.background", color: "text.primary" }}>
                        {a.initials}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2">
                            <b>{a.who}</b> {a.what}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">{a.target}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                        {a.when}
                    </Typography>
                </Box>
            ))}
        </Card>
    );
}

export default RecentActivity;