import { useEffect, useState } from "react";
import { useLocation, useMatch, useNavigate } from "react-router-dom";
import { alpha, Box, ButtonBase, Divider, Menu, MenuItem, Typography } from "@mui/material";
import { CheckRounded, UnfoldMoreRounded } from "@mui/icons-material";
import { WORKSPACES_CHANGED, getWorkspaces } from "../../api/workspaces";

const STORAGE_KEY = "lastWorkspaceId";

const readLast = () => {
    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
};

const saveLast = (id) => {
    try {
        localStorage.setItem(STORAGE_KEY, String(id));
    } catch {
        // storage can be unavailable; the switcher still works without it
    }
};

function WorkspaceSwitcher() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const match = useMatch("/workspaces/:workspaceId");
    const [workspaces, setWorkspaces] = useState([]);
    const [anchor, setAnchor] = useState(null);

    const urlId = match?.params.workspaceId;
    if (urlId) saveLast(urlId);
    const currentId = urlId ?? readLast();

    // reload on navigation so a renamed or newly created workspace shows up
    useEffect(() => {
        const load = () =>
            getWorkspaces()
                .then((list) =>
                    setWorkspaces(
                        [...list].sort((a, b) =>
                            a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
                        )
                    )
                )
                .catch(() => setWorkspaces([]));

        load();
        window.addEventListener(WORKSPACES_CHANGED, load);
        return () => window.removeEventListener(WORKSPACES_CHANGED, load);
    }, [pathname]);

    const current = workspaces.find((w) => String(w.id) === String(currentId));
    const label = current ? current.name : "Select workspace";

    const go = (path) => {
        setAnchor(null);
        navigate(path);
    };

    return (
        <>
            <ButtonBase
                onClick={(e) => setAnchor(e.currentTarget)}
                sx={(theme) => ({
                    width: "100%", p: 1, borderRadius: 2, textAlign: "left",
                    justifyContent: "flex-start", gap: 1.5,
                    color: alpha(theme.palette.common.white, 0.85),
                    transition: "background-color 0.15s",
                    "&:hover, &[aria-expanded='true']": {
                        bgcolor: alpha(theme.palette.common.white, 0.08),
                    },
                })}
                aria-expanded={Boolean(anchor)}
            >
                <Box sx={{
                    width: 36, height: 36, borderRadius: 1.5, flexShrink: 0,
                    bgcolor: "primary.main", color: "primary.contrastText",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 14,
                }}>
                    {current ? current.name.slice(0, 2).toUpperCase() : "?"}
                </Box>
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Typography noWrap sx={{ fontWeight: 600, lineHeight: 1.3 }}>{label}</Typography>
                    <Typography variant="caption" noWrap sx={{ display: "block", lineHeight: 1.2, opacity: 0.65 }}>
                        {current
                            ? current.role === "WORKSPACE_ADMIN" ? "Admin" : "Member"
                            : "Choose where to work"}
                    </Typography>
                </Box>
                <UnfoldMoreRounded fontSize="small" />
            </ButtonBase>

            <Menu
                anchorEl={anchor}
                open={Boolean(anchor)}
                onClose={() => setAnchor(null)}
                slotProps={{ paper: { sx: { minWidth: 220, mt: 0.5 } } }}
            >
                {workspaces.map((w) => (
                    <MenuItem key={w.id} onClick={() => go(`/workspaces/${w.id}`)} sx={{ gap: 1.5 }}>
                        <Box sx={{
                            width: 28, height: 28, borderRadius: 1, flexShrink: 0,
                            bgcolor: "primary.main", color: "primary.contrastText",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 700, fontSize: 12,
                        }}>
                            {w.name.slice(0, 2).toUpperCase()}
                        </Box>
                        <Typography noWrap sx={{ flexGrow: 1 }}>{w.name}</Typography>
                        {String(w.id) === String(currentId) && <CheckRounded fontSize="small" color="primary" />}
                    </MenuItem>
                ))}
                {workspaces.length > 0 && <Divider />}
                <MenuItem onClick={() => go("/workspaces")}>All workspaces</MenuItem>
            </Menu>
        </>
    );
}

export default WorkspaceSwitcher;