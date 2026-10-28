import { Autocomplete, Box, FormLabel, TextField } from "@mui/material";
import UserAvatar from "../general/UserAvatar";
import { listProjectMembers } from "../../api/projectsApi";
import { usePagedList } from "../../hooks/usePagedList";
import { memberLabel } from "../../utils/people";

// "Assignee" field: the project's members, searched on the server as the user types. `value` is a member
// ({ userId, firstName, ... }) or null for unassigned; a member with only a userId still shows.
const AssigneePicker = ({ id, projectId, value, onChange, disabled = false }) => {
  const people = usePagedList(
    (params, signal) => listProjectMembers(projectId, params, signal),
    [projectId],
    { enabled: !disabled, size: 20 },
  );
  // the current assignee stays a valid option even when the search doesn't return them
  const options = value && !people.items.some((member) => member.userId === value.userId) ? [value, ...people.items] : people.items;

  return (
    <Box>
      <FormLabel htmlFor={id} sx={{ display: "block", mb: 0.5, fontSize: 14, fontWeight: 500, color: "text.primary" }}>
        Assignee
      </FormLabel>
      <Autocomplete
        id={id}
        value={value}
        onChange={(_, member) => onChange(member)}
        onInputChange={(_, text, reason) => reason === "input" && people.setSearch(text)}
        options={options}
        filterOptions={(list) => list} // the server already searched
        getOptionLabel={memberLabel}
        isOptionEqualToValue={(option, selected) => option.userId === selected.userId}
        loading={people.loading}
        disabled={disabled}
        noOptionsText={people.search ? "No members match" : "No members"}
        renderOption={({ key, ...props }, member) => (
          <Box component="li" key={key} {...props} sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <UserAvatar user={member} size={26} />
            {memberLabel(member)}
          </Box>
        )}
        renderInput={(params) => <TextField {...params} size="small" placeholder="Unassigned" />}
      />
    </Box>
  );
};

export default AssigneePicker;
