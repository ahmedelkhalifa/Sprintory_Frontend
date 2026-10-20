import api from "./client";

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
