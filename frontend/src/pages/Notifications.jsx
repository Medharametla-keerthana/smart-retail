import { useCallback, useEffect, useState } from "react";
import { readApiResponse } from "../utils/apiResponse";
import "./Notifications.css";

const emptyCounts = { total: 0, unread: 0, incidents: 0 };
const safeRouteUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "www.google.com" && url.pathname.startsWith("/maps/dir/") ? url.href : "";
  } catch { return ""; }
};

function Notifications() {
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState(emptyCounts);
  const [matchingCount, setMatchingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [markingId, setMarkingId] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);

  const fetchNotifications = useCallback(async (signal) => {
    const params = new URLSearchParams({ filter });
    const response = await fetch(`/api/notifications?${params.toString()}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, signal,
    });
    return readApiResponse(response, "Notifications API");
  }, [filter]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    fetchNotifications(controller.signal)
      .then((data) => {
        if (!active) return;
        setError("");
        setItems(data.notifications || []);
        setCounts(data.counts || {
          total: data.notifications?.length || 0,
          unread: data.unreadCount || 0,
          incidents: (data.notifications || []).filter((item) => item.category === "Incident").length,
        });
        setMatchingCount(data.matchingCount ?? data.notifications?.length ?? 0);
      })
      .catch((loadError) => {
        if (!active || loadError.name === "AbortError") return;
        setError(loadError.message || "Could not reach notifications API. Check the Vercel function and MongoDB connection.");
        setItems([]);
        setMatchingCount(0);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [fetchNotifications, refreshVersion]);

  const refresh = () => {
    setLoading(true);
    setRefreshVersion((current) => current + 1);
  };

  const changeFilter = (event) => {
    setError("");
    setLoading(true);
    setFilter(event.target.value);
  };

  const markRead = async (item) => {
    if (markingId) return;
    setMarkingId(item._id);
    setError("");
    try {
      const response = await fetch("/api/notifications/read", {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: item._id }),
      });
      const data = await readApiResponse(response, "Notifications API");
      if (!item.readAt) {
        setCounts((current) => ({ ...current, unread: Math.max(0, current.unread - 1) }));
        if (filter === "Unread") {
          setItems((current) => current.filter((notification) => notification._id !== item._id));
          setMatchingCount((current) => Math.max(0, current - 1));
        } else {
          setItems((current) => current.map((notification) => notification._id === item._id ? data.notification : notification));
        }
      }
    } catch (readError) {
      setError(readError.message || "Could not update notification");
    } finally {
      setMarkingId("");
    }
  };

  return (
    <section className="container-fluid py-3 py-lg-4 notifications-page">
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div>
          <p className="text-success fw-semibold text-uppercase small mb-1">Delivery updates</p>
          <h1 className="fw-bold mb-1">Notifications</h1>
          <p className="text-secondary mb-0">Status changes and incident reports linked to your account.</p>
        </div>
        <div className="notifications-controls">
          <label className="visually-hidden" htmlFor="notification-filter">Filter notifications</label>
          <select id="notification-filter" className="form-select" value={filter} onChange={changeFilter}>
            <option>All</option><option>Unread</option><option>Delivery</option><option>Incident</option><option>Request</option>
          </select>
          <button className="btn btn-outline-success" onClick={refresh} disabled={loading || Boolean(markingId)}>
            <i className="bi bi-arrow-clockwise me-2" aria-hidden="true" />Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4"><div className="card border-0 shadow-sm rounded-4 h-100"><div className="card-body"><span className="text-secondary small">Total updates</span><div className="fs-2 fw-bold" aria-live="polite">{counts.total}</div></div></div></div>
        <div className="col-6 col-md-4"><div className="card border-0 shadow-sm rounded-4 h-100"><div className="card-body"><span className="text-secondary small">Unread</span><div className="fs-2 fw-bold text-success" aria-live="polite">{counts.unread}</div></div></div></div>
        <div className="col-12 col-md-4"><div className="card border-0 shadow-sm rounded-4 h-100"><div className="card-body"><span className="text-secondary small">Incidents</span><div className="fs-2 fw-bold text-warning">{counts.incidents}</div></div></div></div>
      </div>

      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-0">
          {loading ? <p className="text-center text-secondary py-5 mb-0" role="status" aria-live="polite">Loading notifications…</p>
            : items.length === 0 ? <div className="text-center py-5"><i className="bi bi-bell-slash fs-1 text-secondary" aria-hidden="true" /><h2 className="h5 mt-3">{filter === "All" ? "You’re all caught up" : filter === "Unread" ? "No unread notifications" : `No ${filter.toLowerCase()} notifications`}</h2><p className="text-secondary mb-0">{filter === "All" ? "Delivery and safety updates will appear here." : "Try a different filter to see other updates."}</p></div>
              : <div className="list-group list-group-flush rounded-4">{items.map((item) => (
                <article className={`list-group-item notification-item ${item.readAt ? "" : "is-unread"}`} key={item._id}>
                  <div className="notification-item-content">
                    <span className={`notification-icon ${item.category === "Incident" ? "text-warning" : "text-success"}`} aria-hidden="true"><i className={`bi ${item.category === "Incident" ? "bi-exclamation-triangle-fill" : "bi-box-seam"}`} /></span>
                    <div className="notification-copy">
                      <span className="visually-hidden">{item.readAt ? "Read notification" : "Unread notification"}. </span>
                      <div className="notification-title-row"><h2 className="h6 fw-bold mb-1">{item.title}</h2><time className="small text-secondary" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time></div>
                      <p className="text-secondary mb-2">{item.message}</p>
                      <span className="badge text-bg-light">{item.category}</span>
                      {safeRouteUrl(item.actionUrl) && <div className="mt-3"><a className="btn btn-sm btn-outline-primary" href={safeRouteUrl(item.actionUrl)} target="_blank" rel="noreferrer">Open updated route<span className="visually-hidden"> for {item.title}</span></a></div>}
                    </div>
                    {!item.readAt && <button className="btn btn-sm btn-outline-success notification-read-button" disabled={Boolean(markingId)} aria-label={`Mark notification as read: ${item.title}`} aria-busy={markingId === item._id} onClick={() => markRead(item)}>{markingId === item._id ? "Saving…" : "Mark read"}</button>}
                  </div>
                </article>
              ))}</div>}
          {!loading && matchingCount > items.length && <p className="notification-limit-note">Showing the newest {items.length} of {matchingCount} matching updates.</p>}
        </div>
      </div>
    </section>
  );
}

export default Notifications;
