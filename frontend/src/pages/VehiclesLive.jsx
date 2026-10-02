import { useEffect, useMemo, useState } from "react";
import { readApiResponse } from "../utils/apiResponse";

const API_URL = "/api";
const emptyVehicle = { vehicleNumber: "", vehicleType: "", model: "", capacity: "", status: "Available", currentLocation: "" };

function VehiclesLive() {
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(emptyVehicle);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadVehicles() {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/vehicles`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      const data = await readApiResponse(response, "Vehicle API");
      setVehicles(data.vehicles || []);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Unable to connect to backend");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const refreshTimer = setTimeout(() => { loadVehicles(); }, 0);
    return () => clearTimeout(refreshTimer);
  }, []);

  const filteredVehicles = useMemo(() => vehicles.filter((vehicle) => {
    const text = search.toLowerCase();
    const matchesSearch = [vehicle.vehicleNumber, vehicle.vehicleType, vehicle.model].some((value) => value?.toLowerCase().includes(text));
    return matchesSearch && (statusFilter === "All" || vehicle.status === statusFilter);
  }), [vehicles, search, statusFilter]);

  function openAddForm() {
    setEditingVehicle(null);
    setForm(emptyVehicle);
    setError("");
    setShowForm(true);
  }

  function openEditForm(vehicle) {
    setEditingVehicle(vehicle);
    setForm({ vehicleNumber: vehicle.vehicleNumber || "", vehicleType: vehicle.vehicleType || "", model: vehicle.model || "", capacity: vehicle.capacity || "", status: vehicle.status || "Available", currentLocation: vehicle.currentLocation || "" });
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/vehicles${editingVehicle ? `/${editingVehicle._id}` : ""}`, {
        method: editingVehicle ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ ...form, capacity: Number(form.capacity) }),
      });
      const data = await readApiResponse(response, "Vehicle API");
      setMessage(editingVehicle ? "Vehicle updated in MongoDB" : "Vehicle added to MongoDB");
      setShowForm(false);
      await loadVehicles();
    } catch (saveError) {
      setError(saveError.message || "Unable to connect to backend");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(vehicleId) {
    if (!window.confirm("Delete this vehicle from the fleet?")) return;
    try {
      const response = await fetch(`${API_URL}/vehicles/${vehicleId}`, { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      const data = await readApiResponse(response, "Vehicle API");
      setMessage("Vehicle deleted from MongoDB");
      await loadVehicles();
    } catch (deleteError) {
      setError(deleteError.message || "Unable to connect to backend");
    }
  }

  const counts = {
    total: vehicles.length,
    available: vehicles.filter((vehicle) => vehicle.status === "Available").length,
    onTrip: vehicles.filter((vehicle) => vehicle.status === "On Trip" || vehicle.status === "Reserved").length,
    maintenance: vehicles.filter((vehicle) => vehicle.status === "Maintenance").length,
  };

  return (
    <>
      <div className="container-fluid fleet-page">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div><p className="text-primary text-uppercase fw-bold small mb-1">Fleet operations</p><h1 className="fw-bold mb-1">Vehicle Management</h1><p className="text-muted mb-0">Live inventory synced with your MongoDB fleet records.</p></div>
          <div className="d-flex gap-2"><button className="btn btn-outline-secondary" onClick={loadVehicles} title="Refresh vehicles"><i className="bi bi-arrow-clockwise me-2"></i>Refresh</button><button className="btn btn-primary" onClick={openAddForm}><i className="bi bi-plus-lg me-2"></i>Add Vehicle</button></div>
        </div>
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="row g-3 mb-4"><StatCard label="Total vehicles" value={counts.total} icon="bi-truck" color="primary" /><StatCard label="Available" value={counts.available} icon="bi-check-circle" color="success" /><StatCard label="Reserved / on trip" value={counts.onTrip} icon="bi-signpost-2" color="info" /><StatCard label="Maintenance" value={counts.maintenance} icon="bi-tools" color="warning" /></div>
        <div className="card border-0 shadow-sm"><div className="card-body p-3 p-lg-4"><div className="row g-2 mb-3"><div className="col-lg-8"><div className="input-group"><span className="input-group-text bg-white"><i className="bi bi-search"></i></span><input className="form-control" placeholder="Search number, type, or model" value={search} onChange={(event) => setSearch(event.target.value)} /></div></div><div className="col-lg-4"><select className="form-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All</option><option>Available</option><option>Reserved</option><option>On Trip</option><option>Maintenance</option></select></div></div>{loading ? <div className="text-center py-5"><div className="spinner-border text-primary"></div><p className="text-muted mt-3 mb-0">Loading MongoDB fleet records...</p></div> : <div className="table-responsive"><table className="table align-middle mb-0"><thead className="table-light"><tr><th>Vehicle</th><th>Model / Type</th><th>Capacity</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filteredVehicles.map((vehicle) => <tr key={vehicle._id}><td><strong>{vehicle.vehicleNumber}</strong><div className="small text-muted">{vehicle.vehicleType}</div></td><td>{vehicle.model}</td><td>{vehicle.capacity} kg</td><td>{vehicle.currentLocation || "Not available"}</td><td><span className={`badge text-bg-${vehicle.status === "Available" ? "success" : vehicle.status === "On Trip" ? "info" : "warning"}`}>{vehicle.status}</span></td><td><div className="d-flex gap-2"><button className="btn btn-sm btn-outline-primary" onClick={() => openEditForm(vehicle)} title="Edit vehicle"><i className="bi bi-pencil"></i></button><button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(vehicle._id)} title="Delete vehicle"><i className="bi bi-trash"></i></button></div></td></tr>)}{!filteredVehicles.length && <tr><td colSpan="6" className="text-center text-muted py-5">No vehicles match your filters.</td></tr>}</tbody></table></div>}</div></div>
      </div>
      {showForm && <div className="modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && setShowForm(false)}><div className="modal-box"><div className="d-flex justify-content-between align-items-center mb-4"><div><h4 className="fw-bold mb-1">{editingVehicle ? "Edit vehicle" : "Add vehicle"}</h4><p className="text-muted mb-0">Saved directly to MongoDB.</p></div><button className="btn-close" onClick={() => setShowForm(false)}></button></div><form onSubmit={handleSubmit}><div className="row g-3"><VehicleInput label="Vehicle number" name="vehicleNumber" value={form.vehicleNumber} onChange={setForm} required /><VehicleInput label="Vehicle type" name="vehicleType" value={form.vehicleType} onChange={setForm} required /><VehicleInput label="Model" name="model" value={form.model} onChange={setForm} required /><VehicleInput label="Capacity (kg)" name="capacity" type="number" value={form.capacity} onChange={setForm} required /><VehicleInput label="Current location" name="currentLocation" value={form.currentLocation} onChange={setForm} /><div className="col-md-6"><label className="form-label">Status</label><select className="form-select" name="status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option>Available</option><option>On Trip</option><option>Maintenance</option></select></div></div><div className="d-flex justify-content-end gap-2 mt-4"><button type="button" className="btn btn-light" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : editingVehicle ? "Update vehicle" : "Save vehicle"}</button></div></form></div></div>}
    </>
  );
}

function StatCard({ label, value, icon, color }) { return <div className="col-6 col-xl-3"><div className="card border-0 shadow-sm h-100"><div className="card-body d-flex justify-content-between align-items-center"><div><p className="text-muted small mb-1">{label}</p><h3 className={`fw-bold text-${color} mb-0`}>{value}</h3></div><i className={`bi ${icon} fs-2 text-${color}`}></i></div></div></div>; }
function VehicleInput({ label, name, value, onChange, type = "text", required = false }) { return <div className="col-md-6"><label className="form-label">{label}</label><input className="form-control" name={name} type={type} value={value} onChange={(event) => onChange((previous) => ({ ...previous, [name]: event.target.value }))} required={required} min={type === "number" ? "1" : undefined} /></div>; }

export default VehiclesLive;
