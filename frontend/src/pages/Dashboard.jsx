import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { readApiResponse } from "../utils/apiResponse";

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async ({ showLoading = false } = {}) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please login again.");

      const response = await fetch("/api/dashboard/summary", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await readApiResponse(response, "Dashboard API");
      setSummary(data.summary);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Unable to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard({ showLoading: true });
    const refreshTimer = window.setInterval(() => loadDashboard(), 30000);
    return () => {
      window.clearInterval(refreshTimer);
    };
  }, [loadDashboard]);

  return (
      <div className="container-fluid">

        {/* =========================
            DASHBOARD HEADER
        ========================== */}

        <div className="mb-4 d-flex justify-content-between align-items-start gap-3">
          <div>
            <h2 className="fw-bold">Dashboard</h2>
            <p className="text-muted mb-0">Smart Real-Time Fleet Logistics Monitor</p>
          </div>
          <button className="btn btn-outline-primary" type="button" onClick={() => loadDashboard()} disabled={refreshing}>
            <i className={`bi ${refreshing ? "bi-arrow-repeat" : "bi-arrow-clockwise"} me-2`} aria-hidden="true" />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* =========================
            LOADING
        ========================== */}

        {loading && (
          <div className="text-center py-5">

            <div
              className="spinner-border text-primary"
              role="status"
            ></div>

            <p className="mt-3 text-muted">
              Loading dashboard...
            </p>

          </div>
        )}

        {/* =========================
            ERROR
        ========================== */}

        {!loading && error && !summary && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        {/* =========================
            DASHBOARD DATA
        ========================== */}

        {!loading && summary && (
          <>

            {/* =========================
                VEHICLE & DRIVER CARDS
            ========================== */}

            <div className="row g-4">

              {/* Total Vehicles */}

              <div className="col-md-6 col-lg-3">

                <Link to="/vehicles" className="card border-0 shadow-sm h-100 dashboard-action-card">

                  <div className="card-body">

                    <div className="d-flex justify-content-between align-items-center">

                      <div>

                        <p className="text-muted mb-1">
                          Total Vehicles
                        </p>

                        <h3 className="fw-bold mb-0">
                          {summary.totalVehicles}
                        </h3>

                      </div>

                      <i className="bi bi-truck fs-2 text-primary"></i>

                    </div>

                  </div>

                </Link>

              </div>


              {/* Available Vehicles */}

              <div className="col-md-6 col-lg-3">

                <Link to="/vehicles" className="card border-0 shadow-sm h-100 dashboard-action-card">

                  <div className="card-body">

                    <div className="d-flex justify-content-between align-items-center">

                      <div>

                        <p className="text-muted mb-1">
                          Available Vehicles
                        </p>

                        <h3 className="fw-bold mb-0">
                          {summary.availableVehicles}
                        </h3>

                      </div>

                      <i className="bi bi-check-circle fs-2 text-success"></i>

                    </div>

                  </div>

                </Link>

              </div>


              {/* Total Drivers */}

              <div className="col-md-6 col-lg-3">

                <Link to="/drivers" className="card border-0 shadow-sm h-100 dashboard-action-card">

                  <div className="card-body">

                    <div className="d-flex justify-content-between align-items-center">

                      <div>

                        <p className="text-muted mb-1">
                          Total Drivers
                        </p>

                        <h3 className="fw-bold mb-0">
                          {summary.totalDrivers}
                        </h3>

                      </div>

                      <i className="bi bi-people fs-2 text-info"></i>

                    </div>

                  </div>

                </Link>

              </div>


              {/* Assigned Drivers */}

              <div className="col-md-6 col-lg-3">

                <Link to="/drivers" className="card border-0 shadow-sm h-100 dashboard-action-card">

                  <div className="card-body">

                    <div className="d-flex justify-content-between align-items-center">

                      <div>

                        <p className="text-muted mb-1">
                          Assigned Drivers
                        </p>

                        <h3 className="fw-bold mb-0">
                          {summary.assignedDrivers}
                        </h3>

                      </div>

                      <i className="bi bi-person-check fs-2 text-warning"></i>

                    </div>

                  </div>

                </Link>

              </div>

            </div>


            {/* =========================
                TRIP STATISTICS
            ========================== */}

            <div className="mt-5">

              <h4 className="fw-bold mb-3">
                Trip Statistics
              </h4>

              <div className="row g-4">

                {/* Total Trips */}

                <div className="col-md-6 col-lg-3">

                  <Link to="/deliveries" className="card border-0 shadow-sm h-100 dashboard-action-card">

                    <div className="card-body">

                      <p className="text-muted mb-1">
                        Total Trips
                      </p>

                      <h3 className="fw-bold mb-0">
                        {summary.totalTrips}
                      </h3>

                    </div>

                  </Link>

                </div>


                {/* Scheduled Trips */}

                <div className="col-md-6 col-lg-3">

                  <Link to="/deliveries" className="card border-0 shadow-sm h-100 dashboard-action-card">

                    <div className="card-body">

                      <p className="text-muted mb-1">
                        Scheduled Trips
                      </p>

                      <h3 className="fw-bold mb-0">
                        {summary.scheduledTrips}
                      </h3>

                    </div>

                  </Link>

                </div>


                {/* In Progress Trips */}

                <div className="col-md-6 col-lg-3">

                  <Link to="/deliveries" className="card border-0 shadow-sm h-100 dashboard-action-card">

                    <div className="card-body">

                      <p className="text-muted mb-1">
                        In Progress
                      </p>

                      <h3 className="fw-bold mb-0">
                        {summary.inProgressTrips}
                      </h3>

                    </div>

                  </Link>

                </div>


                {/* Completed Trips */}

                <div className="col-md-6 col-lg-3">

                  <Link to="/deliveries" className="card border-0 shadow-sm h-100 dashboard-action-card">

                    <div className="card-body">

                      <p className="text-muted mb-1">
                        Completed Trips
                      </p>

                      <h3 className="fw-bold mb-0">
                        {summary.completedTrips}
                      </h3>

                    </div>

                  </Link>

                </div>

              </div>

            </div>


            {/* =========================
                CANCELLED TRIPS
            ========================== */}

            <div className="mt-4">

                <Link to="/deliveries" className="card border-0 shadow-sm dashboard-action-card">

                <div className="card-body">

                  <div className="d-flex justify-content-between align-items-center">

                    <div>

                      <h5 className="fw-bold mb-1">
                        Cancelled Trips
                      </h5>

                      <p className="text-muted mb-0">
                        Total cancelled trips
                      </p>

                    </div>

                    <h3 className="fw-bold text-danger mb-0">
                      {summary.cancelledTrips}
                    </h3>

                  </div>

                </div>

                </Link>

              </div>

          </>
        )}

      </div>
  );
}

export default Dashboard;
