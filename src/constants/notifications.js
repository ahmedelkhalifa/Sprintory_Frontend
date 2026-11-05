// Notification preference categories as the backend sends them (notifications-docs.md §6), with our own texts.
// The order on the page is the order of GET /notification-preferences, not of this object.
// INVITATION and SECURITY are locked: always on in both channels.
export const NOTIFICATION_CATEGORIES = {
  ASSIGNMENT: { label: "Task assignments", description: "Someone assigns a task to you." },
  MENTION: { label: "Mentions", description: "Someone mentions you or your team." },
  COMMENT: { label: "Comments", description: "New comments on tasks you watch." },
  STATUS_CHANGE: { label: "Status changes", description: "A task you watch moves to another column." },
  PROJECT_MEMBERSHIP: {
    label: "Project membership and roles",
    description: "You are added to a project or your project roles change.",
  },
  SPRINT: { label: "Sprints", description: "A sprint starts, is completed or is cancelled in your projects." },
  INVITATION: { label: "Workspace invitations", description: "You are invited to a workspace." },
  SECURITY: { label: "Security alerts", description: "Your password changes, or repeated failed sign-ins." },
};
