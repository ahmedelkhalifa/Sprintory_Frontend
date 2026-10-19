import { Box, Card, Typography, TextField, Button} from "@mui/material";
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
                maxWidth: 420,
                p: 4,
                textAlign: "center",
            }}>
            <Typography variant="h5" fontWeight={700}>
                Reset your password
            </Typography>
                <Typography color="text.secondary" sx={{mt: 1,mb: 3,}}>
                    Enter your email, so we can send you link to reset your password
                </Typography>
                <TextField label="you@example.com" type="email" fullWidth />
                <Button variant="contained" fullWidth sx={{mt: 2}}>
                    Send link
                </Button>
            </Card>
        </Box>
    );
}
export default ResetPage;