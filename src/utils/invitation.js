// the backend's INVITE_PATH: emailed links open `/accept-invite?token=...`
export const INVITE_PATH = "/accept-invite";

// localStorage, not sessionStorage: the verify-email link opens in a new tab
// and Google sign-in is a full-page redirect, and the token has to survive both
const STORAGE_KEY = "pendingInviteToken";

export const invitePath = (token) => `${INVITE_PATH}?token=${encodeURIComponent(token)}`;

// the server lower-cases invited emails; compare the same way
export const sameEmail = (a, b) =>
  Boolean(a && b) && a.trim().toLowerCase() === b.trim().toLowerCase();

// kept while the invitee signs in or registers, so ProtectedRoute can bring them back
export const savePendingInvite = (token) => {
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // storage blocked: login still comes back through state.from, only register loses it
  }
};

export const pendingInvite = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || null;
  } catch {
    return null;
  }
};

export const clearPendingInvite = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // see savePendingInvite
  }
};
