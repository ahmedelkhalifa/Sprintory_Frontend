import { useState } from "react";
import { Alert, Box, Button, Skeleton, Stack, Typography } from "@mui/material";
import ToneChip from "../general/ToneChip";
import { listScopeChanges } from "../../api/sprintsApi";
import { useAsync } from "../../hooks/useAsync";
import { useSubmit } from "../../hooks/useSubmit";
import { TASK_ERROR_MESSAGES } from "../../constants/tasks";
import { formatDate } from "../../utils/format";
import { memberLabel } from "../../utils/people";

const PAGE_SIZE = 10;

// Tasks added to or taken out of the active sprint after it started (backend sprints-docs §4), newest first,
// PAGE_SIZE at a time with "Load more". The backend sends only the actor's id, so `members` give the names.
const ScopeChanges = ({ sprintId, members }) => {
  const first = useAsync((signal) => listScopeChanges(sprintId, { page: 0, size: PAGE_SIZE }, signal), [sprintId], {
    fallback: "Couldn't load the scope changes.",
    messages: TASK_ERROR_MESSAGES,
  });
  const [more, setMore] = useState([]); // the pages after the first, in order
  const loadMore = useSubmit(TASK_ERROR_MESSAGES);

  if (first.error) return <Alert severity="error">{first.error}</Alert>;
  if (!first.data) return <Skeleton variant="rounded" height={48} />;

  const pages = [first.data, ...more];
  const changes = pages.flatMap((page) => page.content);
  const last = pages.at(-1);
  const hasMore = last.page + 1 < last.totalPages;
  const people = new Map(members.map((member) => [member.userId, member]));

  const handleMore = async () => {
    const { ok, result } = await loadMore.run(() => listScopeChanges(sprintId, { page: last.page + 1, size: PAGE_SIZE }));
    if (ok) setMore((prev) => [...prev, result]);
  };

  if (changes.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Nothing was added or taken out since the sprint started.
      </Typography>
    );
  }

  return (
    <Stack spacing={1}>
      {changes.map((change) => {
        const added = change.action === "ADDED";
        const actor = people.get(change.actorId);
        return (
          <Box key={change.id} sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 1, rowGap: 0.5 }}>
            <ToneChip label={added ? "Added" : "Removed"} tone={added ? "success.main" : "warning.main"} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {change.taskKey}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {actor ? memberLabel(actor) : "A former member"} · {formatDate(change.changedAt)}
            </Typography>
          </Box>
        );
      })}
      {loadMore.error && <Alert severity="error">{loadMore.error}</Alert>}
      {hasMore && (
        <Box>
          <Button size="small" onClick={handleMore} loading={loadMore.submitting}>
            Load more
          </Button>
        </Box>
      )}
    </Stack>
  );
};

export default ScopeChanges;
