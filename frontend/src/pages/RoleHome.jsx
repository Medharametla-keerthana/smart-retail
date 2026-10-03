import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { readApiResponse } from "../utils/apiResponse";

function readUser() {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
}

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

function RoleHome() {
  const user = readUser();
  const isDriver = user.role === "driver";
  const [summary, setSummary] = useState(null);
  const [trips, setTrips] = useState([]);
  const [reportedIncidents, setReportedIncidents] = useState(0);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/dashboard/summary", { headers: authHeaders() }).then((response) => readApiResponse(response, "Dashboard API")),
      fetch("/api/trips", { headers: authHeaders() }).then((response) => readApiResponse(response, "Delivery API")),
      isDriver ? fetch("/api/incidents", { headers: authHeaders() }).then((response) => readApiResponse(response, "Incidents API")) : Promise.resolve(null),
    ]).then(([summaryData, tripsData, incidentData]) => {
      if (!active) return;
      setSummary(summaryData.summary);
      setTrips(tripsData.trips || []);
      setReportedIncidents(incidentData?.incidents?.length || 0);
    }).catch((error) => { if (active) setLoadError(error.message); });
    return () => { active = false; };
  }, [isDriver]);

  const driver = summary?.driver;
  const customer = summary?.customer;
  const driverTrips = trips.filter((trip) => ["In Progress", "Scheduled"].includes(trip.status));
  const customerTrips = customer?.recentTrips || [];
  const assignedTrips = trips.filter((trip) => ["Scheduled", "In Progress"].includes(trip.status)).length;
  const cards = isDriver
    ? [["Deliveries completed", driver?.completedTrips ?? 0, "bi-check2-circle", "success"], ["Assigned deliveries", assignedTrips, "bi-truck", "primary"], ["Incidents reported", reportedIncidents, "bi-exclamation-triangle", "warning"], ["Availability", driver?.availability || "Loading", "bi-person-check", driver?.availability === "Available" ? "success" : "secondary"]]
    : [["Deliveries ordered", customer?.totalTrips ?? 0, "bi-box-seam", "primary"], ["In progress", customer?.activeTrips ?? 0, "bi-truck", "info"], ["Delivered to you", customer?.completedTrips ?? 0, "bi-check2-circle", "success"], ["Awaiting assignment", customer?.requestedTrips ?? 0, "bi-hourglass-split", "warning"]];

  return (
    <main className="container-fluid py-3 py-lg-4">
      <section className="rounded-4 p-4 p-lg-5 mb-4 text-white" style={{ background: "linear-gradient(120deg,#173f35,#34745c)" }}>
        <div className="d-flex flex-wrap align-items-end justify-content-between gap-3">
          <div><span className="badge rounded-pill bg-white text-success mb-3">{isDriver ? "DRIVER WORKSPACE" : "CUSTOMER PORTAL"}</span><h1 className="fw-bold mb-2">{isDriver ? `Good day, ${user.name || "Driver"}` : `Welcome, ${user.name || "Customer"}`}</h1><p className="mb-0 opacity-75">{isDriver ? "Your delivery workload, availability, vehicle, and route updates." : "Order deliveries, follow their progress, and get updates along the way."}</p></div>
          <Link to={isDriver ? "/deliveries" : "/deliveries"} className="btn btn-light fw-semibold">{isDriver ? "Open my deliveries" : "Request a delivery"}<i className="bi bi-arrow-right ms-2" /></Link>
        </div>
      </section>

      {loadError && <div className="alert alert-warning" role="status">{loadError}</div>}

      <section className="row g-3 mb-4" aria-label={isDriver ? "Driver performance" : "Delivery summary"}>
        {cards.map(([label, value, icon, color]) => <div className="col-6 col-xl-3" key={label}><article className="card border-0 shadow-sm rounded-4 h-100"><div className="card-body p-3 p-lg-4 d-flex justify-content-between align-items-start"><div><div className="small text-secondary">{label}</div><div className={`fs-3 fw-bold mt-2 text-${color}`}>{value}</div></div><span className={`rounded-3 bg-${color}-subtle text-${color} px-3 py-2`}><i className={`bi ${icon} fs-5`} /></span></div></article></div>)}
      </section>

      <div className="row g-4">
        {isDriver ? <>
          <div className="col-12 col-xl-7"><section className="card border-0 shadow-sm rounded-4 h-100"><div className="card-body p-4"><div className="d-flex justify-content-between align-items-center mb-3"><div><h2 className="h5 fw-bold mb-1">My route board</h2><p className="small text-secondary mb-0">Active and scheduled assignments</p></div><Link to="/deliveries" className="small text-decoration-none">View all</Link></div>{driverTrips.length ? driverTrips.slice(0, 5).map((trip) => <div key={trip._id} className="border-top py-3"><div className="d-flex flex-wrap gap-2 justify-content-between align-items-center"><span><strong>{trip.source}</strong><span className="text-secondary mx-2">to</span><strong>{trip.destination}</strong><span className="d-block small text-secondary mt-1">{trip.cargoDetails || "Delivery"}</span></span><span className={`badge ${trip.status === "In Progress" ? "text-bg-primary" : "text-bg-light"}`}>{trip.status}</span></div>{trip.alternateRouteUrl && <a className="small d-inline-block mt-2" href={trip.alternateRouteUrl} target="_blank" rel="noreferrer"><i className="bi bi-sign-turn-right me-1" />Open updated route</a>}</div>) : <div className="rounded-3 bg-light p-4 text-secondary">No active or scheduled deliveries. Your fleet manager will assign your next route here.</div>}</div></section></div>
          <div className="col-12 col-xl-5"><section className="card border-0 shadow-sm rounded-4 h-100"><div className="card-body p-4"><h2 className="h5 fw-bold mb-3">Driver and vehicle</h2><div className="d-flex justify-content-between border-bottom py-3"><span className="text-secondary">Availability</span><strong>{driver?.availability || "Loading"}</strong></div><div className="d-flex justify-content-between border-bottom py-3"><span className="text-secondary">Assigned vehicle</span><strong>{driver?.vehicle?.vehicleNumber || "Not assigned"}</strong></div><div className="d-flex justify-content-between py-3"><span className="text-secondary">Last reported location</span><strong className="text-end">{driver?.currentLocation || "Not available"}</strong></div><div className="d-flex flex-wrap gap-2 mt-3"><Link to="/tracking" className="btn btn-outline-success"><i className="bi bi-geo-alt me-2" />Update location</Link><Link to="/incidents" className="btn btn-outline-danger"><i className="bi bi-exclamation-triangle me-2" />Report incident</Link></div></div></section></div>
        </> : <>
          <div className="col-12 col-xl-8"><section className="card border-0 shadow-sm rounded-4 h-100"><div className="card-body p-4"><div className="d-flex justify-content-between align-items-center mb-3"><div><h2 className="h5 fw-bold mb-1">Your delivery orders</h2><p className="small text-secondary mb-0">Routes and their latest status</p></div><Link to="/deliveries" className="small text-decoration-none">All deliveries</Link></div>{customerTrips.length ? customerTrips.map((trip) => <div key={trip._id} className="d-flex flex-wrap gap-2 justify-content-between align-items-center border-top py-3"><span><strong>{trip.source}</strong><span className="text-secondary mx-2">to</span><strong>{trip.destination}</strong><span className="d-block small text-secondary mt-1">{trip.status === "Requested" ? `Ordered ${new Date(trip.createdAt).toLocaleString()}` : trip.startTime ? `Scheduled ${new Date(trip.startTime).toLocaleString()}` : "Schedule pending"}</span></span><span className={`badge ${trip.status === "Completed" ? "text-bg-success" : trip.status === "In Progress" ? "text-bg-primary" : "text-bg-light"}`}>{trip.status}</span></div>) : <div className="rounded-3 bg-light p-4 text-secondary">You haven’t ordered a delivery yet. Submit a request to get started.</div>}</div></section></div>
          <div className="col-12 col-xl-4"><section className="card border-0 shadow-sm rounded-4 h-100"><div className="card-body p-4"><h2 className="h5 fw-bold mb-2">Stay up to date</h2><p className="text-secondary">Get delivery progress and incident updates from your fleet team.</p><div className="d-grid gap-2"><Link to="/deliveries" className="btn btn-success"><i className="bi bi-plus-lg me-2" />Request delivery</Link><Link to="/notifications" className="btn btn-outline-success"><i className="bi bi-bell me-2" />View notifications{customer?.unreadNotifications ? ` (${customer.unreadNotifications} new)` : ""}</Link><Link to="/profile" className="btn btn-outline-secondary"><i className="bi bi-person me-2" />Manage profile</Link></div></div></section></div>
        </>}
      </div>
    </main>
  );
}

export default RoleHome;
