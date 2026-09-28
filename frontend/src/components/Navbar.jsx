import { Link, useNavigate } from "react-router-dom";

function Navbar({ toggleSidebar }) {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  }

  return (
    <nav className="navbar navbar-expand fleet-navbar">

      {/* LEFT SIDE */}

      <div className="d-flex align-items-center gap-3">

        {/* MOBILE MENU BUTTON */}

        <button
          className="btn btn-outline-secondary sidebar-toggle"
          aria-label="Open navigation menu"
          onClick={toggleSidebar}
        >
          <i className="bi bi-list fs-5"></i>
        </button>

        <div className="navbar-brand-lockup">
          <span className="navbar-brand-mark"><i className="bi bi-truck-front-fill"></i></span>
          <div>
            <h5 className="mb-0 fw-bold">Smart Fleet</h5>
            <small>Operations workspace</small>
          </div>
        </div>

      </div>


      {/* RIGHT SIDE */}

      <div className="d-flex align-items-center gap-3">

        <Link
          to="/profile"
          className="navbar-profile text-decoration-none fw-semibold"
        >
          <i className="bi bi-person-circle"></i>
          Fleet Manager
        </Link>


        <button
          className="btn btn-sm navbar-logout"
          onClick={handleLogout}
        >
          <i className="bi bi-box-arrow-right me-1"></i>
          Logout
        </button>

      </div>

    </nav>
  );
}

export default Navbar;