const MESSAGES = {
    VALIDATION_ERROR: "Please check the entered values.",
    ACCESS_DENIED: "You don't have permission to do this.",
    RESOURCE_NOT_FOUND: "Not found, or you don't have access.",
    WORKSPACE_ARCHIVED: "This workspace is archived. Restore it to make changes.",
    WORKSPACE_NOT_ARCHIVED: "Archive the workspace before deleting it.",
    CONFLICT: "That name is already in use.",
    SERVICE_UNAVAILABLE: "We couldn't send the email. Please try again later.",
    NETWORK_ERROR: "Can't reach the server.",
};

export const errorCode = (err) => err.response?.data?.code ?? "NETWORK_ERROR";

export const errorMessage = (err) =>
    MESSAGES[errorCode(err)] ?? "Something went wrong. Please try again.";