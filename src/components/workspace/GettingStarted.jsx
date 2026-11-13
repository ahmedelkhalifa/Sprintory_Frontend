import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import { CheckCircle, RadioButtonUnchecked } from "@mui/icons-material";
import SectionCard from "../general/SectionCard";

// what each step is for; the labels and done flags come from setupSteps (utils/myWork.js)
const DESCRIPTIONS = {
  project: "A project holds its board, backlog, sprints, charter and chat.",
  invite: "People join with the link in their invitation email.",
  team: "Group people, then add the whole team to a project at once.",
  task: "Plan the work on a project's board or backlog.",
};

// hidden per workspace and per browser; storage can be blocked, then it just shows again
const hiddenKey = (workspaceId) => `setupHidden:${workspaceId}`;
const readHidden = (workspaceId) => {
  try {
    return localStorage.getItem(hiddenKey(workspaceId)) === "true";
  } catch {
    return false;
  }
};
const saveHidden = (workspaceId) => {
  try {
    localStorage.setItem(hiddenKey(workspaceId), "true");
  } catch {
    // not remembered: it comes back on the next visit
  }
};

// "Set up your workspace" for an admin of a new workspace: each step ticks itself off from the workspace's data.
// steps: [{ id, label, done }]; actions: { [id]: { label, onClick } | { label, to } } for the open steps
const GettingStarted = ({ workspaceId, steps, actions, sx }) => {
  const [hidden, setHidden] = useState(() => readHidden(workspaceId));
  const doneCount = steps.filter((step) => step.done).length;
  if (hidden || doneCount === steps.length) return null;

  const hide = () => {
    saveHidden(workspaceId);
    setHidden(true);
  };

  return (
    <SectionCard
      sx={sx}
      title="Set up your workspace"
      toolbar={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            {doneCount} of {steps.length} done
          </Typography>
          <Button size="small" variant="text" color="inherit" onClick={hide}>
            Hide
          </Button>
        </Box>
      }
    >
      {/* 1px gaps over the divider colour draw the lines between the steps, however they wrap */}
      <Box
        component="ol"
        sx={{
          m: 0,
          p: 0,
          listStyle: "none",
          display: "grid",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
          gap: "1px",
          bgcolor: "divider",
        }}
      >
        {steps.map((step) => {
          const action = actions[step.id];
          return (
            <Box
              component="li"
              key={step.id}
              sx={{ display: "flex", gap: 1.5, px: { xs: 2, sm: 2.5 }, py: 2, bgcolor: "background.paper" }}
            >
              {step.done ? (
                <CheckCircle sx={{ color: "success.main", fontSize: 20, mt: "1px" }} titleAccess="Done" />
              ) : (
                <RadioButtonUnchecked sx={{ color: "text.disabled", fontSize: 20, mt: "1px" }} titleAccess="Not done yet" />
              )}
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600, color: step.done ? "text.secondary" : "text.primary" }}>
                  {step.label}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  {DESCRIPTIONS[step.id]}
                </Typography>
                {!step.done && action && (
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{ mt: 1.25 }}
                    {...(action.to ? { component: RouterLink, to: action.to } : { onClick: action.onClick })}
                  >
                    {action.label}
                  </Button>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </SectionCard>
  );
};

export default GettingStarted;
