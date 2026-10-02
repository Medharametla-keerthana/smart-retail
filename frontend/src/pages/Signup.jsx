import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", role: "customer" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSignup(event) {
    event.preventDefault();
    setError("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    if (!name || !email || !form.password || !form.confirmPassword) {
      setError("Please enter all required fields.");
      return;
    }

    if (name.length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password: form.password, role: form.role }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      navigate("/", {
        replace: true,
        state: { message: "Account created. Please login with your credentials.", role: form.role },
      });
    } catch (signupError) {
      setError(signupError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="row w-100 justify-content-center">
        <div className="col-11 col-sm-8 col-md-6 col-lg-5 col-xl-4">
          <div className="card shadow-lg border-0 rounded-4">
            <div className="card-body p-4 p-md-5">
              <div className="text-center mb-4">
                <i className="bi bi-truck fs-1 text-primary"></i>
                <h2 className="fw-bold">Create your account</h2>
                <p className="text-muted">Join SmartFleet Logistics</p>
              </div>

              {error && <div className="alert alert-danger" role="alert">{error}</div>}

              <form onSubmit={handleSignup} noValidate>
                <div className="mb-3">
                  <label className="form-label fw-semibold" htmlFor="name">Full Name</label>
                  <input id="name" name="name" type="text" className="form-control form-control-lg" placeholder="Enter your name" value={form.name} onChange={handleChange} autoComplete="name" />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold" htmlFor="signup-role">Account type</label>
                  <select id="signup-role" name="role" className="form-select form-select-lg" value={form.role} onChange={handleChange}>
                    <option value="customer">Customer</option>
                    <option value="driver">Driver (manager must add your driver record first)</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold" htmlFor="signup-email">Email Address</label>
                  <input id="signup-email" name="email" type="email" className="form-control form-control-lg" placeholder="Enter your email" value={form.email} onChange={handleChange} autoComplete="email" />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold" htmlFor="signup-password">Password</label>
                  <input id="signup-password" name="password" type="password" className="form-control form-control-lg" placeholder="At least 6 characters" value={form.password} onChange={handleChange} autoComplete="new-password" />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold" htmlFor="confirmPassword">Confirm Password</label>
                  <input id="confirmPassword" name="confirmPassword" type="password" className="form-control form-control-lg" placeholder="Re-enter your password" value={form.confirmPassword} onChange={handleChange} autoComplete="new-password" />
                </div>

                <button type="submit" className="btn btn-primary btn-lg w-100" disabled={loading}>
                  {loading ? "Creating account..." : "Create account"}
                </button>
              </form>

              <p className="text-center mt-4 mb-0">
                Already registered? <Link to="/">Login</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
