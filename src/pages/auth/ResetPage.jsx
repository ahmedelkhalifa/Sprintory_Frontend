import { Box, Card, Typography, TextField, Button, InputAdornment, Divider, Link} from "@mui/material";
import {MailOutlined,  ArrowForward} from "@mui/icons-material";
import {Link as RouterLink} from "react-router-dom";
function ResetPage(){
    return(
        <Box sx={{
            alignItems: "center",
            bgcolor: "background.default",
            display: "flex",
            justifyContent: "center",
            minHeight: "100vh",
            pb: 10,
        }}>
            <Card sx={{
                width: "100%",
                maxWidth: 520,
                p: 4,
                textAlign: "center",
            }}>
                <Box sx={{width: 64, height: 64, borderRadius: "50%", bgcolor: "ai.background", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2,}}>
                    <MailOutlined color="primary" fontSize="large" />
                </Box>
            <Typography variant="h4" sx={{fontWeight: 700}}>
                Reset your password
            </Typography>
                <Typography color="text.secondary" sx={{mt: 1,mb: 3,}}>
                    Enter your email address and we'll send you a link to reset your password
                </Typography>
                <Typography variant="body1" align="left" sx={{mb: 1, fontWeight: 700}}>
                    Email address
                </Typography>
                <TextField placeholder="you@example.com" type="email" fullWidth slotProps={{
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <MailOutlined/>
                            </InputAdornment>
                        ),
                    }
                }}/>
                <Button variant="contained" fullWidth sx={{mt: 2}} endIcon={<ArrowForward />}>
                    Send reset link
                </Button>
                <Divider sx={{mt: 3}}>
                    <Link component={RouterLink} to ="/login" underline="none">
                        Back to sign in
                    </Link>
                </Divider>
            </Card>
        </Box>
    );
}
export default ResetPage;