
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthProvider from "./context/AuthProvider";
import ProtectedRoute from "./components/general/ProtectedRoute";

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* public */}
          <Route path="/login" element={<div>Login</div>} />
          <Route path="/register" element={<div>Register</div>} />

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
