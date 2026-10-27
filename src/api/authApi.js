import api from "./client";

// Create a new account. The backend should respond with the created user.
export const signUp = async ({ firstName, lastName, email, password }) => {
  const res = await api.post("/auth/register", {
    firstName,
    lastName,
    email,
    password,
  });
  return res.data;
};

// Activate the account with the token from the emailed link. 204 on success.
export const verifyEmail = async (token) => {
  await api.post("/auth/verify-email", { token });
};

// Always 202, whether or not the email has an account, so it never reveals who is registered.
// A verified password account gets a /reset-password?token=... link by email.
export const requestPasswordReset = async (email) => {
  await api.post("/auth/forgot-password", { email });
};

// Set a new password with the token from the emailed link. 204 on success;
// the backend also logs the user out on every device.
export const resetPassword = async ({ token, newPassword }) => {
  await api.post("/auth/reset-password", { token, newPassword });
};

// Google sign-in is handled by Spring Security outside /api/v1, so use the backend origin only
export const continueWithGoogle = () => {
  const backendOrigin = new URL(api.defaults.baseURL, window.location.origin).origin;
  window.location.href = `${backendOrigin}/oauth2/authorization/google`;
};
/**
 * Backend contract to confirm with the auth team:
 * POST /auth/login { email, password, rememberMe } creates the session cookie.
 * GET /auth/me returns the authenticated user.
 * The configured VITE_API_URL supplies the API prefix (for example /api/v1).
 */
export async function signInWithEmail({ email, password, rememberMe }) {
  await api.post("/auth/login", { email, password, rememberMe });
  const { data } = await api.get("/auth/me");
  return data;
}
