import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthProvider from "./context/AuthProvider";
import WorkspaceProvider from "./context/WorkspaceProvider";
import ProtectedRoute from "./components/general/ProtectedRoute";
import AppShell from "./components/layouts/AppShell";
import RegisterPage from "./pages/auth/RegisterPage";
import ActivateAccountPage from "./pages/auth/ActivateAccountPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import LoginPage from "./pages/auth/LoginPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import WorkspacesPage from "./pages/workspace/WorkspacesPage";
import WorkspacePage from "./pages/workspace/WorkspacePage";
import TeamsPage from "./pages/teams/TeamsPage";
import ProjectsPage from "./pages/projects/ProjectsPage";
import ProjectPage from "./pages/projects/ProjectPage";
import ProjectsRedirect from "./pages/projects/ProjectsRedirect";
import TaskPage from "./pages/tasks/TaskPage";

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/activate-account" element={<ActivateAccountPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          {/* also the target of the emailed reset link (?token=...) */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* protected: everything inside needs a logged-in user */}
          <Route element={<ProtectedRoute />}>
            <Route
              element={
                <WorkspaceProvider>
                  <AppShell />
                </WorkspaceProvider>
              }
            >
              <Route path="/" element={<div>Home</div>} />
              <Route path="/projects" element={<ProjectsRedirect />} />
              <Route path="/workspaces" element={<WorkspacesPage />} />
              <Route path="/workspaces/:workspaceId" element={<WorkspacePage />} />
              <Route path="/workspaces/:workspaceId/teams" element={<TeamsPage />} />
              <Route path="/workspaces/:workspaceId/projects" element={<ProjectsPage />} />
              <Route path="/workspaces/:workspaceId/projects/:projectId" element={<ProjectPage />} />
              {/* placeholder until the task page is built */}
              <Route path="/workspaces/:workspaceId/projects/:projectId/tasks/:taskId" element={<TaskPage />} />
              {/* placeholders until these pages exist, so the sidebar links stay inside the shell */}
              <Route path="/backlog" element={<div>Backlog</div>} />
              <Route path="/board" element={<div>Board</div>} />
              <Route path="/sprints" element={<div>Sprints</div>} />
              <Route path="/reports" element={<div>Reports</div>} />
              <Route path="/settings" element={<div>Settings</div>} />
            </Route>
          </Route>

          <Route path="*" element={<div>Page not found</div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
