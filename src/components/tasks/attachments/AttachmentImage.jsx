import { useState } from "react";
import { Box } from "@mui/material";
import AttachmentIcon from "./AttachmentIcon";
import { attachmentPreviewSrc } from "../../../api/attachmentsApi";
import { refreshSession } from "../../../api/client";

// An attachment's image, straight from the backend's preview url. An <img> can't refresh the login, and the access
// cookie lives 15 minutes, so a failed image refreshes once and tries again (a new `?v=`, or the browser wouldn't
// ask). If that fails too it shows the file's icon. `alt` is "" where the name is already written next to it.
const AttachmentImage = ({ attachment, alt = attachment.fileName, sx }) => {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  const handleError = async () => {
    if (attempt > 0) {
      setFailed(true);
      return;
    }
    try {
      await refreshSession();
      setAttempt(1);
    } catch {
      setFailed(true);
    }
  };

  if (failed) return <AttachmentIcon attachment={attachment} />;

  const src = attachmentPreviewSrc(attachment);
  return <Box component="img" src={attempt > 0 ? `${src}?v=${attempt}` : src} alt={alt} onError={handleError} sx={sx} />;
};

export default AttachmentImage;
