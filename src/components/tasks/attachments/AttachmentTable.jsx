import { useState } from "react";
import {
  Box,
  ButtonBase,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import AttachmentIcon from "./AttachmentIcon";
import AttachmentImage from "./AttachmentImage";
import { formatFileSize, sortAttachments } from "../../../utils/attachment";
import { formatDate } from "../../../utils/format";

const THUMBNAIL = 32;

// the table sits in the page's left column, whose width doesn't follow the screen's (the sidebar and the details
// take their share), so these look at the table's own width: on a narrow one who and when move under the name
const WIDE = "@container (min-width: 620px)";
const wideCellSx = { display: "none", [WIDE]: { display: "table-cell" } };
const narrowOnlySx = { [WIDE]: { display: "none" } };

const headCellSx = { color: "text.secondary", fontWeight: 500, borderColor: "divider", py: 1, px: 1 };
const cellSx = { py: 1, px: 1 };

// the order a column starts in when it's first clicked
const FIRST_DIRECTION = { name: "asc", date: "desc", size: "desc" };

const uploaderName = (attachment) => attachment.uploader?.name ?? "Deleted user";

// the "⋯" menu of one file
const AttachmentMenu = ({ attachment, downloading, canDelete, onDownload, onDelete }) => {
  const [anchor, setAnchor] = useState(null);
  const close = () => setAnchor(null);
  const run = (action) => () => {
    close();
    action();
  };

  return (
    <>
      <Tooltip title="More actions">
        <IconButton
          size="small"
          loading={downloading}
          aria-label={`Actions for ${attachment.fileName}`}
          onClick={(event) => setAnchor(event.currentTarget)}
        >
          <MoreHorizIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close}>
        <MenuItem onClick={run(onDownload)}>
          <ListItemIcon>
            <FileDownloadOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>
        {canDelete && (
          <MenuItem onClick={run(onDelete)} sx={{ color: "error.main" }}>
            <ListItemIcon sx={{ color: "inherit" }}>
              <DeleteOutlineRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

// a task's files, like Jira's list view: a sortable table, newest first. An image's name opens it (`onView`), any
// other file's downloads it. `fileName` is user input, so it only ever goes in as text. Delete needs `canEdit` and
// the attachment's own `canDelete`.
const AttachmentTable = ({ attachments, canEdit, downloadingId, onView, onDownload, onDelete }) => {
  const [sort, setSort] = useState({ by: "date", direction: "desc" });

  const sortBy = (by) => {
    setSort((prev) => {
      if (prev.by !== by) return { by, direction: FIRST_DIRECTION[by] };
      return { by, direction: prev.direction === "asc" ? "desc" : "asc" };
    });
  };

  const sortLabel = (by, label) => (
    <TableSortLabel active={sort.by === by} direction={sort.by === by ? sort.direction : FIRST_DIRECTION[by]} onClick={() => sortBy(by)}>
      {label}
    </TableSortLabel>
  );

  return (
    <Box sx={{ containerType: "inline-size" }}>
      {/* fixed layout: column widths come from the header, so a long file name can't stretch the table */}
      <Table size="small" sx={{ tableLayout: "fixed" }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...headCellSx, pl: 0 }}>{sortLabel("name", "Name")}</TableCell>
            <TableCell sx={{ ...headCellSx, ...wideCellSx, width: 140 }}>Added by</TableCell>
            <TableCell sx={{ ...headCellSx, ...wideCellSx, width: 130 }}>{sortLabel("date", "Date added")}</TableCell>
            <TableCell sx={{ ...headCellSx, width: 90 }}>{sortLabel("size", "Size")}</TableCell>
            <TableCell sx={{ ...headCellSx, width: 44 }} aria-label="Actions" />
          </TableRow>
        </TableHead>
        <TableBody>
          {sortAttachments(attachments, sort).map((attachment) => (
            <TableRow key={attachment.id} hover sx={{ "& td": { borderColor: "divider" } }}>
              <TableCell sx={{ ...cellSx, pl: 0 }}>
                <ButtonBase
                  onClick={() => (attachment.image ? onView(attachment) : onDownload(attachment))}
                  sx={{ display: "flex", justifyContent: "flex-start", gap: 1.5, width: "100%", borderRadius: 1, textAlign: "left" }}
                >
                  <Box
                    sx={{
                      width: THUMBNAIL,
                      height: THUMBNAIL,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 1,
                      overflow: "hidden",
                      border: 1,
                      borderColor: "divider",
                    }}
                  >
                    {attachment.image ? (
                      <AttachmentImage
                        attachment={attachment}
                        alt=""
                        sx={{ width: THUMBNAIL, height: THUMBNAIL, objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <AttachmentIcon attachment={attachment} />
                    )}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" noWrap title={attachment.fileName}>
                      {attachment.fileName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", ...narrowOnlySx }}>
                      {uploaderName(attachment)} · {formatDate(attachment.uploadedAt)}
                    </Typography>
                  </Box>
                </ButtonBase>
              </TableCell>
              <TableCell sx={{ ...cellSx, ...wideCellSx, color: "text.secondary" }}>
                <Typography variant="body2" noWrap title={uploaderName(attachment)}>
                  {uploaderName(attachment)}
                </Typography>
              </TableCell>
              <TableCell sx={{ ...cellSx, ...wideCellSx, color: "text.secondary", whiteSpace: "nowrap" }}>
                {formatDate(attachment.uploadedAt)}
              </TableCell>
              <TableCell sx={{ ...cellSx, color: "text.secondary", whiteSpace: "nowrap" }}>
                {formatFileSize(attachment.sizeBytes)}
              </TableCell>
              <TableCell sx={{ ...cellSx, pr: 0, textAlign: "right" }}>
                <AttachmentMenu
                  attachment={attachment}
                  downloading={downloadingId === attachment.id}
                  canDelete={canEdit && attachment.canDelete}
                  onDownload={() => onDownload(attachment)}
                  onDelete={() => onDelete(attachment)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

export default AttachmentTable;
