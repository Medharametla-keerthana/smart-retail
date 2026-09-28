import { NavLink } from "react-router-dom";

function Sidebar({ sidebarOpen, closeSidebar }) {

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


        {/* DASHBOARD */}

        <NavLink
          to="/dashboard"
          className="sidebar-link"
          onClick={closeSidebar}
        >

          <i className="bi bi-grid me-3"></i>

          Dashboard

        </NavLink>


        {/* FLEET MANAGEMENT */}

        <p className="sidebar-title">
          FLEET MANAGEMENT
        </p>


        <NavLink
          to="/vehicles"
          className="sidebar-link"
          onClick={closeSidebar}
        >

          <i className="bi bi-truck me-3"></i>

          Vehicles

        </NavLink>


        <NavLink
          to="/drivers"
          className="sidebar-link"
          onClick={closeSidebar}
        >

          <i className="bi bi-person-badge me-3"></i>

          Drivers

        </NavLink>


        <NavLink
          to="/deliveries"
          className="sidebar-link"
          onClick={closeSidebar}
        >

          <i className="bi bi-box-seam me-3"></i>

          Deliveries

        </NavLink>

        <NavLink
          to="/incidents"
          className="sidebar-link"
          onClick={closeSidebar}
        >

          <i className="bi bi-exclamation-triangle me-3"></i>

          Incidents

        </NavLink>


        {/* MONITORING */}

        <p className="sidebar-title">
          MONITORING
        </p>


        <NavLink
          to="/tracking"
          className="sidebar-link"
          onClick={closeSidebar}
        >

          <i className="bi bi-geo-alt me-3"></i>

          Live Tracking

        </NavLink>


        <NavLink
          to="/maintenance"
          className="sidebar-link"
          onClick={closeSidebar}
        >

          <i className="bi bi-tools me-3"></i>

          Maintenance

        </NavLink>


        <NavLink
          to="/notifications"
          className="sidebar-link"
          onClick={closeSidebar}
        >

          <i className="bi bi-bell me-3"></i>

          Notifications

        </NavLink>


        {/* INSIGHTS */}

        <p className="sidebar-title">
          INSIGHTS
        </p>


        <NavLink
          to="/analytics"
          className="sidebar-link"
          onClick={closeSidebar}
        >

          <i className="bi bi-bar-chart-line me-3"></i>

          Analytics

        </NavLink>


        <NavLink
          to="/reports"
          className="sidebar-link"
          onClick={closeSidebar}
        >

          <i className="bi bi-file-earmark-bar-graph me-3"></i>

          Reports

        </NavLink>

      </div>

    </aside>
  );
}

export default Sidebar;