import { useCallback, useEffect, useMemo, useState } from "react";
import { readApiResponse } from "../utils/apiResponse";
import "./Maintenance.css";

const API_URL = "/api/vehicles/maintenance";
const WORKFLOW = ["Scheduled", "Vehicle Received", "Inspection", "Repair in Progress", "Quality Check", "Completed"];
const TYPES = ["Regular service", "Oil change", "Brake service", "Tyre replacement", "Engine repair", "Other"];
const blankForm = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { vehicleId: "", type: TYPES[0], scheduledDate: today.toISOString().slice(0, 10), estimatedCompletionDate: tomorrow.toISOString().slice(0, 10), priority: "Medium", mechanic: "", workshop: "", notes: "" };
};
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const dateLabel = (value) => value ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";
const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));

function Maintenance() {
  const [vehicles, setVehicles] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [vehicleResponse, maintenanceResponse] = await Promise.all([
        fetch("/api/vehicles", { headers: authHeaders() }), fetch(API_URL, { headers: authHeaders() }),
      ]);
      const [vehicleData, maintenanceData] = await Promise.all([
        readApiResponse(vehicleResponse, "Vehicle API"), readApiResponse(maintenanceResponse, "Maintenance API"),
      ]);
      setVehicles(vehicleData.vehicles || []);
      setRecords(maintenanceData.records || []);
    } catch (loadError) {
      setError(loadError.message || "Could not load fleet maintenance data");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const vehicleCounts = useMemo(() => {
    const available = vehicles.filter((vehicle) => vehicle.status === "Available").length;
    const busy = vehicles.filter((vehicle) => ["Reserved", "On Trip", "Assigned"].includes(vehicle.status)).length;
    const maintenance = vehicles.filter((vehicle) => vehicle.status === "Maintenance").length;
    return { available, busy, maintenance, other: vehicles.length - available - busy - maintenance };
  }, [vehicles]);

  const visibleRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) => {
      const vehicle = record.vehicleId;
      const matchesSearch = !query || [vehicle?.vehicleNumber, vehicle?.model, record.type, record.mechanic, record.workshop, record.notes]
        .some((value) => String(value || "").toLowerCase().includes(query));
      return matchesSearch && (statusFilter === "All" || record.status === statusFilter)
        && (priorityFilter === "All" || record.priority === priorityFilter) && (typeFilter === "All" || record.type === typeFilter);
    });
  }, [records, search, statusFilter, priorityFilter, typeFilter]);

  const activeRecords = records.filter((record) => !["Completed", "Cancelled"].includes(record.status));
  const upcomingRecords = activeRecords.filter((record) => new Date(record.scheduledDate) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate)).slice(0, 5);
  const monthKey = new Date().toISOString().slice(0, 7);
  const monthCost = records.filter((record) => String(record.completedAt || record.updatedAt || "").slice(0, 7) === monthKey)
    .reduce((sum, record) => sum + Number(record.partsCost || 0) + Number(record.labourCost || 0), 0);
  const totalCost = records.reduce((sum, record) => sum + Number(record.partsCost || 0) + Number(record.labourCost || 0), 0);
  const completedCount = records.filter((record) => record.status === "Completed").length;

  const schedule = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch(API_URL, { method: "POST", headers: { ...authHeaders(), "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await readApiResponse(response, "Maintenance API");
      if (data.record) {
        setRecords((current) => [data.record, ...current.filter((record) => record._id !== data.record._id)]);
        setVehicles((current) => current.map((vehicle) => vehicle._id === form.vehicleId ? { ...vehicle, status: "Maintenance" } : vehicle));
      }
      setNotice("Maintenance has been scheduled and the vehicle is marked under maintenance.");
      setForm(blankForm()); setShowForm(false);
    } catch (saveError) { setError(saveError.message || "Could not schedule maintenance"); }
    finally { setSaving(false); }
  };

  const saveUpdate = async (event) => {
    event.preventDefault(); if (!editing) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch(API_URL, {
        method: "PUT", headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ maintenanceId: editing._id, status: editing.status, priority: editing.priority, mechanic: editing.mechanic, workshop: editing.workshop, notes: editing.notes, partsCost: editing.partsCost, labourCost: editing.labourCost, estimatedCompletionDate: editing.estimatedCompletionDate }),
      });
      const data = await readApiResponse(response, "Maintenance API");
      if (data.record) {
        setRecords((current) => current.map((record) => record._id === data.record._id ? data.record : record));
        const vehicle = data.record.vehicleId;
        if (vehicle?._id) setVehicles((current) => current.map((item) => item._id === vehicle._id ? { ...item, status: vehicle.status } : item));
      }
      setNotice("Maintenance record updated."); setEditing(null);
    } catch (saveError) { setError(saveError.message || "Could not update maintenance"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="maintenance-page"><div className="maintenance-loading">Loading maintenance information…</div></div>;

  return (
    <main className="maintenance-page">
      <header className="maintenance-header">
        <div><span className="maintenance-eyebrow">FLEET CARE</span><h1>Maintenance</h1><p>Schedule service, track repair progress, and review fleet costs.</p></div>
        <div className="d-flex gap-2 flex-wrap"><button className="btn btn-outline-success" onClick={load}><i className="bi bi-arrow-clockwise me-2" />Refresh</button><button className="btn btn-success" onClick={() => { setForm(blankForm()); setShowForm((current) => !current); }}><i className="bi bi-plus-lg me-2" />Schedule maintenance</button></div>
      </header>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {notice && <div className="alert alert-success" role="status">{notice}</div>}

      {showForm && <section className="maintenance-panel mb-4">
        <div className="d-flex justify-content-between align-items-start gap-3 mb-3"><div><h2>Schedule maintenance</h2><p className="text-secondary mb-0">The selected vehicle will be taken out of service.</p></div><button className="btn-close" aria-label="Close" onClick={() => setShowForm(false)} /></div>
        <form onSubmit={schedule} className="row g-3">
          <div className="col-12 col-md-6 col-xl-4"><label className="form-label">Vehicle</label><select className="form-select" required value={form.vehicleId} onChange={(event) => setForm({ ...form, vehicleId: event.target.value })}><option value="">Choose a vehicle</option>{vehicles.filter((vehicle) => !["Reserved", "On Trip", "Assigned"].includes(vehicle.status)).map((vehicle) => <option key={vehicle._id} value={vehicle._id}>{vehicle.vehicleNumber} · {vehicle.model} · {vehicle.status}</option>)}</select></div>
          <div className="col-12 col-md-6 col-xl-4"><label className="form-label">Maintenance type</label><select className="form-select" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{TYPES.map((type) => <option key={type}>{type}</option>)}</select></div>
          <div className="col-12 col-md-6 col-xl-4"><label className="form-label">Priority</label><select className="form-select" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>{["Low", "Medium", "High", "Critical"].map((priority) => <option key={priority}>{priority}</option>)}</select></div>
          <div className="col-12 col-md-6 col-xl-3"><label className="form-label">Scheduled date</label><input className="form-control" type="date" required value={form.scheduledDate} onChange={(event) => setForm({ ...form, scheduledDate: event.target.value })} /></div>
          <div className="col-12 col-md-6 col-xl-3"><label className="form-label">Estimated completion</label><input className="form-control" type="date" min={form.scheduledDate} required value={form.estimatedCompletionDate} onChange={(event) => setForm({ ...form, estimatedCompletionDate: event.target.value })} /></div>
          <div className="col-12 col-md-6 col-xl-3"><label className="form-label">Mechanic</label><input className="form-control" maxLength="120" value={form.mechanic} onChange={(event) => setForm({ ...form, mechanic: event.target.value })} placeholder="Name" /></div>
          <div className="col-12 col-md-6 col-xl-3"><label className="form-label">Workshop</label><input className="form-control" maxLength="160" value={form.workshop} onChange={(event) => setForm({ ...form, workshop: event.target.value })} placeholder="Workshop name" /></div>
          <div className="col-12"><label className="form-label">Notes / reported issue</label><textarea className="form-control" rows="2" maxLength="2000" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Describe the repair or service required" /></div>
          <div className="col-12 d-flex justify-content-end gap-2"><button className="btn btn-light" type="button" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-success" type="submit" disabled={saving || !vehicles.some((vehicle) => vehicle._id === form.vehicleId)}>{saving ? "Scheduling…" : "Save schedule"}</button></div>
        </form>
      </section>}

      <section className="maintenance-summary">
        <article className="maintenance-stat-card"><p>Total vehicles</p><h2>{vehicles.length}</h2><span>Fleet inventory</span></article>
        <article className="maintenance-stat-card"><p>Available</p><h2 className="maintenance-green">{vehicleCounts.available}</h2><span>Ready for assignment</span></article>
        <article className="maintenance-stat-card"><p>Reserved / on trip</p><h2 className="maintenance-blue">{vehicleCounts.busy}</h2><span>Currently committed</span></article>
        <article className="maintenance-stat-card"><p>Under maintenance</p><h2 className="maintenance-orange">{vehicleCounts.maintenance}</h2><span>{activeRecords.length} open service record{activeRecords.length === 1 ? "" : "s"}</span></article>
      </section>
      {vehicleCounts.other > 0 && <p className="small text-secondary mb-4">{vehicleCounts.other} vehicle{vehicleCounts.other === 1 ? " has" : "s have"} an unrecognized status and need review. Status categories account for {vehicles.length - vehicleCounts.other} of {vehicles.length} vehicles.</p>}

      <section className="maintenance-summary maintenance-summary-cost">
        <article className="maintenance-stat-card"><p>Recorded maintenance spend</p><h2>{money(totalCost)}</h2><span>Across {records.length} service record{records.length === 1 ? "" : "s"}</span></article>
        <article className="maintenance-stat-card"><p>This month</p><h2>{money(monthCost)}</h2><span>Cost from records completed this month</span></article>
        <article className="maintenance-stat-card"><p>Vehicles serviced</p><h2>{completedCount}</h2><span>Completed records in history</span></article>
      </section>

      <section className="maintenance-section">
        <div className="maintenance-section-heading"><div><h2>Upcoming maintenance</h2><p>Scheduled work with the nearest due dates.</p></div><span className="maintenance-count">{upcomingRecords.length}</span></div>
        {upcomingRecords.length === 0 ? <div className="maintenance-empty compact"><i className="bi bi-calendar-check" /><strong>No upcoming work</strong><span>New scheduled service will appear here.</span></div> : <div className="maintenance-panel table-responsive"><table className="table align-middle mb-0"><thead><tr><th>Vehicle</th><th>Service</th><th>Due date</th><th>Priority</th><th>Workflow</th></tr></thead><tbody>{upcomingRecords.map((record) => <tr key={record._id}><td><strong>{record.vehicleId?.vehicleNumber || "Vehicle unavailable"}</strong><div className="small text-secondary">{record.vehicleId?.model || ""}</div></td><td>{record.type}</td><td>{dateLabel(record.scheduledDate)}</td><td><span className={`priority-badge priority-${record.priority.toLowerCase()}`}>{record.priority}</span></td><td>{record.status}</td></tr>)}</tbody></table></div>}
      </section>

      <section className="maintenance-section">
        <div className="maintenance-section-heading"><div><h2>Maintenance history</h2><p>Service records, current workflow, and repair costs.</p></div><span className="maintenance-count">{visibleRecords.length} records</span></div>
        <div className="maintenance-filters"><input className="form-control" aria-label="Search maintenance history" placeholder="Search vehicle, service, mechanic or workshop" value={search} onChange={(event) => setSearch(event.target.value)} /><select className="form-select" aria-label="Filter by workflow status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All</option>{[...WORKFLOW, "Cancelled"].map((status) => <option key={status}>{status}</option>)}</select><select className="form-select" aria-label="Filter by priority" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}><option>All</option>{["Low", "Medium", "High", "Critical"].map((priority) => <option key={priority}>{priority}</option>)}</select><select className="form-select" aria-label="Filter by maintenance type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option>All</option>{TYPES.map((type) => <option key={type}>{type}</option>)}</select></div>
        {visibleRecords.length === 0 ? <div className="maintenance-empty"><i className="bi bi-wrench-adjustable-circle" /><strong>No maintenance records found</strong><span>Schedule a service or adjust your search filters.</span></div> : <div className="maintenance-record-list">{visibleRecords.map((record) => {
          const isClosed = ["Completed", "Cancelled"].includes(record.status);
          const step = WORKFLOW.indexOf(record.status);
          return <article className="maintenance-record" key={record._id}>
            <div className="maintenance-record-top"><div><div className="d-flex flex-wrap align-items-center gap-2"><h3>{record.vehicleId?.vehicleNumber || "Vehicle unavailable"}</h3><span className={`priority-badge priority-${record.priority.toLowerCase()}`}>{record.priority}</span></div><p>{record.vehicleId?.model || record.vehicleId?.vehicleType || ""} · {record.type}</p></div><span className={`maintenance-status-pill ${record.status === "Completed" ? "is-done" : record.status === "Cancelled" ? "is-cancelled" : ""}`}>{record.status}</span></div>
            <div className="maintenance-workflow" aria-label={`Workflow: ${record.status}`}>{WORKFLOW.map((stage, index) => <span className={`workflow-step ${step >= index ? "is-active" : ""}`} key={stage}><i />{stage}</span>)}</div>
            <div className="maintenance-record-details"><span><b>Scheduled</b>{dateLabel(record.scheduledDate)}</span><span><b>Expected finish</b>{dateLabel(record.estimatedCompletionDate)}</span><span><b>Mechanic / workshop</b>{[record.mechanic, record.workshop].filter(Boolean).join(" · ") || "Not assigned"}</span><span><b>Cost to date</b>{money(Number(record.partsCost || 0) + Number(record.labourCost || 0))}</span></div>
            {record.notes && <p className="maintenance-notes">{record.notes}</p>}
            {!isClosed && <button className="btn btn-sm btn-outline-success" onClick={() => setEditing({ ...record, partsCost: record.partsCost || "", labourCost: record.labourCost || "", estimatedCompletionDate: String(record.estimatedCompletionDate || "").slice(0, 10) })}>Update workflow / costs</button>}
          </article>;
        })}</div>}
      </section>

      {editing && <div className="maintenance-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(null); }}><section className="maintenance-modal" role="dialog" aria-modal="true" aria-labelledby="maintenance-edit-title"><form onSubmit={saveUpdate}>
        <div className="d-flex justify-content-between align-items-start mb-3"><div><h2 id="maintenance-edit-title">Update maintenance</h2><p className="text-secondary mb-0">{records.find((item) => item._id === editing._id)?.vehicleId?.vehicleNumber} · {editing.type}</p></div><button type="button" className="btn-close" aria-label="Close" onClick={() => setEditing(null)} /></div>
        <div className="row g-3"><div className="col-12"><label className="form-label">Workflow status</label><select className="form-select" value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value })}>{[...WORKFLOW, "Cancelled"].map((status) => <option key={status}>{status}</option>)}</select></div><div className="col-12 col-sm-6"><label className="form-label">Priority</label><select className="form-select" value={editing.priority} onChange={(event) => setEditing({ ...editing, priority: event.target.value })}>{["Low", "Medium", "High", "Critical"].map((priority) => <option key={priority}>{priority}</option>)}</select></div><div className="col-12 col-sm-6"><label className="form-label">Estimated completion</label><input className="form-control" type="date" min={String(editing.scheduledDate).slice(0, 10)} value={editing.estimatedCompletionDate || ""} onChange={(event) => setEditing({ ...editing, estimatedCompletionDate: event.target.value })} required /></div><div className="col-12 col-sm-6"><label className="form-label">Parts cost (₹)</label><input className="form-control" type="number" min="0" step="0.01" value={editing.partsCost ?? ""} placeholder="e.g. 2500" onChange={(event) => setEditing({ ...editing, partsCost: event.target.value })} /></div><div className="col-12 col-sm-6"><label className="form-label">Labour cost (₹)</label><input className="form-control" type="number" min="0" step="0.01" value={editing.labourCost ?? ""} placeholder="e.g. 800" onChange={(event) => setEditing({ ...editing, labourCost: event.target.value })} /></div><div className="col-12"><label className="form-label">Mechanic</label><input className="form-control" maxLength="120" value={editing.mechanic || ""} onChange={(event) => setEditing({ ...editing, mechanic: event.target.value })} /></div><div className="col-12"><label className="form-label">Workshop</label><input className="form-control" maxLength="160" value={editing.workshop || ""} onChange={(event) => setEditing({ ...editing, workshop: event.target.value })} /></div><div className="col-12"><label className="form-label">Notes</label><textarea className="form-control" rows="3" maxLength="2000" value={editing.notes || ""} onChange={(event) => setEditing({ ...editing, notes: event.target.value })} /></div></div>
        <div className="d-flex justify-content-end gap-2 mt-4"><button type="button" className="btn btn-light" onClick={() => setEditing(null)}>Cancel</button><button type="submit" className="btn btn-success" disabled={saving}>{saving ? "Saving…" : "Save updates"}</button></div>
      </form></section></div>}
    </main>
  );
}

export default Maintenance;
