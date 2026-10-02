import { NavLink } from "react-router-dom";

function Sidebar({ sidebarOpen, closeSidebar }) {
  let user = {};
  try { user = JSON.parse(localStorage.getItem("user") || "{}"); } catch { user = {}; }
  const role = user.role || "fleetManager";
  const links = role === "fleetManager"
    ? [
        { to: "/dashboard", icon: "bi-grid", label: "Dashboard", group: "WORKSPACE" },
        { to: "/vehicles", icon: "bi-truck", label: "Vehicles", group: "FLEET MANAGEMENT" },
        { to: "/drivers", icon: "bi-person-badge", label: "Drivers", group: "FLEET MANAGEMENT" },
        { to: "/deliveries", icon: "bi-box-seam", label: "Deliveries", group: "FLEET MANAGEMENT" },
        { to: "/incidents", icon: "bi-exclamation-triangle", label: "Incidents", group: "FLEET MANAGEMENT" },
        { to: "/tracking", icon: "bi-geo-alt", label: "Live Tracking", group: "MONITORING" },
        { to: "/maintenance", icon: "bi-tools", label: "Maintenance", group: "MONITORING" },
        { to: "/notifications", icon: "bi-bell", label: "Notifications", group: "MONITORING" },
        { to: "/analytics", icon: "bi-bar-chart-line", label: "Analytics", group: "INSIGHTS" },
        { to: "/reports", icon: "bi-file-earmark-bar-graph", label: "Reports", group: "INSIGHTS" },
      ]
    : role === "driver"
      ? [
          { to: "/dashboard", icon: "bi-grid", label: "My workspace", group: "DRIVER" },
          { to: "/deliveries", icon: "bi-box-seam", label: "My deliveries", group: "DRIVER" },
          { to: "/tracking", icon: "bi-geo-alt", label: "Update location", group: "DRIVER" },
          { to: "/incidents", icon: "bi-exclamation-triangle", label: "Report incident", group: "DRIVER" },
          { to: "/notifications", icon: "bi-bell", label: "Notifications", group: "ACCOUNT" },
        ]
      : [
          { to: "/dashboard", icon: "bi-grid", label: "Overview", group: "CUSTOMER" },
          { to: "/deliveries", icon: "bi-box-seam", label: "My deliveries", group: "CUSTOMER" },
          { to: "/notifications", icon: "bi-bell", label: "Notifications", group: "CUSTOMER" },
        ];

  return (

    <aside
      className={`sidebar ${
        sidebarOpen ? "sidebar-open" : ""
      }`}
    >

      {/* LOGO */}

      <div className="sidebar-header">

        <div>

          <div className="sidebar-brand">
            <span className="sidebar-brand-mark"><i className="bi bi-truck-front-fill"></i></span>
            <div>
              <h4 className="fw-bold mb-0">Smart Fleet</h4>
              <small>Logistics Monitor</small>
            </div>
          </div>

        </div>


        {/* MOBILE CLOSE BUTTON */}

        <button
          className="btn-close-sidebar"
          onClick={closeSidebar}
        >
          <i className="bi bi-x-lg"></i>
        </button>

      </div>


      <div className="sidebar-menu">


        {links.map((link, index) => (
          <div key={link.to}>
            {(index === 0 || link.group !== links[index - 1]?.group) && <p className="sidebar-title">{link.group}</p>}
            <NavLink to={link.to} className="sidebar-link" onClick={closeSidebar}>
              <i className={`bi ${link.icon} me-3`}></i>{link.label}
            </NavLink>
          </div>
        ))}

      </div>

    </aside>
  );
}

export default Sidebar;
