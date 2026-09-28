import { useEffect, useState } from "react";
import "./Reports.css";

const API_URL = "/api";

function Reports() {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadReports = async () => {
      try {
        const token = localStorage.getItem("token");

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [summaryResponse, analyticsResponse] =
          await Promise.all([
            fetch(`${API_URL}/dashboard/summary`, {
              headers,
            }),
            fetch(`${API_URL}/dashboard/analytics`, {
              headers,
            }),
          ]);

        const summaryData = await summaryResponse.json();
        const analyticsData =
          await analyticsResponse.json();

        if (summaryResponse.ok) {
          setSummary(summaryData.summary);
        }

        if (analyticsResponse.ok) {
          setAnalytics(analyticsData.analytics);
        }

        if (
          !summaryResponse.ok ||
          !analyticsResponse.ok
        ) {
          setMessage("Failed to load report data");
        }
      } catch {
        setMessage("Unable to connect to backend");
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  // ==========================================
  // PRINT REPORT
  // ==========================================

  const printReport = () => {
    window.print();
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="reports-page">
        <div className="reports-loading">
          Loading reports...
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (!summary || !analytics) {
    return (
      <div className="reports-page">
        <div className="reports-error">
          {message || "Report data not available"}
        </div>
      </div>
    );
  }

  return (
    <div className="reports-page">

      {/* HEADER */}

      <div className="reports-header">

        <div>
          <h1>Reports</h1>

          <p>
            Fleet logistics summary and performance report
          </p>
        </div>

        <button
          className="print-report-btn"
          onClick={printReport}
        >
          Print Report
        </button>

      </div>

      {message && (
        <div className="reports-message">
          {message}
        </div>
      )}

      {/* REPORT SUMMARY */}

      <div className="report-section">

        <h2>Fleet Summary</h2>

        <div className="report-grid">

          <div className="report-stat-card">
            <p>Total Vehicles</p>
            <h3>{summary.totalVehicles}</h3>
          </div>

          <div className="report-stat-card">
            <p>Available Vehicles</p>
            <h3 className="report-green">
              {summary.availableVehicles}
            </h3>
          </div>

          <div className="report-stat-card">
            <p>Total Drivers</p>
            <h3>{summary.totalDrivers}</h3>
          </div>

          <div className="report-stat-card">
            <p>Assigned Drivers</p>
            <h3 className="report-blue">
              {summary.assignedDrivers}
            </h3>
          </div>

        </div>

      </div>

      {/* TRIP SUMMARY */}

      <div className="report-section">

        <h2>Trip Summary</h2>

        <div className="report-grid">

          <div className="report-stat-card">
            <p>Total Trips</p>
            <h3>{summary.totalTrips}</h3>
          </div>

          <div className="report-stat-card">
            <p>Scheduled Trips</p>
            <h3>{summary.scheduledTrips}</h3>
          </div>

          <div className="report-stat-card">
            <p>In Progress</p>
            <h3 className="report-blue">
              {summary.inProgressTrips}
            </h3>
          </div>

          <div className="report-stat-card">
            <p>Completed Trips</p>
            <h3 className="report-green">
              {summary.completedTrips}
            </h3>
          </div>

        </div>

      </div>

      {/* CANCELLED TRIPS */}

      <div className="report-section">

        <h2>Trip Status</h2>

        <div className="report-grid">

          <div className="report-stat-card">
            <p>Cancelled Trips</p>

            <h3 className="report-red">
              {summary.cancelledTrips}
            </h3>
          </div>

          <div className="report-stat-card">
            <p>Total Distance</p>

            <h3 className="report-blue">
              {analytics.totalDistance || 0}
            </h3>

            <span className="report-unit">
              kilometers
            </span>
          </div>

        </div>

      </div>

      {/* VEHICLE STATUS */}

      <div className="report-section">

        <h2>Vehicle Status</h2>

        <div className="report-status-list">

          <div className="report-status-row">

            <span>Available</span>

            <strong className="report-green">
              {analytics.vehicles.available}
            </strong>

          </div>

          <div className="report-status-row">

            <span>Assigned</span>

            <strong className="report-blue">
              {analytics.vehicles.assigned}
            </strong>

          </div>

          <div className="report-status-row">

            <span>Maintenance</span>

            <strong className="report-orange">
              {analytics.vehicles.maintenance}
            </strong>

          </div>

        </div>

      </div>

      {/* DRIVER STATUS */}

      <div className="report-section">

        <h2>Driver Status</h2>

        <div className="report-status-list">

          <div className="report-status-row">

            <span>Available Drivers</span>

            <strong className="report-green">
              {analytics.drivers.available}
            </strong>

          </div>

          <div className="report-status-row">

            <span>Assigned Drivers</span>

            <strong className="report-blue">
              {analytics.drivers.assigned}
            </strong>

          </div>

        </div>

      </div>

      {/* TRIP STATUS */}

      <div className="report-section">

        <h2>Trip Status Details</h2>

        <div className="report-status-list">

          <div className="report-status-row">
            <span>Scheduled</span>
            <strong>
              {analytics.trips.scheduled}
            </strong>
          </div>

          <div className="report-status-row">
            <span>In Progress</span>
            <strong className="report-blue">
              {analytics.trips.inProgress}
            </strong>
          </div>

          <div className="report-status-row">
            <span>Completed</span>
            <strong className="report-green">
              {analytics.trips.completed}
            </strong>
          </div>

          <div className="report-status-row">
            <span>Cancelled</span>
            <strong className="report-red">
              {analytics.trips.cancelled}
            </strong>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Reports;