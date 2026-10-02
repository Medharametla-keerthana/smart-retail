import { useEffect, useState } from "react";
import { readApiResponse } from "../utils/apiResponse";
import "./Profile.css";

const ROLE_LABELS = { fleetManager: "Fleet Manager", admin: "Administrator", driver: "Driver", customer: "Customer" };

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("info");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Please sign in again to view your profile.");
        const response = await fetch("/api/auth/profile", { headers: { Authorization: `Bearer ${token}` } });
        const data = await readApiResponse(response, "Profile API");
        setUser(data.user);
      } catch (error) {
        setMessage(error.message || "Unable to load your profile");
        setFeedback("danger");
      } finally { setLoading(false); }
    };
    loadProfile();
  }, []);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ name: user.name, email: user.email }),
      });
      const data = await readApiResponse(response, "Profile API");
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      setMessage("Your profile and linked account records have been updated.");
      setFeedback("success");
    } catch (error) {
      setMessage(error.message || "Unable to update your profile");
      setFeedback("danger");
    } finally { setSaving(false); }
  };

  if (loading) return <main className="profile-page"><div className="profile-loading"><span className="spinner-border spinner-border-sm me-2" />Loading your account…</div></main>;
  if (!user) return <main className="profile-page"><div className="alert alert-danger">{message || "Profile information is not available."}</div></main>;

  const roleLabel = ROLE_LABELS[user.role] || "Fleet account";
  const avatar = user.name?.trim()?.charAt(0)?.toUpperCase() || "U";
  const createdLabel = user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "—";

  return (
    <main className="profile-page">
      <header className="profile-header"><div><span className="profile-eyebrow">ACCOUNT SETTINGS</span><h1>Your profile</h1><p>Manage the personal details connected to your Smart Fleet account.</p></div></header>
      {message && <div className={`alert alert-${feedback} profile-feedback`} role="status">{message}</div>}

      <div className="profile-layout">
        <form className="profile-card" onSubmit={saveProfile}>
          <div className="profile-card-heading"><div><span className="profile-section-kicker">PERSONAL DETAILS</span><h2>Edit profile</h2><p>These details are used for account and delivery updates.</p></div><div className="profile-avatar" aria-hidden="true">{avatar}</div></div>
          <label className="profile-field"><span>Full name</span><input className="form-control" autoComplete="name" required maxLength="100" value={user.name || ""} onChange={(event) => setUser({ ...user, name: event.target.value })} /></label>
          <label className="profile-field"><span>Email address</span><input className="form-control" type="email" autoComplete="email" required maxLength="254" value={user.email || ""} onChange={(event) => setUser({ ...user, email: event.target.value })} /><small>Changing your email also updates linked deliveries and notifications.</small></label>
          <div className="profile-form-footer"><span><i className="bi bi-shield-check me-2" />Your role and permissions are managed by the fleet system.</span><button className="btn btn-success px-4" type="submit" disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : "Save profile"}</button></div>
        </form>

        <aside className="profile-info-card">
          <div className="profile-info-heading"><span className="profile-section-kicker">ACCOUNT</span><h2>Account information</h2><p>Details about your Smart Fleet access.</p></div>
          <div className="profile-role-panel"><span className="profile-role-icon"><i className="bi bi-person-badge" /></span><div><small>Account role</small><strong>{roleLabel}</strong></div><span className="profile-status">Active</span></div>
          <div className="profile-info-list">
            <div className="profile-info-item"><span>Full name</span><strong>{user.name || "—"}</strong></div>
            <div className="profile-info-item"><span>Email</span><strong>{user.email || "—"}</strong></div>
            <div className="profile-info-item"><span>Member since</span><strong>{createdLabel}</strong></div>
            <div className="profile-info-item"><span>User ID</span><strong className="profile-id">{user._id || "—"}</strong></div>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default Profile;
