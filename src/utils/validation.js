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

// project keys (projects-docs.md §2): 2 to 10 letters or digits, starting with a letter; stored upper-case
export const PROJECT_KEY_MAX = 10;
export const validateProjectKey = (key) => {
  if (!key.trim()) return "Project key is required";
  if (!/^[A-Za-z][A-Za-z0-9]{1,9}$/.test(key.trim())) return "Use 2 to 10 letters or digits, starting with a letter";
  return "";
};

// keep only the fields that have an error
const onlyErrors = (errors) =>
  Object.fromEntries(Object.entries(errors).filter(([, message]) => message));

// the create-project form: { name, key } (the template always has a value, the description is optional)
export const validateNewProject = (values) =>
  onlyErrors({ name: validateProjectName(values.name), key: validateProjectKey(values.key) });

// a blank number field means "none" (no estimate, no capacity); otherwise 0 or more
const nonNegative = (value) => {
  if (value === "" || value == null) return "";
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? "" : "Enter a number of 0 or more";
};

export const TASK_TITLE_MAX = 255;
export const TASK_LABELS_MAX = 20;
export const TASK_LABEL_MAX = 50;

// tasks (backend tasks-docs §1): title required, at most 255 characters; estimate story points, a whole number
// of 0 or more; at most 20 labels of at most 50 characters
export const validateTask = (values) => {
  const title = (values.title ?? "").trim();
  const labels = values.labels ?? [];
  const estimate = nonNegative(values.estimate);
  return onlyErrors({
    title: !title ? "Title is required" : title.length > TASK_TITLE_MAX ? `Use at most ${TASK_TITLE_MAX} characters` : "",
    estimate:
      estimate || (values.estimate !== "" && values.estimate != null && !Number.isInteger(Number(values.estimate)))
        ? "Enter a whole number of 0 or more"
        : "",
    labels:
      labels.length > TASK_LABELS_MAX
        ? `Use at most ${TASK_LABELS_MAX} labels`
        : labels.some((label) => label.length > TASK_LABEL_MAX)
          ? `Each label can have at most ${TASK_LABEL_MAX} characters`
          : "",
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
