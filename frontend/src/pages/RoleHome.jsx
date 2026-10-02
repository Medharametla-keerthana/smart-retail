import { Link } from "react-router-dom";

function readUser() {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
}

function RoleHome() {
  const user = readUser();
  const isDriver = user.role === "driver";
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
