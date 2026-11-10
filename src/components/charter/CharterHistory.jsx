import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Typography } from "@mui/material";
import ArrowRightAltRoundedIcon from "@mui/icons-material/ArrowRightAltRounded";
import SectionCard from "../general/SectionCard";
import LoadState from "../general/LoadState";
import UserAvatar from "../general/UserAvatar";
import RichText from "../editor/RichText";
import { getCharterHistory } from "../../api/charterApi";
import { useAsync } from "../../hooks/useAsync";
import { CHARTER_ERROR_MESSAGES } from "../../constants/charter";
import { errorMessage } from "../../utils/apiError";
import { charterHistoryLine, goalTitles, isScopeEmpty } from "../../utils/charter";
import { formatDate, timeAgo } from "../../utils/format";
import { mergeHistory } from "../../utils/task";

const PAGE_SIZE = 20;

// one side of an old → new pair: plain text, a rich text (scope, drawn node by node) or "None"
const ValueBox = ({ value, rich, label }) => (
  <Box
    aria-label={label}
    sx={{
      flex: 1,
      minWidth: 0,
      px: 1.5,
      py: 1,
      borderRadius: 1.5,
      border: 1,
      borderColor: "divider",
      bgcolor: "action.hover",
      maxHeight: 220,
      overflowY: "auto",
    }}
  >
    <Typography variant="overline" color="text.secondary" sx={{ display: "block", lineHeight: 1.6 }}>
      {label}
    </Typography>
    {value == null || (rich && isScopeEmpty(value)) ? (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
        None
      </Typography>
    ) : rich ? (
      <RichText value={value} sx={{ fontSize: 14 }} />
    ) : (
      <Typography variant="body2" sx={{ wordBreak: "break-word", whiteSpace: "pre-line" }}>
        {value}
      </Typography>
    )}
  </Box>
);

const Entry = ({ entry, titles }) => {
  const line = charterHistoryLine(entry, titles);
  // the actor's name is a snapshot from the time of the change
  const name = entry.actorName || "Someone";
  return (
    <Box component="li" sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
      <UserAvatar user={{ userId: entry.actorId, firstName: name }} size={30} />
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
          <Box component="span" sx={{ fontWeight: 600 }}>
            {name}
          </Box>{" "}
          {line.text}{" "}
          <Typography
            component="time"
            dateTime={entry.occurredAt}
            variant="caption"
            color="text.secondary"
            title={`${formatDate(entry.occurredAt)} ${new Date(entry.occurredAt).toLocaleTimeString()}`}
          >
            · {timeAgo(entry.occurredAt)}
          </Typography>
        </Typography>
        {line.changes.map((change) => (
          <Box key={change.label} sx={{ mt: 1 }}>
            {line.changes.length > 1 && (
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {change.label}
              </Typography>
            )}
            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { sm: "stretch" }, gap: 1, mt: 0.5 }}>
              <ValueBox value={change.from} rich={change.rich} label="Before" />
              <ArrowRightAltRoundedIcon
                aria-hidden
                sx={{ color: "text.secondary", alignSelf: "center", transform: { xs: "rotate(90deg)", sm: "none" } }}
              />
              <ValueBox value={change.to} rich={change.rich} label="After" />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// Charter history (goal and scope changes; stakeholders are not tracked): who, when, old → new. Newest first,
// PAGE_SIZE at a time with "Load older". `version` changes after an edit on this tab, so new entries show on top.
// `goals` (the current ones) name the goals in a reorder.
const CharterHistory = ({ project, goals, version }) => {
  const first = useAsync(
    (signal) => getCharterHistory(project.id, { page: 0, size: PAGE_SIZE }, signal),
    [project.id],
    { fallback: "Couldn't load the charter history. Please try again.", messages: CHARTER_ERROR_MESSAGES },
  );
  // older entries: pages loaded with "Load older", plus what an earlier page 0 showed (the history is append-only)
  const [more, setMore] = useState({ items: [], total: 0, loading: false, error: "" });
  const [shownFirst, setShownFirst] = useState(first.data);
  if (first.data !== shownFirst) {
    setShownFirst(first.data);
    if (shownFirst) setMore((prev) => ({ ...prev, items: [...prev.items, ...shownFirst.content] }));
  }

  // a reload, not a dependency: the list stays on screen while new entries load in on top
  const { reload } = first;
  const seenVersion = useRef(version);
  useEffect(() => {
    if (version === seenVersion.current) return;
    seenVersion.current = version;
    reload();
  }, [version, reload]);

  const entries = first.data ? mergeHistory(first.data.content, more.items) : [];
  const total = first.data ? Math.max(first.data.totalElements, more.total) : 0;
  const hasMore = entries.length < total;
  const titles = goalTitles(entries, goals);

  const loadMore = async () => {
    setMore((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      // the page the next older entry is on; entries already shown are dropped by mergeHistory
      const page = Math.floor(entries.length / PAGE_SIZE);
      const data = await getCharterHistory(project.id, { page, size: PAGE_SIZE });
      setMore((prev) => ({ items: [...prev.items, ...data.content], total: data.totalElements, loading: false, error: "" }));
    } catch (err) {
      const error = errorMessage(err, "Couldn't load older history. Please try again.", CHARTER_ERROR_MESSAGES);
      setMore((prev) => ({ ...prev, loading: false, error }));
    }
  };

  return (
    <SectionCard title="Charter history" count={first.data ? total : undefined}>
      {!first.data ? (
        <LoadState loading={!first.error} error={first.error} onRetry={reload} rows={3} />
      ) : entries.length === 0 ? (
        <Typography sx={{ p: { xs: 3, sm: 4 }, textAlign: "center", color: "text.secondary" }}>
          No changes to goals or scope yet.
        </Typography>
      ) : (
        <Box sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
          <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 2.5 }}>
            {entries.map((entry) => (
              <Entry key={entry.id} entry={entry} titles={titles} />
            ))}
          </Box>
          {more.error && (
            <Alert
              severity="error"
              sx={{ mt: 2 }}
              action={
                <Button color="inherit" size="small" onClick={loadMore}>
                  Try again
                </Button>
              }
            >
              {more.error}
            </Alert>
          )}
          {hasMore && !more.error && (
            <Button size="small" onClick={loadMore} loading={more.loading} sx={{ mt: 2 }}>
              Load older
            </Button>
          )}
        </Box>
      )}
    </SectionCard>
  );
};

export default CharterHistory;
