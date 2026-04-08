import { Navigate, Route, Routes } from "react-router-dom";
import { useMemo, useState } from "react";
import { clearAuth, getAuth, saveAuth } from "./auth";
import LoginPage from "./pages/LoginPage";
import ViewerPage from "./pages/ViewerPage";
import AdminPage from "./pages/AdminPage";

const ProtectedRoute = ({ user, children }) => {
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ user, children }) => {
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/viewer" replace />;
  return children;
};

function App() {
  const initialAuth = useMemo(() => getAuth(), []);
  const [user, setUser] = useState(initialAuth.user);

  const onAuthSuccess = ({ user: authUser, token }) => {
    saveAuth({ user: authUser, token });
    setUser(authUser);
  };

  const onLogout = () => {
    clearAuth();
    setUser(null);
  };

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onAuthSuccess={onAuthSuccess} user={user} />} />
      <Route
        path="/viewer"
        element={
          <ProtectedRoute user={user}>
            <ViewerPage user={user} onLogout={onLogout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute user={user}>
            <AdminPage user={user} onLogout={onLogout} />
          </AdminRoute>
        }
      />
      <Route path="*" element={<Navigate to={user ? (user.role === "admin" ? "/admin" : "/viewer") : "/login"} replace />} />
    </Routes>
  );
}

export default App;
