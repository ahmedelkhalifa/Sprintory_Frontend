// "Ada Lovelace" -> "AL", "Backend" -> "BA", "ada@example.com" -> "AE"
export const initials = (name = "") => {
  const words = name.split(/[\s@.]+/).filter(Boolean);
  const letters = words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? "").slice(0, 2);
  return letters.toUpperCase();
};

// member responses carry firstName/lastName/email, any of which can be missing
export const memberLabel = (member) => {
  const name = [member.firstName, member.lastName].filter(Boolean).join(" ").trim();
  return name || member.email || `User ${member.userId}`;
};
