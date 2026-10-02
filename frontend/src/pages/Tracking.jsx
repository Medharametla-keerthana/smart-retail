import { useEffect, useMemo, useState } from "react";

function Tracking() {
  let currentUser = {};
  try { currentUser = JSON.parse(localStorage.getItem("user") || "{}"); } catch { currentUser = {}; }
  const isDriver = currentUser.role === "driver";
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [lastUpdated, setLastUpdated] = useState("");
  const [locationForm, setLocationForm] = useState({ vehicleId: "", latitude: "", longitude: "", locationName: "", speed: "" });
  const [savingLocation, setSavingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  // =========================================
  // GET VEHICLES FROM BACKEND
  // =========================================

  useEffect(() => {
    let cancelled = false;

    async function loadVehicles() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          if (!cancelled) {
            setError("Please login again.");
            setLoading(false);
          }
          return;
        }

        const response = await fetch(
          "/api/vehicles",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load vehicles"
          );
        }

        if (!cancelled) {
          setVehicles(data.vehicles || []);
          setLastUpdated(new Date().toLocaleTimeString());
          setLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          setError(error.message);
          setLoading(false);
        }
      }
    }

    loadVehicles();

    return () => {
      cancelled = true;
    };
  }, []);

  // =========================================
  // REFRESH VEHICLES
  // =========================================

  async function handleRefresh() {
    try {
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login again.");
        return;
      }

      const response = await fetch(
        "/api/vehicles",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to refresh vehicles"
        );
      }

      setVehicles(data.vehicles || []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      setError(error.message);
    }
  }

  async function submitLocation(event) {
    event.preventDefault();
    setSavingLocation(true);
    setLocationMessage("");
    try {
      const response = await fetch(`/api/locations/${locationForm.vehicleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          latitude: Number(locationForm.latitude),
          longitude: Number(locationForm.longitude),
          locationName: locationForm.locationName.trim() || `${locationForm.latitude}, ${locationForm.longitude}`,
          speed: Number(locationForm.speed || 0),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not save vehicle location");
      setVehicles((current) => current.map((vehicle) => vehicle._id === locationForm.vehicleId
        ? { ...vehicle, currentLocation: locationForm.locationName.trim() || `${locationForm.latitude}, ${locationForm.longitude}` }
        : vehicle));
      setLocationMessage("Location update saved.");
      setLocationForm((current) => ({ ...current, latitude: "", longitude: "", locationName: "", speed: "" }));
    } catch (error) {
      setLocationMessage(error.message || "Unable to connect to backend");
    } finally {
      setSavingLocation(false);
    }
  }

  // =========================================
  // FILTER VEHICLES
  // =========================================

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const vehicleNumber =
        vehicle.vehicleNumber || "";

      const vehicleType =
        vehicle.vehicleType || "";

      const model =
        vehicle.model || "";

      const currentLocation =
        vehicle.currentLocation || "";

      const driverName =
        vehicle.driverId?.name || "";

      const matchesSearch =
        vehicleNumber
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        vehicleType
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        model
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        currentLocation
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        driverName
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ||
        vehicle.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [vehicles, search, statusFilter]);

  // =========================================
  // STATUS CLASS
  // =========================================

  function getStatusClass(status) {
    if (status === "Available") {
      return "bg-success";
    }

    if (status === "Assigned") {
      return "bg-primary";
    }

    if (status === "Maintenance") {
      return "bg-danger";
    }

    return "bg-secondary";
  }

  // =========================================
  // STATUS ICON
  // =========================================

  function getStatusIcon(status) {
    if (status === "Available") {
      return "bi bi-check-circle-fill";
    }

    if (status === "Assigned") {
      return "bi bi-truck";
    }

    if (status === "Maintenance") {
      return "bi bi-tools";
    }

    return "bi bi-question-circle";
  }

  // =========================================
  // DRIVER NAME
  // =========================================

  function getDriverName(vehicle) {
    if (vehicle.driverId?.name) {
      return vehicle.driverId.name;
    }

    return "Not Assigned";
  }

  // =========================================
  // STATISTICS
  // =========================================

  const totalVehicles = vehicles.length;

  const availableVehicles = vehicles.filter(
    (vehicle) => vehicle.status === "Available"
  ).length;

  const assignedVehicles = vehicles.filter(
    (vehicle) => vehicle.status === "Assigned"
  ).length;

  const maintenanceVehicles = vehicles.filter(
    (vehicle) => vehicle.status === "Maintenance"
  ).length;

  return (
    <>
      {/* =========================================
          PAGE HEADER
      ========================================== */}

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">

        <div>
          <h1 className="fw-bold mb-1">
            Fleet Tracking
          </h1>

          <p className="text-muted mb-0">
            Monitor vehicles and their current operational status.
          </p>
        </div>

        <div className="text-md-end mt-3 mt-md-0">

          <span className="badge bg-success px-3 py-2">
            <i className="bi bi-broadcast me-2"></i>
            Connected
          </span>

          <div className="d-flex align-items-center justify-content-md-end mt-2">

            <small className="text-muted me-2">
              Updated: {lastUpdated || "--"}
            </small>

            <button
              className="btn btn-sm btn-outline-primary"
              onClick={handleRefresh}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Refresh
            </button>

          </div>

        </div>

      </div>


      {/* =========================================
          ERROR
      ========================================== */}

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}


      {/* =========================================
          LOADING
      ========================================== */}

      {loading && (
        <div className="text-center py-5">

          <div
            className="spinner-border text-primary"
            role="status"
          ></div>

          <p className="text-muted mt-3">
            Loading vehicles...
          </p>

        </div>
      )}


      {!loading && !error && (
        <>

          {/* =========================================
              STATISTICS
          ========================================== */}

          <div className="row g-4 mb-4">

            {/* Total Vehicles */}

            <div className="col-12 col-sm-6 col-xl-3">

              <div className="card border-0 shadow-sm h-100">

                <div className="card-body">

                  <div className="d-flex justify-content-between">

                    <div>

                      <p className="text-muted mb-1">
                        Total Vehicles
                      </p>

                      <h3 className="fw-bold mb-0">
                        {totalVehicles}
                      </h3>

                      <small className="text-muted">
                        Fleet vehicles
                      </small>

                    </div>

                    <div className="dashboard-icon primary-icon">
                      <i className="bi bi-truck"></i>
                    </div>

                  </div>

                </div>

              </div>

            </div>


            {/* Available */}

            <div className="col-12 col-sm-6 col-xl-3">

              <div className="card border-0 shadow-sm h-100">

                <div className="card-body">

                  <div className="d-flex justify-content-between">

                    <div>

                      <p className="text-muted mb-1">
                        Available
                      </p>

                      <h3 className="fw-bold text-success mb-0">
                        {availableVehicles}
                      </h3>

                      <small className="text-muted">
                        Ready for assignment
                      </small>

                    </div>

                    <div className="dashboard-icon success-icon">
                      <i className="bi bi-check-circle"></i>
                    </div>

                  </div>

                </div>

              </div>

            </div>


            {/* Assigned */}

            <div className="col-12 col-sm-6 col-xl-3">

              <div className="card border-0 shadow-sm h-100">

                <div className="card-body">

                  <div className="d-flex justify-content-between">

                    <div>

                      <p className="text-muted mb-1">
                        Assigned
                      </p>

                      <h3 className="fw-bold text-primary mb-0">
                        {assignedVehicles}
                      </h3>

                      <small className="text-muted">
                        Currently assigned
                      </small>

                    </div>

                    <div className="dashboard-icon primary-icon">
                      <i className="bi bi-truck"></i>
                    </div>

                  </div>

                </div>

              </div>

            </div>


            {/* Maintenance */}

            <div className="col-12 col-sm-6 col-xl-3">

              <div className="card border-0 shadow-sm h-100">

                <div className="card-body">

                  <div className="d-flex justify-content-between">

                    <div>

                      <p className="text-muted mb-1">
                        Maintenance
                      </p>

                      <h3 className="fw-bold text-danger mb-0">
                        {maintenanceVehicles}
                      </h3>

                      <small className="text-danger">
                        Needs attention
                      </small>

                    </div>

                    <div className="dashboard-icon warning-icon">
                      <i className="bi bi-tools"></i>
                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>


          {/* =========================================
              SEARCH AND FILTER
          ========================================== */}

          <div className="card border-0 shadow-sm mb-4">

            <div className="card-body">

              <div className="row g-3">

                {/* Search */}

                <div className="col-lg-7">

                  <label className="form-label fw-semibold">
                    Search Vehicle
                  </label>

                  <div className="input-group">

                    <span className="input-group-text bg-white">
                      <i className="bi bi-search"></i>
                    </span>

                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by vehicle, model, driver or location..."
                      value={search}
                      onChange={(event) =>
                        setSearch(event.target.value)
                      }
                    />

                  </div>

                </div>


                {/* Status */}

                <div className="col-lg-3">

                  <label className="form-label fw-semibold">
                    Status
                  </label>

                  <select
                    className="form-select"
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

                    <option value="Assigned">
                      Assigned
                    </option>

                    <option value="Maintenance">
                      Maintenance
                    </option>

                  </select>

                </div>


                {/* Clear */}

                <div className="col-lg-2 d-flex align-items-end">

                  <button
                    className="btn btn-outline-secondary w-100"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("All");
                    }}
                  >
                    <i className="bi bi-x-circle me-1"></i>
                    Clear
                  </button>

                </div>

              </div>

            </div>

          </div>


          {/* =========================================
              VEHICLE LOCATION OVERVIEW
          ========================================== */}

          {isDriver && <form className="card border-0 shadow-sm mb-4" onSubmit={submitLocation}>
            <div className="card-body">
              <h5 className="fw-bold mb-1">Record a vehicle location</h5>
              <p className="text-muted small">Save coordinates and a place name to the vehicle’s location history.</p>
              {locationMessage && <div className="alert alert-info py-2">{locationMessage}</div>}
              <div className="row g-3 align-items-end">
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold">Vehicle</label>
                  <select required className="form-select" value={locationForm.vehicleId} onChange={(event) => setLocationForm({ ...locationForm, vehicleId: event.target.value })}>
                    <option value="">Select a vehicle</option>
                    {vehicles.map((vehicle) => <option key={vehicle._id} value={vehicle._id}>{vehicle.vehicleNumber}</option>)}
                  </select>
                </div>
                <div className="col-6 col-md-2"><label className="form-label fw-semibold">Latitude</label><input required type="number" step="any" min="-90" max="90" className="form-control" value={locationForm.latitude} onChange={(event) => setLocationForm({ ...locationForm, latitude: event.target.value })} /></div>
                <div className="col-6 col-md-2"><label className="form-label fw-semibold">Longitude</label><input required type="number" step="any" min="-180" max="180" className="form-control" value={locationForm.longitude} onChange={(event) => setLocationForm({ ...locationForm, longitude: event.target.value })} /></div>
                <div className="col-8 col-md-2"><label className="form-label fw-semibold">Place name</label><input className="form-control" value={locationForm.locationName} onChange={(event) => setLocationForm({ ...locationForm, locationName: event.target.value })} placeholder="Optional" /></div>
                <div className="col-4 col-md-2"><label className="form-label fw-semibold">Speed km/h</label><input type="number" min="0" step="any" className="form-control" value={locationForm.speed} onChange={(event) => setLocationForm({ ...locationForm, speed: event.target.value })} /></div>
                <div className="col-12"><button className="btn btn-primary" type="submit" disabled={savingLocation || !vehicles.length}>{savingLocation ? "Saving..." : "Save location"}</button></div>
              </div>
            </div>
          </form>}

          <div className="card border-0 shadow-sm mb-4">

            <div className="card-body">

              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">

                <div>

                  <h5 className="fw-bold mb-1">
                    Fleet Location Overview
                  </h5>

                  <small className="text-muted">
                    Current locations received from the backend
                  </small>

                </div>

                <div className="mt-2 mt-md-0">

                  <span className="badge bg-success me-2">
                    Available
                  </span>

                  <span className="badge bg-primary me-2">
                    Assigned
                  </span>

                  <span className="badge bg-danger">
                    Maintenance
                  </span>

                </div>

              </div>


              <div
                className="rounded p-4"
                style={{
                  minHeight: "220px",
                  background:
                    "linear-gradient(135deg, #eef5ff 0%, #f8fbff 50%, #edf8f2 100%)",
                  border: "1px solid #dee2e6",
                }}
              >

                <div className="row g-3">

                  {vehicles.length > 0 ? (

                    vehicles.map((vehicle) => (

                      <div
                        className="col-md-6 col-xl-4"
                        key={vehicle._id}
                      >

                        <button
                          className="btn btn-light border shadow-sm w-100 text-start p-3"
                          onClick={() =>
                            setSelectedVehicle(vehicle)
                          }
                        >

                          <div className="d-flex align-items-center">

                            <div
                              className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${getStatusClass(
                                vehicle.status
                              )}`}
                              style={{
                                width: "42px",
                                height: "42px",
                              }}
                            >

                              <i
                                className={`${getStatusIcon(
                                  vehicle.status
                                )} text-white`}
                              ></i>

                            </div>

                            <div>

                              <div className="fw-semibold">
                                {vehicle.vehicleNumber}
                              </div>

                              <small className="text-muted">
                                <i className="bi bi-geo-alt me-1"></i>
                                {vehicle.currentLocation ||
                                  "Unknown"}
                              </small>

                            </div>

                          </div>

                        </button>

                      </div>

                    ))

                  ) : (

                    <div className="text-center text-muted py-5">
                      No vehicles available.
                    </div>

                  )}

                </div>

              </div>

            </div>

          </div>


          {/* =========================================
              SELECTED VEHICLE
          ========================================== */}

          {selectedVehicle && (

            <div className="card border-0 shadow-sm mb-4">

              <div className="card-body">

                <div className="d-flex justify-content-between align-items-center mb-4">

                  <div>

                    <h5 className="fw-bold mb-1">
                      Selected Vehicle
                    </h5>

                    <small className="text-muted">
                      Vehicle information from backend
                    </small>

                  </div>

                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() =>
                      setSelectedVehicle(null)
                    }
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>

                </div>


                <div className="row g-4">

                  {/* Vehicle Number */}

                  <div className="col-md-3">

                    <small className="text-muted">
                      Vehicle Number
                    </small>

                    <h6 className="fw-bold mt-1">
                      {selectedVehicle.vehicleNumber}
                    </h6>

                  </div>


                  {/* Vehicle Type */}

                  <div className="col-md-3">

                    <small className="text-muted">
                      Vehicle Type
                    </small>

                    <h6 className="fw-bold mt-1">
                      {selectedVehicle.vehicleType ||
                        "--"}
                    </h6>

                  </div>


                  {/* Model */}

                  <div className="col-md-3">

                    <small className="text-muted">
                      Model
                    </small>

                    <h6 className="fw-bold mt-1">
                      {selectedVehicle.model || "--"}
                    </h6>

                  </div>


                  {/* Location */}

                  <div className="col-md-3">

                    <small className="text-muted">
                      Current Location
                    </small>

                    <h6 className="fw-bold mt-1">

                      <i className="bi bi-geo-alt text-danger me-1"></i>

                      {selectedVehicle.currentLocation ||
                        "Unknown"}

                    </h6>

                  </div>


                  {/* Capacity */}

                  <div className="col-md-3">

                    <small className="text-muted">
                      Capacity
                    </small>

                    <h6 className="fw-bold mt-1">
                      {selectedVehicle.capacity || "--"}
                    </h6>

                  </div>


                  {/* Driver */}

                  <div className="col-md-3">

                    <small className="text-muted">
                      Driver
                    </small>

                    <h6 className="fw-bold mt-1">
                      {getDriverName(selectedVehicle)}
                    </h6>

                  </div>


                  {/* Driver Email */}

                  <div className="col-md-3">

                    <small className="text-muted">
                      Driver Email
                    </small>

                    <h6 className="fw-bold mt-1">
                      {selectedVehicle.driverId?.email ||
                        "--"}
                    </h6>

                  </div>


                  {/* Status */}

                  <div className="col-md-3">

                    <small className="text-muted">
                      Status
                    </small>

                    <div className="mt-1">

                      <span
                        className={`badge ${getStatusClass(
                          selectedVehicle.status
                        )}`}
                      >

                        <i
                          className={`${getStatusIcon(
                            selectedVehicle.status
                          )} me-1`}
                        ></i>

                        {selectedVehicle.status}

                      </span>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          )}


          {/* =========================================
              VEHICLE TABLE
          ========================================== */}

          <div className="card border-0 shadow-sm">

            <div className="card-body">

              <div className="d-flex justify-content-between align-items-center mb-4">

                <div>

                  <h5 className="fw-bold mb-1">
                    Vehicle Status
                  </h5>

                  <small className="text-muted">
                    {filteredVehicles.length} vehicles displayed
                  </small>

                </div>

                <span className="badge bg-light text-dark border">
                  Live backend data
                </span>

              </div>


              <div className="table-responsive">

                <table className="table table-hover align-middle">

                  <thead className="table-light">

                    <tr>
                      <th>Vehicle</th>
                      <th>Type</th>
                      <th>Model</th>
                      <th>Driver</th>
                      <th>Current Location</th>
                      <th>Capacity</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>

                  </thead>


                  <tbody>

                    {filteredVehicles.length > 0 ? (

                      filteredVehicles.map((vehicle) => (

                        <tr key={vehicle._id}>

                          {/* Vehicle */}

                          <td>

                            <div className="d-flex align-items-center">

                              <div
                                className="rounded-circle bg-light d-flex align-items-center justify-content-center me-2"
                                style={{
                                  width: "38px",
                                  height: "38px",
                                }}
                              >
                                <i className="bi bi-truck text-primary"></i>
                              </div>

                              <div>

                                <div className="fw-semibold">
                                  {vehicle.vehicleNumber}
                                </div>

                                <small className="text-muted">
                                  Vehicle ID:{" "}
                                  {vehicle._id?.slice(-6)}
                                </small>

                              </div>

                            </div>

                          </td>


                          {/* Type */}

                          <td>
                            {vehicle.vehicleType || "--"}
                          </td>


                          {/* Model */}

                          <td>
                            {vehicle.model || "--"}
                          </td>


                          {/* Driver */}

                          <td>
                            {getDriverName(vehicle)}
                          </td>


                          {/* Location */}

                          <td>

                            <i className="bi bi-geo-alt-fill text-danger me-2"></i>

                            {vehicle.currentLocation ||
                              "Unknown"}

                          </td>


                          {/* Capacity */}

                          <td>
                            {vehicle.capacity || "--"}
                          </td>


                          {/* Status */}

                          <td>

                            <span
                              className={`badge ${getStatusClass(
                                vehicle.status
                              )}`}
                            >

                              <i
                                className={`${getStatusIcon(
                                  vehicle.status
                                )} me-1`}
                              ></i>

                              {vehicle.status}

                            </span>

                          </td>


                          {/* Action */}

                          <td>

                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() =>
                                setSelectedVehicle(vehicle)
                              }
                            >
                              <i className="bi bi-eye me-1"></i>
                              View
                            </button>

                          </td>

                        </tr>

                      ))

                    ) : (

                      <tr>

                        <td
                          colSpan="8"
                          className="text-center py-5"
                        >

                          <i className="bi bi-search fs-2 text-muted"></i>

                          <p className="text-muted mt-2 mb-0">
                            No vehicles found.
                          </p>

                        </td>

                      </tr>

                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </div>

        </>
      )}

    </>
  );
}

export default Tracking;
