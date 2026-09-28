import { useEffect, useState } from "react";
import "./Analytics.css";

const API_URL = "/api";

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          `${API_URL}/dashboard/analytics`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          setAnalytics(data.analytics);
        } else {
          setMessage(
            data.message || "Failed to load analytics"
          );
        }
      } catch {
        setMessage("Unable to connect to backend");
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-loading">
          Loading analytics...
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="analytics-page">
        <div className="analytics-error">
          {message || "No analytics data available"}
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">

      {/* HEADER */}

      <div className="analytics-header">
        <div>
          <h1>Analytics</h1>
          <p>
            Monitor fleet, driver and trip performance
          </p>
        </div>

        <button
          className="analytics-refresh-btn"
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      </div>

      {message && (
        <div className="analytics-message">
          {message}
        </div>
      )}

      {/* VEHICLE ANALYTICS */}

      <section className="analytics-section">

        <h2>Vehicle Analytics</h2>

        <div className="analytics-card-grid">

          <div className="analytics-card">
            <p>Available Vehicles</p>
            <h3 className="analytics-green">
              {analytics.vehicles.available}
            </h3>
          </div>

          <div className="analytics-card">
            <p>Assigned Vehicles</p>
            <h3 className="analytics-blue">
              {analytics.vehicles.assigned}
            </h3>
          </div>

          <div className="analytics-card">
            <p>Maintenance</p>
            <h3 className="analytics-orange">
              {analytics.vehicles.maintenance}
            </h3>
          </div>

        </div>

      </section>

      {/* DRIVER ANALYTICS */}

      <section className="analytics-section">

        <h2>Driver Analytics</h2>

        <div className="analytics-card-grid">

          <div className="analytics-card">
            <p>Available Drivers</p>
            <h3 className="analytics-green">
              {analytics.drivers.available}
            </h3>
          </div>

          <div className="analytics-card">
            <p>Assigned Drivers</p>
            <h3 className="analytics-blue">
              {analytics.drivers.assigned}
            </h3>
          </div>

        </div>

      </section>

      {/* TRIP ANALYTICS */}

      <section className="analytics-section">

        <h2>Trip Analytics</h2>

        <div className="analytics-card-grid">

          <div className="analytics-card">
            <p>Scheduled</p>
            <h3>
              {analytics.trips.scheduled}
            </h3>
          </div>

          <div className="analytics-card">
            <p>In Progress</p>
            <h3 className="analytics-blue">
              {analytics.trips.inProgress}
            </h3>
          </div>

          <div className="analytics-card">
            <p>Completed</p>
            <h3 className="analytics-green">
              {analytics.trips.completed}
            </h3>
          </div>

          <div className="analytics-card">
            <p>Cancelled</p>
            <h3 className="analytics-red">
              {analytics.trips.cancelled}
            </h3>
          </div>

        </div>

      </section>

      {/* DISTANCE */}

      <section className="analytics-section">

        <h2>Distance Overview</h2>

        <div className="distance-card">

          <div>
            <p>Total Distance</p>

            <h3>
              {analytics.totalDistance || 0}
            </h3>

            <span>
              kilometers
            </span>
          </div>

          <div className="distance-icon">
            KM
          </div>

        </div>

      </section>

    </div>
  );
}

export default Analytics;