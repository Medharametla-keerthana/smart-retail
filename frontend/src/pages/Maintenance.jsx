import { useEffect, useState } from "react";
import "./Maintenance.css";

const API_URL = "/api";

function Maintenance() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(`${API_URL}/vehicles`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          setVehicles(data.vehicles || []);
        } else {
          setMessage(
            data.message || "Failed to load vehicles"
          );
        }
      } catch {
        setMessage("Unable to connect to backend");
      } finally {
        setLoading(false);
      }
    };

    loadVehicles();
  }, []);

  const maintenanceVehicles = vehicles.filter(
    (vehicle) => vehicle.status === "Maintenance"
  );

  const availableVehicles = vehicles.filter(
    (vehicle) => vehicle.status === "Available"
  );

  const assignedVehicles = vehicles.filter(
    (vehicle) => vehicle.status === "Assigned"
  );

  if (loading) {
    return (
      <div className="maintenance-page">
        <div className="maintenance-loading">
          Loading maintenance information...
        </div>
      </div>
    );
  }

  return (
    <div className="maintenance-page">

      {/* HEADER */}

      <div className="maintenance-header">

        <div>
          <h1>Maintenance</h1>

          <p>
            Monitor vehicles currently under maintenance
          </p>
        </div>

        <button
          className="maintenance-refresh-btn"
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>

      </div>

      {/* MESSAGE */}

      {message && (
        <div className="maintenance-message">
          {message}
        </div>
      )}

      {/* SUMMARY */}

      <div className="maintenance-summary">

        <div className="maintenance-stat-card">

          <p>Total Vehicles</p>

          <h2>
            {vehicles.length}
          </h2>

        </div>

        <div className="maintenance-stat-card">

          <p>Under Maintenance</p>

          <h2 className="maintenance-orange">
            {maintenanceVehicles.length}
          </h2>

        </div>

        <div className="maintenance-stat-card">

          <p>Available</p>

          <h2 className="maintenance-green">
            {availableVehicles.length}
          </h2>

        </div>

        <div className="maintenance-stat-card">

          <p>Assigned</p>

          <h2 className="maintenance-blue">
            {assignedVehicles.length}
          </h2>

        </div>

      </div>

      {/* MAINTENANCE VEHICLES */}

      <div className="maintenance-section">

        <h2>
          Vehicles Under Maintenance
        </h2>

        {maintenanceVehicles.length === 0 ? (

          <div className="no-maintenance">

            <div className="no-maintenance-icon">
              ✓
            </div>

            <h3>
              No Vehicles Under Maintenance
            </h3>

            <p>
              There are currently no vehicles marked
              as under maintenance.
            </p>

          </div>

        ) : (

          <div className="maintenance-table-container">

            <table className="maintenance-table">

              <thead>

                <tr>
                  <th>Vehicle Number</th>
                  <th>Vehicle Type</th>
                  <th>Model</th>
                  <th>Capacity</th>
                  <th>Current Location</th>
                  <th>Status</th>
                </tr>

              </thead>

              <tbody>

                {maintenanceVehicles.map((vehicle) => (

                  <tr key={vehicle._id}>

                    <td>
                      <strong>
                        {vehicle.vehicleNumber || "-"}
                      </strong>
                    </td>

                    <td>
                      {vehicle.vehicleType || "-"}
                    </td>

                    <td>
                      {vehicle.model || "-"}
                    </td>

                    <td>
                      {vehicle.capacity || 0}
                    </td>

                    <td>
                      {vehicle.currentLocation || "-"}
                    </td>

                    <td>
                      <span className="maintenance-status">
                        Maintenance
                      </span>
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* ALL VEHICLE STATUS */}

      <div className="maintenance-section">

        <h2>
          Vehicle Status Overview
        </h2>

        <div className="vehicle-status-list">

          <div className="vehicle-status-row">

            <div>
              <span className="status-dot status-green"></span>
              Available
            </div>

            <strong>
              {availableVehicles.length}
            </strong>

          </div>

          <div className="vehicle-status-row">

            <div>
              <span className="status-dot status-blue"></span>
              Assigned
            </div>

            <strong>
              {assignedVehicles.length}
            </strong>

          </div>

          <div className="vehicle-status-row">

            <div>
              <span className="status-dot status-orange"></span>
              Maintenance
            </div>

            <strong>
              {maintenanceVehicles.length}
            </strong>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Maintenance;