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

// project names: required, at most 100 characters (projects-docs.md §2); spaces around it don't count
export const validateProjectName = (name) => {
  if (!name.trim()) return "Project name is required";
  if (name.trim().length > 100) return "Use at most 100 characters";
  return "";
};

// keep only the fields that have an error
const onlyErrors = (errors) =>
  Object.fromEntries(Object.entries(errors).filter(([, message]) => message));

// a blank number field means "none" (no estimate, no capacity); otherwise 0 or more
const nonNegative = (value) => {
  if (value === "" || value == null) return "";
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? "" : "Enter a number of 0 or more";
};

// tasks (dev-docs/tasks.md): title required, at most 200 characters; estimate any number of 0 or more
export const validateTask = (values) => {
  const title = (values.title ?? "").trim();
  return onlyErrors({
    title: !title ? "Title is required" : title.length > 200 ? "Use at most 200 characters" : "",
    estimate: nonNegative(values.estimate),
  });
};

// sprints: dates are optional while planning, required to start one (`requireDates`)
export const validateSprint = (values, { requireDates = false } = {}) => {
  const { startDate, endDate } = values;
  let endError = "";
  if (requireDates && !endDate) endError = "End date is required";
  else if (startDate && endDate && endDate < startDate) endError = "End date can't be before the start date";
  return onlyErrors({
    name: (values.name ?? "").trim().length > 100 ? "Use at most 100 characters" : "",
    capacity: nonNegative(values.capacity),
    startDate: requireDates && !startDate ? "Start date is required" : "",
    endDate: endError,
  });
};

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

// keys match the backend's ResetPasswordRequest, so server fieldErrors land on the same fields
export const validateResetPassword = (values) =>
  onlyErrors({
    newPassword: validatePassword(values.newPassword),
    confirmPassword: values.confirmPassword === values.newPassword ? "" : "Passwords don't match",
  });
