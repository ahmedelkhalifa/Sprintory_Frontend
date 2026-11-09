import { useEffect, useState } from "react";
import { Autocomplete, Box, TextField, Typography } from "@mui/material";
import UserAvatar from "../general/UserAvatar";
import { listWorkspaceMembers } from "../../api/workspacesApi";
import { errorMessage, isAbort } from "../../utils/apiError";
import { memberLabel } from "../../utils/people";

const SEARCH_DELAY_MS = 300;

const toOption = (member) => ({ userId: member.userId, label: memberLabel(member), email: member.email, member });

// Picks a workspace member to link a stakeholder to (they don't have to be in the project), or none.
// Searches the workspace's members on the server (first name, last name or email). `value` is { userId, label }.
const LinkedUserPicker = ({ workspaceId, value, onChange, disabled, error, helperText }) => {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  // results are tagged with the search they belong to, so a stale response is never shown
  const [result, setResult] = useState({ key: null, options: [], error: "" });

  useEffect(() => {
    const timer = setTimeout(() => setQuery(input.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [input]);

  const key = open ? JSON.stringify([workspaceId, query]) : null;

  useEffect(() => {
    if (key === null) return undefined;
    const controller = new AbortController();
    listWorkspaceMembers(workspaceId, { size: 20, ...(query && { q: query }) }, controller.signal)
      .then((page) => setResult({ key, options: (page.content ?? []).map(toOption), error: "" }))
      .catch((err) => {
        if (isAbort(err) || controller.signal.aborted) return;
        setResult({ key, options: [], error: errorMessage(err, "Couldn't load the workspace members.") });
      });
    return () => controller.abort();
  }, [key, workspaceId, query]);

  const loading = open && result.key !== key;
  const options = result.key === key ? result.options : [];

  return (
    <Autocomplete
      id="stakeholder-linked-user"
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      value={value}
      onChange={(_, option) => onChange(option ? { userId: option.userId, label: option.label } : null)}
      inputValue={input}
      onInputChange={(_, text) => setInput(text)}
      options={options}
      // the server already filtered them
      filterOptions={(list) => list}
      isOptionEqualToValue={(option, selected) => option.userId === selected.userId}
      getOptionLabel={(option) => option.label ?? ""}
      loading={loading}
      disabled={disabled}
      noOptionsText={result.key === key && result.error ? result.error : "No workspace members found"}
      renderOption={({ key: optionKey, ...props }, option) => (
        <Box component="li" key={optionKey} {...props} sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <UserAvatar user={option.member} size={28} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
              {option.label}
            </Typography>
            {option.email && (
              <Typography variant="caption" color="text.secondary" noWrap component="div">
                {option.email}
              </Typography>
            )}
          </Box>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Search workspace members"
          error={error}
          helperText={helperText}
          sx={{ "& .MuiOutlinedInput-root": { bgcolor: "background.paper" } }}
        />
      )}
    />
  );
};

export default LinkedUserPicker;
