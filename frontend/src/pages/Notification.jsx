import { useEffect, useState } from "react";
import "./Notifications.css";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "/api/vehicles",
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        const alerts = [];

        data.vehicles.forEach((vehicle) => {
          if (vehicle.status === "Maintenance") {
            alerts.push({
              title: "Vehicle Maintenance",
              message:
                vehicle.vehicleNumber +
                " is under maintenance.",
            });
          }
        });

        setNotifications(alerts);
      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  }

  return (
    <div className="notifications-page">
      <h1>Notifications</h1>

      <p>Fleet notifications and alerts</p>

      <button
        className="refresh-btn"
        onClick={fetchNotifications}
      >
        Refresh
      </button>

      <div className="notification-list">
        {loading ? (
          <p>Loading...</p>
        ) : notifications.length === 0 ? (
          <p>No notifications available.</p>
        ) : (
          notifications.map((notification, index) => (
            <div
              className="notification-item"
              key={index}
            >
              <h3>{notification.title}</h3>

              <p>{notification.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Notifications;