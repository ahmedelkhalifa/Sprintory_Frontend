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

// TODO: confirm the Google OAuth URL with the backend team
export const continueWithGoogle = () => {
  window.location.href = `${api.defaults.baseURL}/auth/google`;
};
