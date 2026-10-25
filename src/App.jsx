
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthProvider from "./context/AuthProvider";
import ProtectedRoute from "./components/general/ProtectedRoute";
import { ProjectAccessGuard, WorkspaceAccessGuard } from "./components/general/ResourceAccessGuard";
import ResetPage from "./pages/auth/ResetPage";
import WorkspacePage from "./pages/workspace/WorkspacePage";
import RegisterPage from "./pages/auth/RegisterPage";
import ActivateAccountPage from "./pages/auth/ActivateAccountPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import LoginPage from "./pages/auth/LoginPage";
import AppShell from "./components/layouts/AppShell";
import TeamsPage from "./pages/TeamsPage";
import WorkspacesPage from "./pages/workspace/WorkspacesPage";

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset" element={<ResetPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/activate-account" element={<ActivateAccountPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* protected: everything inside needs a logged-in user */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<div>Home</div>} />
              <Route path="/projects" element={<div>Projects</div>} />
              <Route element={<WorkspaceAccessGuard fromQuery />}>
                <Route path="/teams" element={<TeamsPage />} />
              </Route>
              {/* placeholders until these pages exist, so the sidebar links stay inside the shell */}
              <Route path="/backlog" element={<div>Backlog</div>} />
              <Route path="/board" element={<div>Board</div>} />
              <Route path="/sprints" element={<div>Sprints</div>} />
              <Route path="/reports" element={<div>Reports</div>} />
              <Route path="/settings" element={<div>Settings</div>} />
              <Route path="/workspaces" element={<WorkspacesPage />} />
              <Route path="/workspaces/:workspaceId" element={<WorkspaceAccessGuard />}>
                <Route index element={<WorkspacePage />} />
                <Route path="teams" element={<TeamsPage />} />
                <Route path="projects/:projectId" element={<ProjectAccessGuard />}>
                  <Route index element={<div>Project page is not available yet.</div>} />
                </Route>
              </Route>
              <Route path="/projects/:projectId" element={<ProjectAccessGuard />}>
                <Route index element={<div>Project page is not available yet.</div>} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<div>Page not found</div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
