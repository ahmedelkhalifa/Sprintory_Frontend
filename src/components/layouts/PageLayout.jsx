import { Box } from "@mui/material";

// Content frame for pages inside AppShell (projects, members, ...).
// AppShell already gives the background, the <main> element and the outer padding,
// so this only caps the width and centres the content on wide screens.
const PageLayout = ({ children }) => {
  return <Box sx={{ maxWidth: 1200, mx: "auto", minWidth: 0 }}>{children}</Box>;
};

export default PageLayout;
