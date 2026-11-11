import { Box, Button, Typography } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SectionCard from "../../general/SectionCard";

// The project's description (plain text, line breaks kept) at the top of the Overview, the same card as the
// charter sections under it. Edit opens the Edit project window, which also changes the name.
const ProjectDescriptionCard = ({ project, canEdit, onEdit }) => (
  <SectionCard
    title="Description"
    toolbar={
      canEdit && (
        <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={onEdit}>
          Edit
        </Button>
      )
    }
  >
    <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 2 }}>
      {project.description ? (
        <Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{project.description}</Typography>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No description yet.
        </Typography>
      )}
    </Box>
  </SectionCard>
);

export default ProjectDescriptionCard;
