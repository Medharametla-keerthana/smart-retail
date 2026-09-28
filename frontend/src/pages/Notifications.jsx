import { useState } from "react";

function Notifications() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Delivery Delay",
      message:
        "Delivery DL-104 is delayed due to heavy traffic near Chennai.",
      type: "warning",
      category: "Delivery",
      time: "10 minutes ago",
      read: false,
    },
    {
      id: 2,
      title: "Maintenance Due",
      message:
        "Vehicle VH-002 requires scheduled engine inspection.",
      type: "maintenance",
      category: "Maintenance",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      title: "Route Deviation",
      message:
        "Vehicle VH-001 has deviated from its assigned delivery route.",
      type: "danger",
      category: "Tracking",
      time: "2 hours ago",
      read: true,
    },
    {
      id: 4,
      title: "Driver Available",
      message:
        "Driver Amit Sharma is now available for a new assignment.",
      type: "info",
      category: "Driver",
      time: "3 hours ago",
      read: true,
    },
    {
      id: 5,
      title: "Vehicle Breakdown",
      message:
        "Vehicle VH-004 reported a technical issue and requires attention.",
      type: "danger",
      category: "Vehicle",
      time: "5 hours ago",
      read: false,
    },
    {
      id: 6,
      title: "System Update",
      message:
        "Fleet monitoring system data was successfully synchronized.",
      type: "info",
      category: "System",
      time: "Yesterday",
      read: true,
    },
  ]);

  const [filter, setFilter] = useState("All");

  const filteredNotifications = notifications.filter(
    (notification) => {
      if (filter === "All") return true;

      if (filter === "Unread") {
        return notification.read === false;
      }

      return notification.category === filter;
    }
  );

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  function markAsRead(id) {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  }

  function markAllAsRead() {
    setNotifications(
      notifications.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  }

  function deleteNotification(id) {
    setNotifications(
      notifications.filter(
        (notification) => notification.id !== id
      )
    );
  }

  function getIcon(type) {
    if (type === "warning") {
      return "bi-exclamation-triangle-fill text-warning";
    }

    if (type === "danger") {
      return "bi-x-circle-fill text-danger";
    }

    if (type === "maintenance") {
      return "bi-tools text-primary";
    }

    return "bi-info-circle-fill text-info";
  }

  return (
    <>
      {/* PAGE HEADER */}

      <div className="d-flex justify-content-between align-items-center mb-4">

        <div>
          <h1 className="fw-bold mb-1">
            Notifications & Alerts
          </h1>

          <p className="text-muted mb-0">
            Monitor important fleet and operational updates.
          </p>
        </div>

        <button
          className="btn btn-outline-primary"
          onClick={markAllAsRead}
        >
          <i className="bi bi-check2-all me-2"></i>
          Mark All as Read
        </button>

      </div>


      {/* NOTIFICATION STATISTICS */}

      <div className="row g-4 mb-4">

        <div className="col-md-4">

          <div className="card border-0 shadow-sm">

            <div className="card-body">

              <div className="d-flex justify-content-between">

                <div>
                  <p className="text-muted mb-1">
                    Total Notifications
                  </p>

                  <h3 className="fw-bold mb-0">
                    {notifications.length}
                  </h3>
                </div>

                <i className="bi bi-bell fs-2 text-primary"></i>

              </div>

            </div>

          </div>

        </div>


        <div className="col-md-4">

          <div className="card border-0 shadow-sm">

            <div className="card-body">

              <div className="d-flex justify-content-between">

                <div>
                  <p className="text-muted mb-1">
                    Unread Alerts
                  </p>

                  <h3 className="fw-bold text-danger mb-0">
                    {unreadCount}
                  </h3>
                </div>

                <i className="bi bi-bell-fill fs-2 text-danger"></i>

              </div>

            </div>

          </div>

        </div>


        <div className="col-md-4">

          <div className="card border-0 shadow-sm">

            <div className="card-body">

              <div className="d-flex justify-content-between">

                <div>
                  <p className="text-muted mb-1">
                    Read Notifications
                  </p>

                  <h3 className="fw-bold text-success mb-0">
                    {notifications.length - unreadCount}
                  </h3>
                </div>

                <i className="bi bi-check-circle fs-2 text-success"></i>

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* FILTER */}

      <div className="card border-0 shadow-sm mb-4">

        <div className="card-body">

          <div className="row align-items-center">

            <div className="col-md-4">

              <label className="form-label fw-semibold">
                Filter Notifications
              </label>

              <select
                className="form-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >

                <option value="All">
                  All Notifications
                </option>

                <option value="Unread">
                  Unread
                </option>

                <option value="Delivery">
                  Delivery
                </option>

                <option value="Maintenance">
                  Maintenance
                </option>

                <option value="Tracking">
                  Tracking
                </option>

                <option value="Driver">
                  Driver
                </option>

                <option value="Vehicle">
                  Vehicle
                </option>

                <option value="System">
                  System
                </option>

              </select>

            </div>

          </div>

        </div>

      </div>


      {/* NOTIFICATION LIST */}

      <div className="card border-0 shadow-sm">

        <div className="card-body">

          <h5 className="fw-bold mb-4">
            Recent Notifications
          </h5>


          {filteredNotifications.length === 0 ? (

            <div className="text-center py-5">

              <i className="bi bi-bell-slash fs-1 text-muted"></i>

              <h5 className="mt-3">
                No Notifications Found
              </h5>

              <p className="text-muted">
                There are no notifications matching this filter.
              </p>

            </div>

          ) : (

            <div>

              {filteredNotifications.map((notification) => (

                <div
                  key={notification.id}
                  className={`notification-item ${
                    !notification.read
                      ? "notification-unread"
                      : ""
                  }`}
                >

                  <div className="notification-icon">

                    <i
                      className={`bi ${getIcon(
                        notification.type
                      )}`}
                    ></i>

                  </div>


                  <div className="notification-content">

                    <div className="d-flex justify-content-between">

                      <h6 className="fw-bold mb-1">
                        {notification.title}
                      </h6>

                      <small className="text-muted">
                        {notification.time}
                      </small>

                    </div>


                    <p className="text-muted mb-2">
                      {notification.message}
                    </p>


                    <span className="badge bg-light text-dark">

                      {notification.category}

                    </span>

                  </div>


                  <div className="notification-actions">

                    {!notification.read && (

                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() =>
                          markAsRead(notification.id)
                        }
                        title="Mark as Read"
                      >

                        <i className="bi bi-check-lg"></i>

                      </button>

                    )}


                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() =>
                        deleteNotification(notification.id)
                      }
                      title="Delete Notification"
                    >

                      <i className="bi bi-trash"></i>

                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

    </>
  );
}

export default Notifications;