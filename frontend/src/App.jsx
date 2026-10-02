import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/VehiclesLive";
import Drivers from "./pages/Drivers";
import Deliveries from "./pages/Deliveries";
import Tracking from "./pages/Tracking";
import Maintenance from "./pages/Maintenance";
import Notifications from "./pages/Notifications";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import Incidents from "./pages/Incidents";
import RoleHome from "./pages/RoleHome";

function currentUser() {
  try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
}

function homeForRole(role) {
  return role === "fleetManager" ? "/dashboard" : "/deliveries";
}

function ProtectedRoute({ children, roles }) {
  const location = useLocation();
  const user = currentUser();

  if (!localStorage.getItem("token")) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user?.role || "fleetManager")) {
    return <Navigate to={homeForRole(user?.role)} replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

function PublicOnlyRoute({ children }) {
  if (localStorage.getItem("token")) {
    return <Navigate to={homeForRole(currentUser()?.role || "fleetManager")} replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>

      <Route
        path="/"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/signup"
        element={
          <PublicOnlyRoute>
            <Signup />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/dashboard"
        element={<ProtectedRoute><>{currentUser()?.role === "fleetManager" || !currentUser()?.role ? <Dashboard /> : <RoleHome />}</></ProtectedRoute>}
      />

      <Route
        path="/vehicles"
        element={<ProtectedRoute roles={["fleetManager"]}><Vehicles /></ProtectedRoute>}
      />

      <Route
        path="/drivers"
        element={<ProtectedRoute roles={["fleetManager"]}><Drivers /></ProtectedRoute>}
      />

      <Route
        path="/deliveries"
        element={<ProtectedRoute><Deliveries /></ProtectedRoute>}
      />

      <Route
        path="/tracking"
        element={<ProtectedRoute roles={["fleetManager", "driver"]}><Tracking /></ProtectedRoute>}
      />

      <Route
        path="/maintenance"
        element={<ProtectedRoute roles={["fleetManager"]}><Maintenance /></ProtectedRoute>}
      />

      <Route
        path="/notifications"
        element={<ProtectedRoute><Notifications /></ProtectedRoute>}
      />

      <Route
        path="/analytics"
        element={<ProtectedRoute roles={["fleetManager"]}><Analytics /></ProtectedRoute>}
      />

      <Route
        path="/reports"
        element={<ProtectedRoute roles={["fleetManager"]}><Reports /></ProtectedRoute>}
      />

      <Route
        path="/profile"
        element={<ProtectedRoute><Profile /></ProtectedRoute>}
      />

      <Route
        path="/incidents"
        element={<ProtectedRoute><Incidents /></ProtectedRoute>}
      />

    </Routes>
  );
}

export default App;
