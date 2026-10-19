import { Box, Card, Typography, TextField, Button} from "@mui/material";
import {MailOutlined} from "@mui/icons-material";
import {InputAdornment} from "@mui/material";
import {ArrowForward} from "@mui/icons-material";
function ResetPage(){
    return(
        <Box sx={{
            alignItems: "center",
            bgcolor: "background.default",
            display: "flex",
            justifyContent: "center",
            minHeight: "100vh",
        }}>
            <Card sx={{
                width: "100%",
                maxWidth: 520,
                p: 4,
                textAlign: "center",
            }}>
            <Typography variant="h4" fontWeight={700}>
                Reset your password
            </Typography>
                <Typography color="text.secondary" sx={{mt: 1,mb: 3,}}>
                    Enter your email adress and we'll send you link a to reset your password
                </Typography>
                <Typography variant="h6" align="left">
                    Email adress
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
            </Card>
        </Box>
    );
}
export default ResetPage;