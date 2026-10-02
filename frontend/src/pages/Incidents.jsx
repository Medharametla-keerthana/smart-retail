import { useCallback, useEffect, useState } from "react";
import { readApiResponse } from "../utils/apiResponse";

const tokenHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

function Incidents() {
  let user = {};
  try { user = JSON.parse(localStorage.getItem("user") || "{}"); } catch { user = {}; }
  const isDriver = user.role === "driver";
  const isManager = !user.role || ["fleetManager", "admin"].includes(user.role);
  const [incidents, setIncidents] = useState([]);
  const [trips, setTrips] = useState([]);
  const [form, setForm] = useState({ tripId: "", title: "", severity: "Medium", description: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [incidentGps, setIncidentGps] = useState(null);
  const [alternateRouteUrl, setAlternateRouteUrl] = useState("");
  const [gpsMessage, setGpsMessage] = useState("");

  const captureIncidentGps = () => {
    if (!navigator.geolocation) { setGpsMessage("This browser does not support device GPS."); return; }
    setGpsMessage("Waiting for device location permission...");
    navigator.geolocation.getCurrentPosition((position) => {
      setIncidentGps({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      setGpsMessage(`Incident location captured (${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}).`);
    }, (geoError) => {
      setGpsMessage(geoError.code === 1 ? "Location permission was denied. Allow location access in browser settings." : "Could not read device GPS. You can still report the incident without coordinates.");
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/incidents", { headers: tokenHeader() });
      const data = await readApiResponse(response, "Incidents API");
      setIncidents(data.incidents || []);
      if (isDriver) {
        const tripResponse = await fetch("/api/trips", { headers: tokenHeader() });
        const tripData = await readApiResponse(tripResponse, "Trips API");
        setTrips((tripData.trips || []).filter((trip) => ["Scheduled", "In Progress"].includes(trip.status)));
      }
    } catch (loadError) {
      setError(loadError.message || "Could not reach the incidents API. Check the Vercel function and MongoDB connection.");
    } finally {
      setLoading(false);
    }
  }, [isDriver]);

  useEffect(() => { load(); }, [load]);

  const report = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/incidents", {
        method: "POST",
        headers: { ...tokenHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...(incidentGps || {}), locationName: incidentGps ? `GPS ${incidentGps.latitude.toFixed(5)}, ${incidentGps.longitude.toFixed(5)}` : "" }),
      });
      const data = await readApiResponse(response, "Incident report API");
      setForm({ tripId: "", title: "", severity: "Medium", description: "" });
      setNotice("Incident sent to the fleet manager and linked customer.");
      setAlternateRouteUrl(data.alternateRouteUrl || "");
      setIncidentGps(null);
      await load();
    } catch (reportError) {
      setError(reportError.message || "Could not report incident");
    } finally {
      setSaving(false);
    }
  };

  const resolve = async (id) => {
    try {
      const response = await fetch(`/api/incidents/${id}/resolve`, { method: "PUT", headers: tokenHeader() });
      const data = await readApiResponse(response, "Incident resolution API");
      setIncidents((current) => current.map((incident) => incident._id === id ? data.incident : incident));
    } catch (resolveError) { setError(resolveError.message || "Could not resolve incident"); }
  };

  return (
    <section className="container-fluid py-3 py-lg-4">
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div><p className="text-success fw-semibold text-uppercase small mb-1">Safety and support</p><h1 className="fw-bold mb-1">Incidents</h1><p className="text-secondary mb-0">{isDriver ? "Report a problem on your route and keep everyone informed." : isManager ? "Review driver reports and track resolution." : "See safety updates related to your deliveries."}</p></div>
        <button className="btn btn-outline-success" onClick={load} disabled={loading}><i className="bi bi-arrow-clockwise me-2"></i>Refresh</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}
      {alternateRouteUrl && <div className="alert alert-info d-flex flex-wrap align-items-center justify-content-between gap-2"><span>GPS location saved. A route from the incident location to the delivery destination is ready.</span><a className="btn btn-sm btn-primary" href={alternateRouteUrl} target="_blank" rel="noreferrer">Open route in Google Maps</a></div>}

      {isDriver && <form className="card border-0 shadow-sm rounded-4 mb-4" onSubmit={report}><div className="card-body p-4">
        <h2 className="h5 fw-bold mb-3">Report an incident</h2>
        <div className="row g-3">
          <div className="col-12 col-lg-6"><label className="form-label">Delivery</label><select className="form-select" required value={form.tripId} onChange={(event) => setForm({ ...form, tripId: event.target.value })}><option value="">Select an active delivery</option>{trips.map((trip) => <option key={trip._id} value={trip._id}>{trip.source} → {trip.destination}</option>)}</select></div>
          <div className="col-12 col-lg-4"><label className="form-label">Incident title</label><input className="form-control" required maxLength="120" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Vehicle issue, road closure…" /></div>
          <div className="col-12 col-lg-2"><label className="form-label">Severity</label><select className="form-select" value={form.severity} onChange={(event) => setForm({ ...form, severity: event.target.value })}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></div>
          <div className="col-12"><label className="form-label">What happened?</label><textarea className="form-control" rows="3" required maxLength="2000" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe the location and help needed." /></div>
          <div className="col-12 d-flex flex-wrap align-items-center gap-2"><button className="btn btn-outline-success" type="button" onClick={captureIncidentGps}><i className="bi bi-crosshair me-2"></i>Capture incident GPS</button><span className="small text-secondary">{gpsMessage || "Capture GPS to include a route from the incident location."}</span></div>
          <div className="col-12"><button className="btn btn-success px-4" disabled={saving || !trips.length}>{saving ? "Sending…" : "Send incident report"}</button></div>
        </div>
      </div></form>}

      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-4"><div className="card border-0 shadow-sm rounded-4 h-100"><div className="card-body"><div className="text-secondary small">Total reports</div><div className="fs-2 fw-bold">{incidents.length}</div></div></div></div>
        <div className="col-sm-6 col-lg-4"><div className="card border-0 shadow-sm rounded-4 h-100"><div className="card-body"><div className="text-secondary small">Open</div><div className="fs-2 fw-bold text-warning">{incidents.filter((incident) => incident.status === "Open").length}</div></div></div></div>
        <div className="col-sm-6 col-lg-4"><div className="card border-0 shadow-sm rounded-4 h-100"><div className="card-body"><div className="text-secondary small">Resolved</div><div className="fs-2 fw-bold text-success">{incidents.filter((incident) => incident.status === "Resolved").length}</div></div></div></div>
      </div>

      <div className="card border-0 shadow-sm rounded-4"><div className="card-body p-0">
        {loading ? <p className="text-center text-secondary py-5 mb-0">Loading reports…</p> : incidents.length === 0 ? <div className="text-center py-5"><i className="bi bi-shield-check fs-1 text-success"></i><h2 className="h5 mt-3">No incidents reported</h2><p className="text-secondary mb-0">New delivery reports will appear here.</p></div> : (
          <div className="table-responsive"><table className="table align-middle mb-0"><thead><tr><th className="ps-4">Incident</th><th>Delivery</th><th>Alternate route</th><th>Severity</th><th>Status</th>{isManager && <th>Reported by</th>}{isManager && <th className="pe-4">Action</th>}</tr></thead><tbody>{incidents.map((incident) => <tr key={incident._id}>
            <td className="ps-4"><strong>{incident.title}</strong><div className="small text-secondary text-wrap" style={{ maxWidth: 360 }}>{incident.description}</div></td>
            <td>{incident.tripId ? `${incident.tripId.source} → ${incident.tripId.destination}` : "Delivery"}</td>
            <td>{incident.alternateRouteUrl ? <a href={incident.alternateRouteUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">Open route</a> : <span className="text-secondary">No GPS route</span>}</td>
            <td><span className={`badge ${["High", "Critical"].includes(incident.severity) ? "text-bg-danger" : incident.severity === "Medium" ? "text-bg-warning" : "text-bg-secondary"}`}>{incident.severity}</span></td>
            <td><span className={`badge ${incident.status === "Open" ? "text-bg-warning" : "text-bg-success"}`}>{incident.status}</span></td>
            {isManager && <td>{incident.reporterName}</td>}{isManager && <td className="pe-4">{incident.status === "Open" && <button className="btn btn-sm btn-outline-success" onClick={() => resolve(incident._id)}>Resolve</button>}</td>}
          </tr>)}</tbody></table></div>
        )}
      </div></div>
    </section>
  );
}

export default Incidents;
