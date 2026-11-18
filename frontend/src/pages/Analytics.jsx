import { useCallback, useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { readApiResponse } from "../utils/apiResponse";
import "./Analytics.css";

const API_URL = "/api";

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  const loadAnalytics = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    try {
      const response = await fetch(`${API_URL}/dashboard/analytics`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await readApiResponse(response, "Analytics API");
      setAnalytics(data.analytics);
      setMessage("");
    } catch (error) {
      setMessage(error.message || "Unable to connect to backend");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics(true);
    const refreshTimer = window.setInterval(() => loadAnalytics(), 30000);
    return () => window.clearInterval(refreshTimer);
  }, [loadAnalytics]);

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
          onClick={() => loadAnalytics()}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {message && (
        <div className="analytics-message">
          {message}
        </div>
      )}

      {/* VEHICLE ANALYTICS */}

      <section className="analytics-chart-grid" aria-label="Fleet charts">
        <article className="analytics-chart-card">
          <h2>Vehicle status</h2>
          <p>Vehicles grouped by current availability</p>
          <div className="analytics-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: "Available", value: analytics.vehicles.available },
                { name: "Assigned", value: analytics.vehicles.assigned },
                { name: "Maintenance", value: analytics.vehicles.maintenance },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name="Vehicles" fill="#198754" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="analytics-chart-card">
          <h2>Driver availability</h2>
          <p>Available and assigned drivers</p>
          <div className="analytics-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[
                  { name: "Available", value: analytics.drivers.available },
                  { name: "Assigned", value: analytics.drivers.assigned },
                ]} dataKey="value" nameKey="name" outerRadius={100} label>
                  <Cell fill="#20c997" />
                  <Cell fill="#0d6efd" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="analytics-chart-card analytics-chart-card-wide">
          <h2>Trip status</h2>
          <p>Scheduled, active, completed, and cancelled trips</p>
          <div className="analytics-chart analytics-chart-short">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: "Scheduled", value: analytics.trips.scheduled },
                { name: "In Progress", value: analytics.trips.inProgress },
                { name: "Completed", value: analytics.trips.completed },
                { name: "Cancelled", value: analytics.trips.cancelled },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Trips" fill="#0d6efd" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

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
