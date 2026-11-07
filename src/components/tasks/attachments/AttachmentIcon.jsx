import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import FolderZipOutlinedIcon from "@mui/icons-material/FolderZipOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import SlideshowOutlinedIcon from "@mui/icons-material/SlideshowOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import { attachmentKind } from "../../../utils/attachment";

const KINDS = {
  pdf: { Icon: PictureAsPdfOutlinedIcon, tone: "error.main" },
  word: { Icon: DescriptionOutlinedIcon, tone: "info.main" },
  excel: { Icon: TableChartOutlinedIcon, tone: "success.main" },
  powerpoint: { Icon: SlideshowOutlinedIcon, tone: "warning.main" },
  text: { Icon: ArticleOutlinedIcon, tone: "text.secondary" },
  image: { Icon: ImageOutlinedIcon, tone: "text.secondary" },
  zip: { Icon: FolderZipOutlinedIcon, tone: "text.secondary" },
  file: { Icon: InsertDriveFileOutlinedIcon, tone: "text.secondary" },
};

// the icon of a file's type; also what an image falls back to when it can't load
const AttachmentIcon = ({ attachment }) => {
  const { Icon, tone } = KINDS[attachmentKind(attachment)];
  return <Icon sx={{ color: tone }} />;
};

export default AttachmentIcon;
