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

// keep only the fields that have an error
const onlyErrors = (errors) =>
  Object.fromEntries(Object.entries(errors).filter(([, message]) => message));

// Returns { field: message } for every invalid field (empty object = valid)
export const validateRegister = (values) =>
  onlyErrors({
    firstName: values.firstName.trim() ? "" : "First name is required",
    lastName: values.lastName.trim() ? "" : "Last name is required",
    email: validateEmail(values.email),
    password: validatePassword(values.password),
  });

// no length rule on login: the backend decides if the password is right,
// and the form shouldn't hint at the password policy
export const validateLogin = (values) =>
  onlyErrors({
    email: validateEmail(values.email),
    password: values.password ? "" : "Password is required",
  });
