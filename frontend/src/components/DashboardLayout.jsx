import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function toggleSidebar() {
    setSidebarOpen(!sidebarOpen);
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className="dashboard-layout">

      <Sidebar
        sidebarOpen={sidebarOpen}
        closeSidebar={closeSidebar}
      />

      {/* MOBILE OVERLAY */}

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
        ></div>
      )}

      <div className="dashboard-main">

        <Navbar toggleSidebar={toggleSidebar} />

        <main className="dashboard-content">
          {children}
        </main>

      </div>

    </div>
  );
}

export default DashboardLayout;