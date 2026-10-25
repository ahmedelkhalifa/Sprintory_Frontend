/**
 * Initials for an avatar when the user has no photo.
 * getInitials("Mobeen", "Adil") -> "MA"
 */
export function getInitials(firstName = "", lastName = "") {
  const first = firstName.trim().charAt(0);
  const last = lastName.trim().charAt(0);
  return `${first}${last}`.toUpperCase() || "?";
}

/**
 * How long ago something happened, for activity feeds.
 * timeAgo(twoHoursAgo) -> "2 hours ago"; older than a week -> the date ("Oct 1, 2026")
 */
export function timeAgo(date, now = Date.now()) {
  const time = new Date(date).getTime();
  if (Number.isNaN(time)) return "";
  const seconds = Math.max(0, Math.round((now - time) / 1000));
  const units = [
    [60 * 60 * 24, "day"],
    [60 * 60, "hour"],
    [60, "minute"],
  ];
  if (seconds >= 60 * 60 * 24 * 7) return formatDate(date);
  for (const [size, name] of units) {
    const count = Math.floor(seconds / size);
    if (count >= 1) return `${count} ${name}${count === 1 ? "" : "s"} ago`;
  }
  return "just now";
}

/**
 * Readable date for tables and lists.
 * formatDate("2026-03-09") -> "Mar 9, 2026"
 */
export function formatDate(date) {
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
}
