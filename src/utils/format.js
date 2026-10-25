// readable date for tables and lists: "2026-03-09" -> "Mar 9, 2026"
export const formatDate = (date) => {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";

  // a date-only string ("2026-03-09") is parsed as UTC midnight, so show it in UTC
  // or it can appear as the previous day in timezones behind UTC
  const isDateOnly = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date);
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(isDateOnly && { timeZone: "UTC" }),
  });
};

const UNITS = [
  [60 * 60 * 24, "day"],
  [60 * 60, "hour"],
  [60, "minute"],
];

// how long ago something happened, for activity feeds: "2 hours ago"; older than a week -> the date
export const timeAgo = (date, now = Date.now()) => {
  const time = new Date(date).getTime();
  if (Number.isNaN(time)) return "";
  const seconds = Math.max(0, Math.round((now - time) / 1000));
  if (seconds >= 60 * 60 * 24 * 7) return formatDate(date);
  for (const [size, name] of UNITS) {
    const count = Math.floor(seconds / size);
    if (count >= 1) return `${count} ${name}${count === 1 ? "" : "s"} ago`;
  }
  return "just now";
};
