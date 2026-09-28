import { useEffect, useState } from "react";
import "./Incidents.css";

function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncidents();
  }, []);

  async function fetchIncidents() {
    try {
      const token = localStorage.getItem("token");

      const vehicleResponse = await fetch(
        "/api/vehicles",
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      const tripResponse = await fetch(
        "/api/trips",
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      const vehicleData = await vehicleResponse.json();
      const tripData = await tripResponse.json();

      const list = [];

      if (vehicleData.success) {
        vehicleData.vehicles.forEach((vehicle) => {
          if (vehicle.status === "Maintenance") {
            list.push({
              type: "Vehicle",
              title: "Vehicle Under Maintenance",
              details:
                vehicle.vehicleNumber +
                " is currently under maintenance.",
              status: "Open",
            });
          }
        });
      }

      if (tripData.success) {
        tripData.trips.forEach((trip) => {
          if (trip.status === "Cancelled") {
            list.push({
              type: "Trip",
              title: "Trip Cancelled",
              details:
                trip.source +
                " to " +
                trip.destination +
                " was cancelled.",
              status: "Closed",
            });
          }
        });
      }

      setIncidents(list);
    } catch (error) {
      console.log("Error loading incidents:", error);
    }

    setLoading(false);
  }

  return (
    <div className="incidents-page">

      <div className="incidents-header">
        <div>
          <h1>Incidents</h1>
          <p>Fleet incidents and operational issues</p>
        </div>

        <button
          className="incident-refresh"
          onClick={fetchIncidents}
        >
          Refresh
        </button>
      </div>

      <div className="incident-summary">

        <div className="incident-card">
          <h3>{incidents.length}</h3>
          <p>Total Incidents</p>
        </div>

        <div className="incident-card">
          <h3>
            {
              incidents.filter(
                (item) => item.status === "Open"
              ).length
            }
          </h3>
          <p>Open Incidents</p>
        </div>

        <div className="incident-card">
          <h3>
            {
              incidents.filter(
                (item) => item.status === "Closed"
              ).length
            }
          </h3>
          <p>Closed Incidents</p>
        </div>

      </div>

      <div className="incident-table-container">

        {loading ? (
          <p className="incident-message">
            Loading incidents...
          </p>
        ) : incidents.length === 0 ? (
          <p className="incident-message">
            No incidents found.
          </p>
        ) : (
          <table className="incident-table">

            <thead>
              <tr>
                <th>Type</th>
                <th>Incident</th>
                <th>Details</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {incidents.map((incident, index) => (
                <tr key={index}>
                  <td>{incident.type}</td>

                  <td>{incident.title}</td>

                  <td>{incident.details}</td>

                  <td>
                    <span
                      className={
                        incident.status === "Open"
                          ? "status-open"
                          : "status-closed"
                      }
                    >
                      {incident.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        )}

      </div>

    </div>
  );
}

export default Incidents;