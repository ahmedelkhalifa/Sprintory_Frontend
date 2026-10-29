import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { Box, Button, List, ListItemButton, Paper, Tab, Tabs, Typography } from "@mui/material";
import { TravelExploreOutlined } from "@mui/icons-material";
import PageLayout from "../../components/layouts/PageLayout";
import SearchField from "../../components/general/SearchField";
import LoadState from "../../components/general/LoadState";
import Pager from "../../components/general/Pager";
import ScopeMenu from "../../components/search/ScopeMenu";
import SearchResultRow from "../../components/search/SearchResultRow";
import { search } from "../../api/searchApi";
import { useWorkspaces } from "../../context/WorkspaceContext";
import { useAsync } from "../../hooks/useAsync";
import {
  EVERYWHERE, MIN_QUERY_LENGTH, SEARCH_TYPE_LABEL, scopeFromParams, searchPagePath, searchQuery, searchResultPath,
  searchScopes,
} from "../../utils/search";

const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;
const ALL = "ALL";

// /search?q=&workspaceId=|projectId=&type=&page= : every result of a search, one kind per tab, page by page.
// Everything is in the url, so a refresh or a shared link shows the same results. The top bar's "See all results"
// and Enter land here.
const SearchPage = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { workspaces, current } = useWorkspaces();
  const q = searchQuery(params.get("q"));
  const scope = scopeFromParams(params, workspaces);
  const type = scope.types.includes(params.get("type")) ? params.get("type") : null;
  const page = Math.max(0, Number.parseInt(params.get("page") ?? "0", 10) || 0);

  // the scope in the url stays an option even when it isn't the current workspace
  const scopes = searchScopes({ workspace: current, projectId: scope.params.projectId });
  const scopeOptions = scopes.some((s) => s.id === scope.id) ? scopes : [...scopes, scope];

  // the field's text; a new q in the url (e.g. from the top bar) replaces it, unless it's just what was typed
  const [draft, setDraft] = useState({ q, text: params.get("q") ?? "" });
  if (draft.q !== q) setDraft({ q, text: searchQuery(draft.text) === q ? draft.text : q });

  // typing updates the url once the user stops, back on the first page
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchQuery(draft.text);
      if (next === q) return;
      const updated = new URLSearchParams(params);
      if (next) updated.set("q", next);
      else updated.delete("q");
      updated.delete("page");
      setParams(updated, { replace: true });
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [draft.text, q, params, setParams]);

  const go = (change) => navigate(searchPagePath({ q, scope, type, page: 0, ...change }));

  const results = useAsync(
    (signal) => search({ q, ...(type && { types: [type] }), ...scope.params, page, size: PAGE_SIZE }, signal),
    [q, type, scope.id, page],
    { enabled: q !== "", fallback: "Search failed. Please try again." },
  );
  const data = results.data;
  const what = type ? SEARCH_TYPE_LABEL[type].many.toLowerCase() : "results";

  return (
    <PageLayout>
      <Typography component="h1" variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.04em", mb: 2.5 }}>
        Search
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, mb: 2 }}>
        <SearchField
          value={draft.text}
          onChange={(text) => setDraft({ ...draft, text })}
          placeholder="Search workspaces, projects, teams, tasks"
          sx={{ width: { xs: "100%", sm: 420 } }}
        />
        <ScopeMenu
          scope={scope}
          scopes={scopeOptions}
          onChange={(next) => go({ scope: next, type: next.types.includes(type) ? type : null })}
          sx={{ height: 40, color: "text.primary" }}
        />
      </Box>

      <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        <Tabs
          value={type ?? ALL}
          onChange={(_, value) => go({ type: value === ALL ? null : value })}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{ px: 1, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab value={ALL} label="All" />
          {scope.types.map((kind) => (
            <Tab key={kind} value={kind} label={SEARCH_TYPE_LABEL[kind].many} />
          ))}
        </Tabs>

        {!q ? (
          <Typography sx={{ p: { xs: 3, sm: 5 }, textAlign: "center", color: "text.secondary" }}>
            Type at least {MIN_QUERY_LENGTH} characters to search.
          </Typography>
        ) : (
          <LoadState loading={results.loading} error={results.error} onRetry={results.reload} rows={6}>
            {data?.content.length === 0 && data.totalElements > 0 ? (
              // a page past the end (an old link)
              <Box sx={{ p: { xs: 3, sm: 5 }, textAlign: "center" }}>
                <Button onClick={() => go({ page: 0 })}>Back to the first page</Button>
              </Box>
            ) : data?.content.length === 0 ? (
              <Box sx={{ p: { xs: 3, sm: 5 }, textAlign: "center" }}>
                <Typography color="text.secondary">
                  No {what} for "{q}" in {scope.label}.
                </Typography>
                {scope.id !== EVERYWHERE.id && (
                  <Button startIcon={<TravelExploreOutlined />} onClick={() => go({ scope: EVERYWHERE })} sx={{ mt: 1.5 }}>
                    Search all workspaces
                  </Button>
                )}
              </Box>
            ) : (
              data && (
                <>
                  <List disablePadding>
                    {data.content.map((result) => (
                      <ListItemButton
                        key={`${result.type}-${result.id}`}
                        component={RouterLink}
                        to={searchResultPath(result, workspaces)}
                        divider
                        sx={{ px: { xs: 2, sm: 3 }, py: 1.25 }}
                      >
                        <SearchResultRow result={result} q={q} showType={!type} />
                      </ListItemButton>
                    ))}
                  </List>
                  <Pager
                    page={page}
                    size={PAGE_SIZE}
                    total={data.totalElements}
                    totalPages={data.totalPages}
                    shown={data.content.length}
                    noun="result"
                    onPageChange={(next) => go({ page: next })}
                  />
                </>
              )
            )}
          </LoadState>
        )}
      </Paper>
    </PageLayout>
  );
};

export default SearchPage;
