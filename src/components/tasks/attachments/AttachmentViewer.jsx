import { Box, Button, Dialog, DialogContent, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import AttachmentImage from "./AttachmentImage";

// an image attachment at full size, with its name and a download button
const AttachmentViewer = ({ attachment, downloading, onDownload, onClose }) => (
  <Dialog open onClose={onClose} maxWidth="lg" aria-labelledby="attachment-viewer-title">
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1.5, borderBottom: 1, borderColor: "divider" }}>
      <Typography id="attachment-viewer-title" noWrap sx={{ fontWeight: 600, flexGrow: 1, minWidth: 0 }}>
        {attachment.fileName}
      </Typography>
      <Button
        size="small"
        startIcon={<FileDownloadOutlinedIcon fontSize="small" />}
        loading={downloading}
        onClick={onDownload}
        sx={{ flexShrink: 0 }}
      >
        Download
      </Button>
      <IconButton size="small" aria-label="Close" onClick={onClose}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
    <DialogContent sx={{ p: 0, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 120 }}>
      <AttachmentImage
        attachment={attachment}
        sx={{ display: "block", maxWidth: "100%", maxHeight: "calc(100vh - 140px)", objectFit: "contain" }}
      />
    </DialogContent>
  </Dialog>
);

export default AttachmentViewer;
