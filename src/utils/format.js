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
