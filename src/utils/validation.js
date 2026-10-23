const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (email) => {
  if (!email.trim()) return "Email is required";
  if (!EMAIL_REGEX.test(email.trim())) return "Enter a valid email address";
  return "";
};

export const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  return "";
};

// Returns { field: message } for every invalid field (empty object = valid)
export const validateRegister = (values) => {
  const errors = {
    firstName: values.firstName.trim() ? "" : "First name is required",
    lastName: values.lastName.trim() ? "" : "Last name is required",
    email: validateEmail(values.email),
    password: validatePassword(values.password),
  };

  // keep only the fields that have an error
  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => message),
  );
};
