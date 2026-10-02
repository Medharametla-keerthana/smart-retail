import { useCallback, useEffect, useState } from "react";
import { readApiResponse } from "../utils/apiResponse";

function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/notifications", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      const data = await readApiResponse(response, "Notifications API");
      setItems(data.notifications || []);
    } catch (loadError) {
      setError(loadError.message || "Could not reach notifications API. Check the Vercel function and MongoDB connection.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (item) => {
    try {
      const response = await fetch("/api/notifications/read", {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: item._id }),
      });
      const data = await readApiResponse(response, "Notifications API");
      setItems((current) => current.map((notification) => notification._id === item._id ? data.notification : notification));
    } catch (readError) { setError(readError.message || "Could not update notification"); }
  };

  const visibleItems = items.filter((item) => filter === "All" || (filter === "Unread" ? !item.readAt : item.category === filter));
  const unreadCount = items.filter((item) => !item.readAt).length;

  return (
    <section className="container-fluid py-3 py-lg-4">
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div><p className="text-success fw-semibold text-uppercase small mb-1">Delivery updates</p><h1 className="fw-bold mb-1">Notifications</h1><p className="text-secondary mb-0">Status changes and incident reports linked to your account.</p></div>
        <div className="d-flex gap-2"><select className="form-select" value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter notifications"><option>All</option><option>Unread</option><option>Delivery</option><option>Incident</option><option>Request</option></select><button className="btn btn-outline-success" onClick={load} disabled={loading}>Refresh</button></div>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4"><div className="card border-0 shadow-sm rounded-4"><div className="card-body"><span className="text-secondary small">Total updates</span><div className="fs-2 fw-bold">{items.length}</div></div></div></div>
        <div className="col-6 col-md-4"><div className="card border-0 shadow-sm rounded-4"><div className="card-body"><span className="text-secondary small">Unread</span><div className="fs-2 fw-bold text-success">{unreadCount}</div></div></div></div>
        <div className="col-6 col-md-4"><div className="card border-0 shadow-sm rounded-4"><div className="card-body"><span className="text-secondary small">Incidents</span><div className="fs-2 fw-bold text-warning">{items.filter((item) => item.category === "Incident").length}</div></div></div></div>
      </div>
      <div className="card border-0 shadow-sm rounded-4"><div className="card-body p-0">
        {loading ? <p className="text-center text-secondary py-5 mb-0">Loading notifications…</p> : visibleItems.length === 0 ? <div className="text-center py-5"><i className="bi bi-bell-slash fs-1 text-secondary"></i><h2 className="h5 mt-3">You’re all caught up</h2><p className="text-secondary mb-0">Delivery and safety updates will appear here.</p></div> : (
          <div className="list-group list-group-flush rounded-4">{visibleItems.map((item) => <article className={`list-group-item p-4 ${item.readAt ? "" : "bg-success-subtle"}`} key={item._id}>
            <div className="d-flex gap-3"><span className={`fs-4 ${item.category === "Incident" ? "text-warning" : "text-success"}`}><i className={`bi ${item.category === "Incident" ? "bi-exclamation-triangle-fill" : "bi-box-seam"}`}></i></span><div className="flex-grow-1"><div className="d-flex flex-wrap justify-content-between gap-2"><h2 className="h6 fw-bold mb-1">{item.title}</h2><time className="small text-secondary">{new Date(item.createdAt).toLocaleString()}</time></div><p className="text-secondary mb-2">{item.message}</p><span className="badge text-bg-light">{item.category}</span>{item.actionUrl && <div className="mt-3"><a className="btn btn-sm btn-outline-primary" href={item.actionUrl} target="_blank" rel="noreferrer">Open updated route</a></div>}</div>{!item.readAt && <button className="btn btn-sm btn-outline-success align-self-start" onClick={() => markRead(item)}>Mark read</button>}</div>
          </article>)}</div>
        )}
      </div></div>
    </section>
  );
}

export default Notifications;
