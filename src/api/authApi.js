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

// Google sign-in is handled by Spring Security outside /api/v1, so use the backend origin only
export const continueWithGoogle = () => {
  const backendOrigin = new URL(api.defaults.baseURL, window.location.origin).origin;
  window.location.href = `${backendOrigin}/oauth2/authorization/google`;
};
