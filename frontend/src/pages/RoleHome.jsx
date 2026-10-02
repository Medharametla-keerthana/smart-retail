import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

function readUser() {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
}

function RoleHome() {
  const user = readUser();
  const isDriver = user.role === "driver";
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    fetch("/api/dashboard/summary", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then((response) => response.json()).then((data) => { if (data.success) setSummary(data.summary); }).catch(() => {});
  }, []);
  const actions = isDriver
    ? [
        { to: "/deliveries", icon: "bi-box-seam", title: "My deliveries", text: "View assigned routes and update delivery progress." },
        { to: "/tracking", icon: "bi-geo-alt", title: "Update location", text: "Share your vehicle’s latest location with customers." },
        { to: "/incidents", icon: "bi-exclamation-triangle", title: "Report an incident", text: "Send an issue to your fleet manager and affected customer." },
      ]
    : [
        { to: "/deliveries", icon: "bi-box-seam", title: "Track deliveries", text: "See the status and route of deliveries linked to your account." },
        { to: "/notifications", icon: "bi-bell", title: "Updates", text: "Read delivery progress and incident notifications." },
        { to: "/profile", icon: "bi-person", title: "Your account", text: "Keep your contact details up to date." },
      ];

  return (
    <section className="container-fluid py-3 py-lg-4">
      <div className="rounded-4 p-4 p-lg-5 mb-4 text-white" style={{ background: "linear-gradient(120deg,#173f35,#34745c)" }}>
        <span className="badge rounded-pill bg-white text-success mb-3">{isDriver ? "DRIVER WORKSPACE" : "CUSTOMER PORTAL"}</span>
        <h1 className="fw-bold">Welcome, {user.name || (isDriver ? "Driver" : "Customer")}</h1>
        <p className="mb-0 opacity-75">{isDriver ? "Your route, vehicle updates, and incident reporting in one place." : "Follow your deliveries and receive timely progress and incident updates."}</p>
      </div>
      <div className="row g-3">
        {isDriver && summary?.driver && <div className="col-12"><div className="row g-3">{[["Completed deliveries", summary.driver.completedTrips], ["Active delivery", summary.driver.activeTrips], ["Upcoming", summary.driver.upcomingTrips], ["Availability", summary.driver.availability]].map(([label, value]) => <div className="col-6 col-xl-3" key={label}><div className="card border-0 shadow-sm rounded-4 h-100"><div className="card-body p-4"><div className="small text-secondary">{label}</div><div className="fs-4 fw-bold mt-2">{value}</div></div></div></div>)}</div><div className="card border-0 shadow-sm rounded-4 mt-3"><div className="card-body p-4"><h2 className="h6 fw-bold">Assigned vehicle</h2><p className="mb-0 text-secondary">{summary.driver.vehicle?.vehicleNumber || "No vehicle currently assigned"}{summary.driver.vehicle?.vehicleType ? ` · ${summary.driver.vehicle.vehicleType}` : ""}</p><p className="small text-secondary mb-0 mt-2">Latest location: {summary.driver.currentLocation || "Not available"}</p></div></div></div>}
        {!isDriver && summary?.customer && <div className="col-12"><div className="row g-3">{[["Deliveries ordered", summary.customer.totalTrips], ["On the way", summary.customer.activeTrips], ["Completed", summary.customer.completedTrips], ["Awaiting fleet confirmation", summary.customer.requestedTrips]].map(([label, value]) => <div className="col-6 col-xl-3" key={label}><div className="card border-0 shadow-sm rounded-4 h-100"><div className="card-body p-4"><div className="small text-secondary">{label}</div><div className="fs-4 fw-bold mt-2">{value}</div></div></div></div>)}</div>{summary.customer.recentTrips?.length > 0 && <div className="card border-0 shadow-sm rounded-4 mt-3"><div className="card-body p-4"><h2 className="h6 fw-bold">Recent orders</h2>{summary.customer.recentTrips.map((trip) => <div key={trip._id} className="d-flex justify-content-between border-top py-2"><span>{trip.source} → {trip.destination}</span><span className="text-secondary">{trip.status}</span></div>)}</div></div>}</div>}
        {actions.map((action) => (
          <div className="col-12 col-md-6 col-xl-4" key={action.to}>
            <Link to={action.to} className="card h-100 border-0 shadow-sm text-decoration-none text-body rounded-4">
              <div className="card-body p-4">
                <span className="d-inline-flex align-items-center justify-content-center rounded-3 bg-success-subtle text-success mb-3" style={{ width: 48, height: 48 }}><i className={`bi ${action.icon} fs-4`}></i></span>
                <h2 className="h5 fw-bold">{action.title}</h2>
                <p className="text-secondary mb-0">{action.text}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

export default RoleHome;
