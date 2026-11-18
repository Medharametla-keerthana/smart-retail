import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { readApiResponse } from "../utils/apiResponse";

function Navbar({ toggleSidebar }) {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const seenNotificationIds = useRef(null);
  let user = {};
  try { user = JSON.parse(localStorage.getItem("user") || "{}"); } catch { user = {}; }
  const roleLabel = { fleetManager: "Fleet Manager", admin: "Fleet Manager", driver: "Driver", customer: "Customer" }[user.role] || "Fleet Manager";

  useEffect(() => {
    if (!localStorage.getItem("token")) return undefined;

    const loadNotifications = async () => {
      try {
        const response = await fetch("/api/notifications?filter=Unread", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = await readApiResponse(response, "Notifications API");
        const notifications = data.notifications || [];
        const currentIds = new Set(notifications.map((item) => item._id));

        if (seenNotificationIds.current) {
          notifications
            .filter((item) => !seenNotificationIds.current.has(item._id))
            .forEach((item) => toast.info(`${item.title}: ${item.message}`));
        }

        seenNotificationIds.current = currentIds;
        setUnreadCount(data.counts?.unread ?? notifications.length);
      } catch {
        // Keep the last unread count when notifications cannot be reached.
      }
    };

    loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 15000);
    return () => window.clearInterval(intervalId);
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  }

  return (
    <nav className="navbar navbar-expand fleet-navbar">

      {/* LEFT SIDE */}

      <div className="d-flex align-items-center gap-3">

        {/* MOBILE MENU BUTTON */}

        <button
          className="btn btn-outline-secondary sidebar-toggle"
          aria-label="Open navigation menu"
          onClick={toggleSidebar}
        >
          <i className="bi bi-list fs-5"></i>
        </button>

        <div className="navbar-brand-lockup">
          <span className="navbar-brand-mark"><i className="bi bi-truck-front-fill"></i></span>
          <div>
            <h5 className="mb-0 fw-bold">Smart Fleet</h5>
            <small>Operations workspace</small>
          </div>
        </div>

      </div>


      {/* RIGHT SIDE */}

      <div className="d-flex align-items-center gap-3">

        <Link to="/notifications" className="navbar-profile text-decoration-none position-relative" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}>
          <i className="bi bi-bell fs-5"></i>
          {unreadCount > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill text-bg-danger">{unreadCount > 99 ? "99+" : unreadCount}</span>}
        </Link>

        <Link
          to="/profile"
          className="navbar-profile text-decoration-none fw-semibold"
        >
          <i className="bi bi-person-circle"></i>
          {user.name ? `${user.name} · ${roleLabel}` : roleLabel}
        </Link>


        <button
          className="btn btn-sm navbar-logout"
          onClick={handleLogout}
        >
          <i className="bi bi-box-arrow-right me-1"></i>
          Logout
        </button>

      </div>

    </nav>
  );
}

export default Navbar;
