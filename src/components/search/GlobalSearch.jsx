import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Autocomplete, Box, Chip, IconButton, InputAdornment, ListSubheader, Paper, TextField, Typography, useMediaQuery,
} from "@mui/material";
import { ArrowBack, CloseRounded, SearchOutlined, TravelExploreOutlined } from "@mui/icons-material";
import SearchResultRow from "./SearchResultRow";
import { search } from "../../api/searchApi";
import { useWorkspaces } from "../../context/WorkspaceContext";
import { useAsync } from "../../hooks/useAsync";
import { useSearchScope } from "../../hooks/useSearchScope";
import {
  EVERYWHERE, MIN_QUERY_LENGTH, SEARCH_TYPE_LABEL, groupResults, searchPagePath, searchQuery, searchResultPath,
} from "../../utils/search";

// typing waits this long before asking the backend
const SEARCH_DELAY_MS = 300;
// how many hits the dropdown shows; the rest are on the /search page
const DROPDOWN_SIZE = 10;
const MORE_GROUP = "more";

// white-on-navy styles for the top bar
const onBar = (theme, opacity) => alpha(theme.palette.common.white, opacity);

const IS_MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);

// "/" shouldn't steal the focus from a field the user is typing in
const isTyping = (target) =>
  target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

// the dropdown's paper with the scope chips on top
const SearchPaper = ({ header, children, ...props }) => (
  <Paper {...props}>
    {header}
    {children}
  </Paper>
);

// "Search in: [All workspaces] [Acme] [This project]" at the top of the dropdown.
// A mouse down here would move the focus off the field and close the dropdown, so it's prevented.
const ScopeChips = ({ scope, scopes, onChange }) => (
  <Box
    onMouseDown={(e) => e.preventDefault()}
    sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75, px: 1.5, py: 1, borderBottom: 1, borderColor: "divider" }}
  >
    <Typography variant="body2" color="text.secondary" sx={{ mr: 0.25 }}>
      Search in
    </Typography>
    {scopes.map((option) => (
      <Chip
        key={option.id}
        size="small"
        label={option.label}
        color={option.id === scope.id ? "primary" : "default"}
        variant={option.id === scope.id ? "filled" : "outlined"}
        onClick={() => onChange(option)}
        aria-pressed={option.id === scope.id}
        sx={{ maxWidth: 200 }}
      />
    ))}
  </Box>
);

const linkSx = { fontSize: 14, fontWeight: 600, color: "primary.main", display: "flex", alignItems: "center", gap: 1 };

// The top bar's search (backend GET /search): a dropdown with the best hits grouped by kind while typing, Enter or
// "See all results" for the /search page. Looks in the current workspace by default (chips on top of the dropdown).
// Ctrl/⌘+K or "/" focuses it from anywhere; Up/Down/Enter/Esc work in the dropdown.
// On phones it's a search button that opens the field over the whole top bar.
const GlobalSearch = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down("sm"));
  const { workspaces } = useWorkspaces();
  const { scope, scopes, setScope } = useSearchScope();
  const inputRef = useRef(null);
  const keepOpen = useRef(false);
  const [text, setText] = useState("");
  const [typed, setTyped] = useState(""); // the text once the user stops typing
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false); // phones: the field is open over the top bar

  useEffect(() => {
    const timer = setTimeout(() => setTyped(text), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text]);

  useEffect(() => {
    const onKeyDown = (e) => {
      const shortcut = (e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey);
      const slash = e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey && !isTyping(e.target);
      if (!shortcut && !slash) return;
      e.preventDefault();
      // on a phone the field may not be there yet; it focuses itself when it opens
      if (!inputRef.current) setExpanded(true);
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // too short to search clears the results at once; a longer text waits for the pause
  const wanted = searchQuery(text);
  const q = wanted ? searchQuery(typed) : "";
  const results = useAsync((signal) => search({ q, size: DROPDOWN_SIZE, ...scope.params }, signal), [q, scope.id], {
    enabled: q !== "",
    fallback: "Search failed. Please try again.",
  });
  const page = q ? results.data : null;
  const loading = wanted !== "" && (wanted !== q || results.loading);

  // Each option carries what it shows: while the dropdown closes, Autocomplete keeps drawing the last options
  // after the search has been cleared. Info rows are disabled options, because freeSolo hides noOptionsText.
  const info = (message) => [{ kind: "info", text: message }];
  let options = [];
  if (!wanted) options = info(`Type at least ${MIN_QUERY_LENGTH} characters to search.`);
  else if (results.error && !loading) options = info(results.error);
  else if (page && page.totalElements === 0) {
    // nothing in this workspace / project: offer to look everywhere
    options = scope.id === EVERYWHERE.id ? info(`No results for "${q}".`) : [{ kind: "widen", scopeLabel: scope.label }];
  } else if (page) {
    options = [
      ...groupResults(page.content).flatMap((group) => group.items.map((result) => ({ kind: "hit", result, q }))),
      { kind: "all", q, total: page.totalElements },
    ];
  }

  const collapse = () => {
    setExpanded(false);
    setOpen(false);
  };

  const go = (path) => {
    setText("");
    collapse();
    inputRef.current?.blur();
    navigate(path);
  };

  const handleChange = (_, option) => {
    if (typeof option === "string") {
      // Enter on the text itself
      const query = searchQuery(option);
      if (query) go(searchPagePath({ q: query, scope }));
    } else if (option?.kind === "hit") {
      go(searchResultPath(option.result, workspaces));
    } else if (option?.kind === "all") {
      go(searchPagePath({ q: option.q, scope }));
    } else if (option?.kind === "widen") {
      keepOpen.current = true;
      setScope(EVERYWHERE);
    }
  };

  const renderOption = ({ key, ...props }, option) => (
    <Box component="li" key={key} {...props} sx={{ gap: 1.5, minWidth: 0 }}>
      {option.kind === "hit" && <SearchResultRow result={option.result} q={option.q} />}
      {option.kind === "info" && (
        <Typography variant="body2" color="text.secondary">
          {option.text}
        </Typography>
      )}
      {option.kind === "all" && (
        <Typography sx={linkSx}>
          <SearchOutlined fontSize="small" />
          See all {option.total} {option.total === 1 ? "result" : "results"}
        </Typography>
      )}
      {option.kind === "widen" && (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary">
            No results in {option.scopeLabel}.
          </Typography>
          <Typography sx={linkSx}>
            <TravelExploreOutlined fontSize="small" />
            Search all workspaces
          </Typography>
        </Box>
      )}
    </Box>
  );

  const field = (
    <Autocomplete
      freeSolo
      disableClearable
      value={null}
      inputValue={text}
      onInputChange={(_, value, reason) => reason === "input" && setText(value)}
      onChange={handleChange}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => {
        if (keepOpen.current) keepOpen.current = false;
        else setOpen(false);
      }}
      options={options}
      filterOptions={(list) => list} // the server already searched
      getOptionLabel={(option) => (typeof option === "string" ? option : (option.result?.title ?? text))}
      getOptionDisabled={(option) => option.kind === "info"}
      groupBy={(option) => (option.kind === "hit" ? option.result.type : MORE_GROUP)}
      renderGroup={({ key, group, children }) => (
        <li key={key}>
          {group !== MORE_GROUP && (
            // a div: ListSubheader is an <li> by default, and this already sits in one
            <ListSubheader
              component="div"
              sx={{ lineHeight: "32px", fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}
            >
              {SEARCH_TYPE_LABEL[group].many}
            </ListSubheader>
          )}
          <Box component="ul" sx={{ p: 0 }}>
            {children}
          </Box>
        </li>
      )}
      renderOption={renderOption}
      loading={loading}
      loadingText="Searching…"
      slots={{ paper: SearchPaper }}
      slotProps={{
        paper: {
          header: scopes.length > 1 && <ScopeChips scope={scope} scopes={scopes} onChange={setScope} />,
          sx: { mt: 0.75 },
        },
        popper: { sx: { minWidth: { sm: 420 } }, placement: "bottom-start" },
      }}
      sx={{ flex: { xs: 1, sm: "0 1 360px", md: "0 1 480px" }, minWidth: 0 }}
      renderInput={(params) => (
        <TextField
          {...params}
          inputRef={inputRef}
          autoFocus={phone}
          placeholder={phone ? "Search..." : "Search workspaces, projects, teams, tasks..."}
          size="small"
          onKeyDown={(e) => {
            // phones: Esc with the dropdown already closed closes the field too
            if (e.key === "Escape" && phone && !open) collapse();
          }}
          sx={(t) => ({
            "& .MuiOutlinedInput-root": {
              color: "common.white",
              bgcolor: onBar(t, 0.12),
              transition: "background-color 0.15s",
              "&:hover, &.Mui-focused": { bgcolor: onBar(t, 0.18) },
              "& fieldset": { border: "none" },
            },
            "& .MuiInputBase-input::placeholder": { color: onBar(t, 0.7), opacity: 1 },
          })}
          slotProps={{
            ...params.slotProps,
            htmlInput: { ...params.slotProps.htmlInput, "aria-label": "Search" },
            input: {
              ...params.slotProps.input,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined sx={(t) => ({ color: onBar(t, 0.8) })} />
                </InputAdornment>
              ),
              // a clear button or the shortcut hint (Autocomplete's own indicators are off)
              endAdornment: (
                <InputAdornment position="end">
                  {text ? (
                    <IconButton
                      size="small"
                      edge="end"
                      aria-label="Clear search"
                      onClick={() => {
                        setText("");
                        inputRef.current?.focus();
                      }}
                      sx={(t) => ({ color: onBar(t, 0.8) })}
                    >
                      <CloseRounded fontSize="small" />
                    </IconButton>
                  ) : (
                    <Box
                      component="kbd"
                      aria-hidden="true"
                      sx={(t) => ({
                        display: { xs: "none", md: "block" },
                        px: 0.75,
                        borderRadius: 1,
                        border: `1px solid ${onBar(t, 0.3)}`,
                        color: onBar(t, 0.7),
                        fontFamily: "inherit",
                        fontSize: 12,
                        lineHeight: "20px",
                        whiteSpace: "nowrap",
                      })}
                    >
                      {IS_MAC ? "⌘K" : "Ctrl K"}
                    </Box>
                  )}
                </InputAdornment>
              ),
            },
          }}
        />
      )}
    />
  );

  if (!phone) return field;

  if (!expanded) {
    return (
      <IconButton color="inherit" aria-label="Search" onClick={() => setExpanded(true)}>
        <SearchOutlined />
      </IconButton>
    );
  }

  // over the whole top bar (the Toolbar is position: relative), with a back button to close it
  return (
    <Box sx={{ position: "absolute", inset: 0, zIndex: 1, display: "flex", alignItems: "center", gap: 1, px: 1, bgcolor: "topBar.background" }}>
      <IconButton color="inherit" aria-label="Close search" onClick={collapse}>
        <ArrowBack />
      </IconButton>
      {field}
    </Box>
  );
};

export default GlobalSearch;
