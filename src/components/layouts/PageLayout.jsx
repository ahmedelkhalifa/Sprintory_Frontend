import { Box } from "@mui/material";

// Frame for the pages inside the app (projects, members, ...):
// cream background, content centred with a max width, and side padding that shrinks on phones.
// No fixed height, so it also works inside an app shell (sidebar + top bar) later.
const PageLayout = ({ children }) => {
  return (
    <Box sx={{ minHeight: "100%", bgcolor: "background.default" }}>
      <Box
        component="main"
        sx={{
          maxWidth: 1200,
          mx: "auto",
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 3, md: 4 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default PageLayout;
