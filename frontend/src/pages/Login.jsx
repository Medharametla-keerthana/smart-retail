import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(location.state?.message || "");

  async function handleLogin(event) {
    event.preventDefault();

    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: normalizedEmail,
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Save token
      localStorage.setItem("token", data.token);

      // Save user information
      localStorage.setItem("user", JSON.stringify(data.user));

      // Go to dashboard
      const destination = location.state?.from?.pathname || "/dashboard";
      navigate(destination, { replace: true });

    } catch (error) {
      setError(error.message);
    }

    setLoading(false);
  }

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">

      <div className="row w-100 justify-content-center">

        <div className="col-11 col-sm-8 col-md-6 col-lg-5 col-xl-4">

          <div className="card shadow-lg border-0 rounded-4">

            <div className="card-body p-4 p-md-5">

              <div className="text-center mb-4">

                <i className="bi bi-truck fs-1 text-primary"></i>

                <h2 className="fw-bold">
                  SmartFleet
                </h2>

                <p className="text-muted">
                  Smart Real-Time Fleet Logistics Monitor
                </p>

              </div>

              {/* Error message */}

              {error && (
                <div className="alert alert-danger">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin}>

                {/* Email */}

                <div className="mb-3">

                  <label className="form-label fw-semibold">
                    Email Address
                  </label>

                  <input
                    type="email"
                    className="form-control form-control-lg"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    required
                  />

                </div>

                {/* Password */}

                <div className="mb-4">

                  <label className="form-label fw-semibold">
                    Password
                  </label>

                  <input
                    type="password"
                    className="form-control form-control-lg"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    required
                  />

                </div>

                {/* Login button */}

                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-100"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </button>

              </form>

              <p className="text-center mt-4 mb-0">
                New to SmartFleet? <Link to="/signup">Create an account</Link>
              </p>

              <div className="text-center mt-4">

                <small className="text-muted">
                  Smart Fleet Logistics Management System
                </small>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;