// Sizes and colors of the Timeline chart (PMP-48), shared by its parts.

// one task per row; its bar keeps BAR_INSET pixels above and below
export const ROW_HEIGHT = 40;
export const BAR_INSET = 9;
// the date header: months (or years) over days, weeks or months
export const AXIS_HEIGHT = 52;
// under it, the milestones' diamonds (only when the project has milestones)
export const MILESTONE_LANE = 24;
// the task list on the left, sticky while the chart scrolls sideways
export const LIST_WIDTH = 300;
export const LIST_WIDTH_PHONE = 150;

// a bar's fill and text by its status category: gray to do, blue in progress, green done. The row list also shows
// the category as an icon (StageIcon), so it never rests on color alone
export const STAGE_STYLE = {
  TODO: { fill: "secondary.main", text: "secondary.contrastText" },
  IN_PROGRESS: { fill: "info.main", text: "info.contrastText" },
  DONE: { fill: "success.main", text: "success.contrastText" },
};

// the zoom someone picked last, kept in localStorage
export const ZOOM_STORAGE_KEY = "timelineZoom";
