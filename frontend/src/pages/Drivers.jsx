import { useEffect, useState } from "react";
import "./Drivers.css";

const API_URL = "/api";

function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    licenseNumber: "",
    experience: "",
    status: "Available",
    currentLocation: "",
  });

  // ==========================================
  // LOAD DRIVERS
  // ==========================================

  useEffect(() => {
    const loadDrivers = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(`${API_URL}/drivers`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          setDrivers(data.drivers || []);
        } else {
          setMessage(data.message || "Failed to load drivers");
        }
      } catch {
        setMessage("Unable to connect to backend");
      } finally {
        setLoading(false);
      }
    };

    loadDrivers();
  }, []);

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // OPEN ADD FORM
  // ==========================================

  const openAddForm = () => {
    setEditingDriver(null);

    setFormData({
      name: "",
      email: "",
      phone: "",
      licenseNumber: "",
      experience: "",
      status: "Available",
      currentLocation: "",
    });

    setShowForm(true);
  };

  // ==========================================
  // OPEN EDIT FORM
  // ==========================================

  const openEditForm = (driver) => {
    setEditingDriver(driver);

    setFormData({
      name: driver.name || "",
      email: driver.email || "",
      phone: driver.phone || "",
      licenseNumber: driver.licenseNumber || "",
      experience: driver.experience || "",
      status: driver.status || "Available",
      currentLocation: driver.currentLocation || "",
    });

    setShowForm(true);
  };

  // ==========================================
  // CLOSE FORM
  // ==========================================

  const closeForm = () => {
    setShowForm(false);
    setEditingDriver(null);
  };

  // ==========================================
  // ADD / UPDATE DRIVER
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const token = localStorage.getItem("token");

      let url = `${API_URL}/drivers`;
      let method = "POST";

      if (editingDriver) {
        url = `${API_URL}/drivers/${editingDriver._id}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          licenseNumber: formData.licenseNumber,
          experience: Number(formData.experience) || 0,
          status: formData.status,
          currentLocation: formData.currentLocation,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (editingDriver) {
          setDrivers((previous) =>
            previous.map((driver) =>
              driver._id === editingDriver._id
                ? data.driver
                : driver
            )
          );

          setMessage("Driver updated successfully");
        } else {
          setDrivers((previous) => [
            ...previous,
            data.driver,
          ]);

          setMessage("Driver created successfully");
        }

        closeForm();
      } else {
        setMessage(data.message || "Failed to save driver");
      }
    } catch {
      setMessage("Unable to connect to backend");
    }
  };

  // ==========================================
  // DELETE DRIVER
  // ==========================================

  const deleteDriver = async (driverId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this driver?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/drivers/${driverId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setDrivers((previous) =>
          previous.filter(
            (driver) => driver._id !== driverId
          )
        );

        setMessage("Driver deleted successfully");
      } else {
        setMessage(
          data.message || "Failed to delete driver"
        );
      }
    } catch {
      setMessage("Unable to connect to backend");
    }
  };

  // ==========================================
  // SEARCH AND FILTER
  // ==========================================

  const filteredDrivers = drivers.filter((driver) => {
    const searchText = search.toLowerCase();

    const name =
      driver.name?.toLowerCase() || "";

    const email =
      driver.email?.toLowerCase() || "";

    const phone =
      driver.phone?.toLowerCase() || "";

    const license =
      driver.licenseNumber?.toLowerCase() || "";

    const matchesSearch =
      name.includes(searchText) ||
      email.includes(searchText) ||
      phone.includes(searchText) ||
      license.includes(searchText);

    const matchesStatus =
      statusFilter === "All" ||
      driver.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // ==========================================
  // COUNTS
  // ==========================================

  const availableCount = drivers.filter(
    (driver) => driver.status === "Available"
  ).length;

  const assignedCount = drivers.filter(
    (driver) => driver.status === "On Trip"
  ).length;

  const otherCount =
    drivers.length -
    availableCount -
    assignedCount;

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="drivers-page">

      {/* HEADER */}

      <div className="drivers-header">

        <div>
          <h1>Drivers</h1>

          <p>
            Manage and monitor fleet drivers
          </p>
        </div>

        <button
          className="add-driver-btn"
          onClick={openAddForm}
        >
          + Add Driver
        </button>

      </div>

      {/* MESSAGE */}

      {message && (
        <div className="drivers-message">
          {message}
        </div>
      )}

      {/* SUMMARY CARDS */}

      <div className="driver-stat-grid">

        <div className="driver-stat-card">
          <p>Total Drivers</p>
          <h2>{drivers.length}</h2>
        </div>

        <div className="driver-stat-card">
          <p>Available</p>
          <h2 className="green-number">
            {availableCount}
          </h2>
        </div>

        <div className="driver-stat-card">
          <p>Assigned</p>
          <h2 className="blue-number">
            {assignedCount}
          </h2>
        </div>

        <div className="driver-stat-card">
          <p>Other</p>
          <h2 className="orange-number">
            {otherCount}
          </h2>
        </div>

      </div>

      {/* SEARCH */}

      <div className="driver-filter-box">

        <input
          type="text"
          placeholder="Search by name, email, phone or license..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >
          <option value="All">
            All Status
          </option>

          <option value="Available">
            Available
          </option>

          <option value="On Trip">
            On Trip
          </option>

          <option value="Inactive">
            Inactive
          </option>
        </select>

      </div>

      {/* LOADING */}

      {loading && (
        <div className="drivers-loading">
          Loading drivers...
        </div>
      )}

      {/* TABLE */}

      {!loading && (
        <div className="drivers-table-container">

          <table className="drivers-table">

            <thead>

              <tr>
                <th>Driver</th>
                <th>Phone</th>
                <th>License</th>
                <th>Experience</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>

            </thead>

            <tbody>

              {filteredDrivers.length === 0 ? (

                <tr>

                  <td
                    colSpan="7"
                    className="no-drivers"
                  >
                    No drivers found
                  </td>

                </tr>

              ) : (

                filteredDrivers.map((driver) => (

                  <tr key={driver._id}>

                    <td>

                      <div className="driver-name">
                        {driver.name || "-"}
                      </div>

                      <div className="driver-email">
                        {driver.email || "-"}
                      </div>

                    </td>

                    <td>
                      {driver.phone || "-"}
                    </td>

                    <td>
                      {driver.licenseNumber || "-"}
                    </td>

                    <td>
                      {driver.experience || 0} years
                    </td>

                    <td>
                      {driver.currentLocation || "-"}
                    </td>

                    <td>

                      <span
                        className={
                          driver.status === "Available"
                            ? "status-badge status-available"
                            : driver.status === "Assigned"
                            ? "status-badge status-assigned"
                            : "status-badge status-other"
                        }
                      >
                        {driver.status || "Unknown"}
                      </span>

                    </td>

                    <td>

                      <div className="driver-actions">

                        <button
                          className="edit-btn"
                          onClick={() =>
                            openEditForm(driver)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="delete-btn"
                          onClick={() =>
                            deleteDriver(driver._id)
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>
      )}

      {/* ADD / EDIT MODAL */}

      {showForm && (

        <div className="driver-modal-overlay">

          <div className="driver-modal">

            <div className="driver-modal-header">

              <div>
                <h2>
                  {editingDriver
                    ? "Edit Driver"
                    : "Add Driver"}
                </h2>

                <p>
                  {editingDriver
                    ? "Update driver information"
                    : "Enter driver information"}
                </p>
              </div>

              <button
                className="modal-close-btn"
                onClick={closeForm}
              >
                ×
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              <div className="driver-form-grid">

                <div className="form-group">

                  <label>Driver Name</label>

                  <input
                    type="text"
                    name="name"
                    placeholder="Enter driver name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />

                </div>

                <div className="form-group">

                  <label>Email</label>

                  <input
                    type="email"
                    name="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />

                </div>

                <div className="form-group">

                  <label>Phone</label>

                  <input
                    type="text"
                    name="phone"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />

                </div>

                <div className="form-group">

                  <label>License Number</label>

                  <input
                    type="text"
                    name="licenseNumber"
                    placeholder="Enter license number"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    required
                  />

                </div>

                <div className="form-group">

                  <label>Experience (Years)</label>

                  <input
                    type="number"
                    name="experience"
                    placeholder="Enter experience"
                    value={formData.experience}
                    onChange={handleChange}
                    min="0"
                  />

                </div>

                <div className="form-group">

                  <label>Status</label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >

                    <option value="Available">
                      Available
                    </option>

                    <option value="Assigned">
                      Assigned
                    </option>

                    <option value="Inactive">
                      Inactive
                    </option>

                  </select>

                </div>

                <div className="form-group full-width">

                  <label>Current Location</label>

                  <input
                    type="text"
                    name="currentLocation"
                    placeholder="Enter current location"
                    value={formData.currentLocation}
                    onChange={handleChange}
                  />

                </div>

              </div>

              <div className="driver-form-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-driver-btn"
                >
                  {editingDriver
                    ? "Update Driver"
                    : "Add Driver"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Drivers;