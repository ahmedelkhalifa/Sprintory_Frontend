import { Box } from "@mui/material";
import { PAGE_MAX_WIDTH } from "../../theme/layout";

// Content frame for pages inside AppShell (projects, members, ...).
// AppShell already gives the background, the <main> element and the outer padding,
// so this only caps the width on very wide screens; below that the page uses the full width
const PageLayout = ({ children }) => {
  return <Box sx={{ maxWidth: PAGE_MAX_WIDTH, mx: "auto", minWidth: 0 }}>{children}</Box>;
};

export default PageLayout;
