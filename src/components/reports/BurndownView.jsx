import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, Box, Chip, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { getBurndown } from "../../api/burndownApi";
import { listSprints, listEndedSprints } from "../../api/sprintsApi";
import { useAsync } from "../../hooks/useAsync";
import LoadState from "../general/LoadState";
import {
  DAY_OPTIONS,
  UNIT_OPTIONS,
  formatAmount,
  loadOptions,
  saveOptions,
  startedSprints,
  unestimatedText,
} from "../../utils/burndown";
import BurndownChart from "./BurndownChart";
import BurndownSummary from "./BurndownSummary";

const STATUS = {
  ON_TRACK: { label: "On track", color: "info" },
  AHEAD: { label: "Ahead", color: "success" },
  BEHIND: { label: "Behind", color: "error" },
};

// accepts a plain array or a PageResponse
const asList = (response) => (Array.isArray(response) ? response : (response?.content ?? response?.items ?? []));

const Select = ({ label, value, options, onChange }) => (
  <TextField select size="small" label={label} value={value} onChange={(e) => onChange(e.target.value)} sx={{ minWidth: 200 }}>
    {options.map((option) => (
      <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
    ))}
  </TextField>
);

const BurndownView = ({ projectId }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [options, setOptions] = useState(loadOptions);

  const sprints = useAsync(
    async (signal) => {
      const [current, ended] = await Promise.all([
        listSprints(projectId, signal),
        listEndedSprints(projectId, signal),
      ]);
      return startedSprints(asList(current), asList(ended));
    },
    [projectId],
    { fallback: "Couldn't load the sprints. Please try again." },
  );

  // the chosen sprint lives in the url, so "View burndown" can link to it
  const linkedId = searchParams.get("sprint");
  const defaultId = sprints.data?.[0] ? String(sprints.data[0].id) : null;
  const sprintId = linkedId ?? defaultId;

  const { unit, days } = options;
  const burndown = useAsync((signal) => getBurndown(sprintId, { unit, days }, signal), [sprintId, unit, days], {
    enabled: Boolean(sprintId),
    fallback: "Couldn't load the burndown. Please try again.",
    messages: { RESOURCE_NOT_FOUND: "Sprint not found" },
  });

  // the chart is not real-time, so it loads again when the window regains focus
  const { reload: reloadSprints } = sprints;
  const { reload: reloadBurndown } = burndown;
  useEffect(() => {
    const reload = () => {
      reloadSprints();
      reloadBurndown();
    };
    window.addEventListener("focus", reload);
    return () => window.removeEventListener("focus", reload);
  }, [reloadSprints, reloadBurndown]);

  // a linked sprint that doesn't exist falls back to the default one
  const linkedMissing = Boolean(linkedId) && burndown.errorCode === "RESOURCE_NOT_FOUND";
  useEffect(() => {
    if (!linkedMissing) return;
    setSearchParams(
      (params) => {
        params.delete("sprint");
        return params;
      },
      { replace: true },
    );
  }, [linkedMissing, setSearchParams]);

  const changeOption = (name, value) => {
    const next = { ...options, [name]: value };
    setOptions(next);
    saveOptions(next);
  };

  const changeSprint = (id) =>
    setSearchParams((params) => {
      params.set("sprint", id);
      return params;
    });

  // data stays during a reload, so the page doesn't blink on focus
  if (!sprints.data) {
    return <LoadState loading={!sprints.error} error={sprints.error} onRetry={sprints.reload} rows={6} />;
  }
  if (!sprintId) return <Typography color="text.secondary">No sprint has started yet.</Typography>;

  const sprintOptions = sprints.data.map((sprint) => ({
    value: String(sprint.id),
    label: sprint.status === "CANCELLED" ? `${sprint.name} (Cancelled)` : sprint.name,
  }));
  const data = burndown.data;
  const status = data?.sprintStatus === "ACTIVE" ? STATUS[data.status] : null;

  const renderBurndown = () => {
    if (burndown.errorCode === "CONFLICT") {
      return <Typography color="text.secondary">Sprint has not started.</Typography>;
    }
    if (!data) {
      return <LoadState loading={!burndown.error} error={burndown.error} onRetry={burndown.reload} rows={6} />;
    }
    if (!data.hasDailyData) {
      return (
        <Box>
          <Typography>No daily data for this sprint</Typography>
          {data.summary.committed != null && (
            <Typography color="text.secondary">Committed: {formatAmount(data.summary.committed)}</Typography>
          )}
        </Box>
      );
    }
    return (
      <Stack spacing={2}>
        <BurndownSummary summary={data.summary} />
        {data.unit === "POINTS" && data.summary.unestimatedTasks > 0 && (
          <Alert severity="info">{unestimatedText(data.summary.unestimatedTasks)}</Alert>
        )}
        <BurndownChart burndown={data} />
      </Stack>
    );
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" useFlexGap spacing={2} sx={{ flexWrap: "wrap", alignItems: "center" }}>
        <Select
          label="Sprint"
          value={sprintOptions.some((option) => option.value === sprintId) ? sprintId : ""}
          options={sprintOptions}
          onChange={changeSprint}
        />
        <Select label="Unit" value={unit} options={UNIT_OPTIONS} onChange={(value) => changeOption("unit", value)} />
        <Select label="Days" value={days} options={DAY_OPTIONS} onChange={(value) => changeOption("days", value)} />
        {status && <Chip size="small" color={status.color} label={status.label} />}
        {data?.sprintStatus === "CANCELLED" && <Chip size="small" label="Cancelled" />}
      </Stack>
      {renderBurndown()}
    </Stack>
  );
};

export default BurndownView;
