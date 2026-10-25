
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthProvider from "./context/AuthProvider";
import ProtectedRoute from "./components/general/ProtectedRoute";
import RegisterPage from "./pages/auth/RegisterPage";
import ActivateAccountPage from "./pages/auth/ActivateAccountPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import LoginPage from "./pages/auth/LoginPage";
import AppShell from "./components/layouts/AppShell";
import ProjectsPage from "./pages/projects/ProjectsPage";
import ProjectPage from "./pages/projects/ProjectPage";

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

          {/* protected: everything inside needs a logged-in user */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<div>Home</div>} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:projectId" element={<ProjectPage />} />
              {/* placeholders until these pages exist, so the sidebar links stay inside the shell */}
              <Route path="/backlog" element={<div>Backlog</div>} />
              <Route path="/board" element={<div>Board</div>} />
              <Route path="/sprints" element={<div>Sprints</div>} />
              <Route path="/reports" element={<div>Reports</div>} />
              <Route path="/team" element={<div>Team</div>} />
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
