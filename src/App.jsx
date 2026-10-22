
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthProvider from "./context/AuthProvider";
import ProtectedRoute from "./components/general/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import SetPasswordPage from "./pages/auth/SetPasswordPage";
import Project from "./pages/Project";


const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<div>Register</div>} />
          <Route path="/set-password" element={<SetPasswordPage />} />
          <Route path="/preview" element={<Project />} />

          {/* protected: everything inside needs a logged-in user */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<div>Home</div>} />
            <Route path="/projects" element={<div>Projects</div>} />
          </Route>

          <Route path="*" element={<div>Page not found</div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
