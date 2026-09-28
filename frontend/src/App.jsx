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

function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!localStorage.getItem("token")) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

function PublicOnlyRoute({ children }) {
  if (localStorage.getItem("token")) {
    return <Navigate to="/dashboard" replace />;
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
        element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
      />

      <Route
        path="/vehicles"
        element={<ProtectedRoute><Vehicles /></ProtectedRoute>}
      />

      <Route
        path="/drivers"
        element={<ProtectedRoute><Drivers /></ProtectedRoute>}
      />

      <Route
        path="/deliveries"
        element={<ProtectedRoute><Deliveries /></ProtectedRoute>}
      />

      <Route
        path="/tracking"
        element={<ProtectedRoute><Tracking /></ProtectedRoute>}
      />

      <Route
        path="/maintenance"
        element={<ProtectedRoute><Maintenance /></ProtectedRoute>}
      />

      <Route
        path="/notifications"
        element={<ProtectedRoute><Notifications /></ProtectedRoute>}
      />

      <Route
        path="/analytics"
        element={<ProtectedRoute><Analytics /></ProtectedRoute>}
      />

      <Route
        path="/reports"
        element={<ProtectedRoute><Reports /></ProtectedRoute>}
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