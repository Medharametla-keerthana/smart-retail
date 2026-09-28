import { useEffect, useState } from "react";

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          if (!cancelled) {
            setError("Please login again.");
            setLoading(false);
          }
          return;
        }

        const response = await fetch(
          "/api/dashboard/summary",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load dashboard"
          );
        }

        if (!cancelled) {
          setSummary(data.summary);
          setLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          setError(error.message);
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
      <div className="container-fluid">

        {/* =========================
            DASHBOARD HEADER
        ========================== */}

        <div className="mb-4">
          <h2 className="fw-bold">
            Dashboard
          </h2>

          <p className="text-muted">
            Smart Real-Time Fleet Logistics Monitor
          </p>
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

        {!loading && error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        {/* =========================
            DASHBOARD DATA
        ========================== */}

        {!loading && !error && summary && (
          <>

            {/* =========================
                VEHICLE & DRIVER CARDS
            ========================== */}

            <div className="row g-4">

              {/* Total Vehicles */}

              <div className="col-md-6 col-lg-3">

                <div className="card border-0 shadow-sm h-100">

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

                </div>

              </div>


              {/* Available Vehicles */}

              <div className="col-md-6 col-lg-3">

                <div className="card border-0 shadow-sm h-100">

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

                </div>

              </div>


              {/* Total Drivers */}

              <div className="col-md-6 col-lg-3">

                <div className="card border-0 shadow-sm h-100">

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

                </div>

              </div>


              {/* Assigned Drivers */}

              <div className="col-md-6 col-lg-3">

                <div className="card border-0 shadow-sm h-100">

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

                </div>

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

                  <div className="card border-0 shadow-sm h-100">

                    <div className="card-body">

                      <p className="text-muted mb-1">
                        Total Trips
                      </p>

                      <h3 className="fw-bold mb-0">
                        {summary.totalTrips}
                      </h3>

                    </div>

                  </div>

                </div>


                {/* Scheduled Trips */}

                <div className="col-md-6 col-lg-3">

                  <div className="card border-0 shadow-sm h-100">

                    <div className="card-body">

                      <p className="text-muted mb-1">
                        Scheduled Trips
                      </p>

                      <h3 className="fw-bold mb-0">
                        {summary.scheduledTrips}
                      </h3>

                    </div>

                  </div>

                </div>


                {/* In Progress Trips */}

                <div className="col-md-6 col-lg-3">

                  <div className="card border-0 shadow-sm h-100">

                    <div className="card-body">

                      <p className="text-muted mb-1">
                        In Progress
                      </p>

                      <h3 className="fw-bold mb-0">
                        {summary.inProgressTrips}
                      </h3>

                    </div>

                  </div>

                </div>


                {/* Completed Trips */}

                <div className="col-md-6 col-lg-3">

                  <div className="card border-0 shadow-sm h-100">

                    <div className="card-body">

                      <p className="text-muted mb-1">
                        Completed Trips
                      </p>

                      <h3 className="fw-bold mb-0">
                        {summary.completedTrips}
                      </h3>

                    </div>

                  </div>

                </div>

              </div>

            </div>


            {/* =========================
                CANCELLED TRIPS
            ========================== */}

            <div className="mt-4">

              <div className="card border-0 shadow-sm">

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

              </div>

            </div>

          </>
        )}

      </div>
  );
}

export default Dashboard;