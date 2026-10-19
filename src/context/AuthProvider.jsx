import { useEffect, useState } from "react";
import api from "../api/client";
import { AuthContext } from "./AuthContext";

// TEMP: while the backend isn't ready, set VITE_SKIP_AUTH=true in .env.local
const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === "true";
const FAKE_USER = { id: 1, name: "Dev User", email: "dev@sprintory.local" };

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(SKIP_AUTH ? FAKE_USER : null);
  const [loading, setLoading] = useState(!SKIP_AUTH);

  useEffect(() => {
    if (SKIP_AUTH) return;

    api
      .get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    if (!SKIP_AUTH) {
      await api.post("/auth/logout"); // the backend should clear the cookies
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
