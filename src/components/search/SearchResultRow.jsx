import { Box, Typography } from "@mui/material";
import {
  CheckBoxOutlined, FolderOpenOutlined, GroupOutlined, WorkspacesOutlined,
} from "@mui/icons-material";
import { SEARCH_TYPE_LABEL, highlightParts } from "../../utils/search";

const ICONS = { WORKSPACE: WorkspacesOutlined, PROJECT: FolderOpenOutlined, TEAM: GroupOutlined, TASK: CheckBoxOutlined };

// the parts of `text` that contain `q` in bold
const Highlighted = ({ text, q }) =>
  highlightParts(text, q).map((part, index) =>
    part.match ? (
      <Box key={index} component="mark" sx={{ bgcolor: "transparent", color: "inherit", fontWeight: 700 }}>
        {part.text}
      </Box>
    ) : (
      part.text
    ),
  );

// One search hit: its kind's icon, the task key before a task's title, the title with the matched text in bold,
// and the subtitle (workspace name, or "KEY · project" for a task). `showType` adds the kind in front of the subtitle,
// for lists that aren't grouped by kind.
const SearchResultRow = ({ result, q, showType = false }) => {
  const Icon = ICONS[result.type] ?? CheckBoxOutlined;
  const subtitle = [showType && SEARCH_TYPE_LABEL[result.type]?.one, result.subtitle].filter(Boolean).join(" · ");

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, width: "100%" }}>
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1.5,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "action.hover",
          color: "text.secondary",
        }}
      >
        <Icon fontSize="small" />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography noWrap sx={{ fontSize: 14, fontWeight: 500 }}>
          {result.taskKey && (
            <Box component="span" sx={{ color: "text.secondary", fontWeight: 600, mr: 0.75 }}>
              <Highlighted text={result.taskKey} q={q} />
            </Box>
          )}
          <Highlighted text={result.title} q={q} />
        </Typography>
        {subtitle && (
          <Typography noWrap variant="body2" color="text.secondary" sx={{ fontSize: 12.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default SearchResultRow;
