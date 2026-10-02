import { useEffect, useState } from "react";
import "./Deliveries.css";

const API_URL = "/api";

function Deliveries() {
  let user = {};
  try { user = JSON.parse(localStorage.getItem("user") || "{}"); } catch { user = {}; }
  const isManager = !user.role || ["fleetManager", "admin"].includes(user.role);
  const isDriver = user.role === "driver";
  const isCustomer = user.role === "customer";
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({ source: "", destination: "", cargoDetails: "", startTime: "" });
  const [assignmentTrip, setAssignmentTrip] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState({ vehicleId: "", driverId: "" });
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [loadingResources, setLoadingResources] = useState(false);
  const [savingDelivery, setSavingDelivery] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({
    vehicleId: "",
    driverId: "",
    source: "",
    destination: "",
    cargoDetails: "",
    distance: "",
    startTime: "",
    customerName: "",
    customerEmail: "",
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // ==========================================
  // LOAD TRIPS FROM BACKEND
  // ==========================================
  useEffect(() => {
    const loadTrips = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(`${API_URL}/trips`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          setTrips(data.trips || []);
        } else {
          setMessage(data.message || "Failed to load trips");
        }
      } catch {
        setMessage("Unable to connect to backend");
      } finally {
        setLoading(false);
      }
    };

    loadTrips();
  }, []);

  const openCreateForm = async () => {
    setShowCreateForm(true);
    setLoadingResources(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const [vehiclesResponse, driversResponse] = await Promise.all([
        fetch(`${API_URL}/vehicles`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/drivers`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const [vehiclesData, driversData] = await Promise.all([
        vehiclesResponse.json(),
        driversResponse.json(),
      ]);

      if (!vehiclesResponse.ok || !driversResponse.ok) {
        throw new Error(
          vehiclesData.message || driversData.message || "Could not load available vehicles and drivers",
        );
      }

      setVehicles(vehiclesData.vehicles || []);
      setDrivers(driversData.drivers || []);
    } catch (error) {
      setMessage(error.message || "Could not load available vehicles and drivers");
    } finally {
      setLoadingResources(false);
    }
  };

  const openAssignmentForm = async (trip) => {
    setAssignmentTrip(trip);
    setAssignmentForm({
      vehicleId: trip.vehicleId?._id || "",
      driverId: trip.driverId?._id || "",
      customerName: trip.customerName || "",
      customerEmail: trip.customerEmail || "",
    });
    setLoadingResources(true);
    try {
      const token = localStorage.getItem("token");
      const [vehicleResponse, driverResponse] = await Promise.all([
        fetch(`${API_URL}/vehicles`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/drivers`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [vehicleData, driverData] = await Promise.all([vehicleResponse.json(), driverResponse.json()]);
      if (!vehicleResponse.ok || !driverResponse.ok) throw new Error(vehicleData.message || driverData.message || "Could not load available resources");
      setVehicles(vehicleData.vehicles || []);
      setDrivers(driverData.drivers || []);
    } catch (error) {
      setMessage(error.message || "Could not load available vehicles and drivers");
      setAssignmentTrip(null);
    } finally {
      setLoadingResources(false);
    }
  };

  const saveAssignment = async (event) => {
    event.preventDefault();
    setSavingAssignment(true);
    try {
      const response = await fetch(`${API_URL}/trips/${assignmentTrip._id}/assignment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify(assignmentForm),
      });
      const data = await response.json().catch(() => null);
      if (!data) throw new Error(`Trip API returned HTTP ${response.status} without JSON. Check Vercel Function logs for the active API backend.`);
      if (!response.ok) throw new Error(data.message || "Could not assign this delivery");
      setTrips((current) => current.map((trip) => trip._id === assignmentTrip._id ? data.trip : trip));
      setAssignmentTrip(null);
      setMessage("Vehicle and driver assigned to delivery.");
    } catch (error) {
      setMessage(error.message || "Could not assign this delivery");
    } finally {
      setSavingAssignment(false);
    }
  };

  const submitDelivery = async (event) => {
    event.preventDefault();
    setSavingDelivery(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/trips`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...deliveryForm,
          distance: Number(deliveryForm.distance || 0),
          startTime: deliveryForm.startTime
            ? new Date(deliveryForm.startTime).toISOString()
            : undefined,
          customerName: deliveryForm.customerName,
          customerEmail: deliveryForm.customerEmail.trim().toLowerCase(),
        }),
      });
      const data = await response.json().catch(() => null);
      if (!data) throw new Error(`Trip API returned HTTP ${response.status} without JSON. Check Vercel Function logs for the active API backend.`);

      if (!response.ok) {
        throw new Error(data.message || "Could not create delivery");
      }

      setTrips((currentTrips) => [data.trip, ...currentTrips]);
      setShowCreateForm(false);
      setDeliveryForm({
        vehicleId: "",
        driverId: "",
        source: "",
        destination: "",
        cargoDetails: "",
        distance: "",
        startTime: "",
        customerName: "",
        customerEmail: "",
      });
      setMessage("Delivery created and vehicle and driver reserved.");
      window.setTimeout(() => setMessage(""), 4000);
    } catch (error) {
      setMessage(error.message || "Could not create delivery");
    } finally {
      setSavingDelivery(false);
    }
  };

  const submitRequest = async (event) => {
    event.preventDefault(); setSavingDelivery(true); setMessage("");
    try {
      const response = await fetch(`${API_URL}/trips/request`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` }, body: JSON.stringify(requestForm) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not send request");
      setTrips((current) => [data.trip, ...current]); setShowRequestForm(false);
      setRequestForm({ source: "", destination: "", cargoDetails: "", startTime: "" });
      setMessage("Request sent. Your fleet manager has been notified.");
    } catch (error) { setMessage(error.message || "Could not send request"); }
    finally { setSavingDelivery(false); }
  };

  // ==========================================
  // UPDATE TRIP STATUS
  // ==========================================
  const updateStatus = async (tripId, newStatus) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/trips/${tripId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json().catch(() => null);
      if (!data) throw new Error(`Trip API returned HTTP ${response.status} without JSON. Check Vercel Function logs for the active API backend.`);

      if (response.ok) {
        setTrips((currentTrips) =>
          currentTrips.map((trip) =>
            trip._id === tripId
              ? {
                  ...trip,
                  status: newStatus,
                  endTime:
                    newStatus === "Completed"
                      ? new Date().toISOString()
                      : trip.endTime,
                }
              : trip
          )
        );

        setMessage("Trip status updated successfully");

        setTimeout(() => {
          setMessage("");
        }, 3000);
      } else {
        setMessage(data.message || "Failed to update trip status");
      }
    } catch (error) {
      setMessage(error instanceof TypeError ? "Could not reach the trip API. Check the Vercel function deployment and MongoDB environment settings." : error.message || "Could not update delivery status");
    }
  };

  // ==========================================
  // CANCEL TRIP
  // ==========================================
  const cancelTrip = async (tripId) => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this trip?"
    );

    if (!confirmCancel) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/trips/${tripId}/cancel`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => null);
      if (!data) throw new Error(`Trip API returned HTTP ${response.status} without JSON. Check Vercel Function logs for the active API backend.`);

      if (response.ok) {
        setTrips((currentTrips) =>
          currentTrips.map((trip) =>
            trip._id === tripId
              ? {
                  ...trip,
                  status: "Cancelled",
                }
              : trip
          )
        );

        setMessage("Trip cancelled successfully");

        setTimeout(() => {
          setMessage("");
        }, 3000);
      } else {
        setMessage(data.message || "Failed to cancel trip");
      }
    } catch (error) {
      setMessage(error instanceof TypeError ? "Could not reach the trip API. Check the Vercel function deployment and MongoDB environment settings." : error.message || "Could not cancel delivery");
    }
  };

  // ==========================================
  // SEARCH AND FILTER
  // ==========================================
  const filteredTrips = trips.filter((trip) => {
    const searchText = search.toLowerCase().trim();

    const source =
      trip.source?.toLowerCase() || "";

    const destination =
      trip.destination?.toLowerCase() || "";

    const vehicleNumber =
      trip.vehicleId?.vehicleNumber?.toLowerCase() || "";

    const driverName =
      trip.driverId?.name?.toLowerCase() || "";

    const matchesSearch =
      source.includes(searchText) ||
      destination.includes(searchText) ||
      vehicleNumber.includes(searchText) ||
      driverName.includes(searchText);

    const matchesStatus =
      statusFilter === "All" ||
      trip.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeVehicleIds = new Set(
    trips
      .filter((trip) => ["Scheduled", "In Progress"].includes(trip.status))
      .map((trip) => String(trip.vehicleId?._id || trip.vehicleId)),
  );
  const activeDriverIds = new Set(
    trips
      .filter((trip) => ["Scheduled", "In Progress"].includes(trip.status))
      .map((trip) => String(trip.driverId?._id || trip.driverId)),
  );
  const availableVehicles = vehicles.filter(
    (vehicle) => vehicle.status === "Available" && !activeVehicleIds.has(String(vehicle._id)),
  );
  const selectedVehicle = vehicles.find(
    (vehicle) => vehicle._id === deliveryForm.vehicleId,
  );
  const availableDrivers = drivers.filter((driver) => {
    if (activeDriverIds.has(String(driver._id))) return false;
    if (!["Available", "Assigned"].includes(driver.status)) return false;

    const linkedVehicle = vehicles.find(
      (vehicle) =>
        String(vehicle.driverId?._id || vehicle.driverId || "") === String(driver._id) ||
        String(driver.assignedVehicle?._id || driver.assignedVehicle || "") === String(vehicle._id),
    );

    if (linkedVehicle && linkedVehicle._id !== selectedVehicle?._id) return false;
    if (driver.status === "Assigned" && linkedVehicle?._id !== selectedVehicle?._id) return false;
    if (selectedVehicle?.driverId && String(selectedVehicle.driverId?._id || selectedVehicle.driverId) !== String(driver._id)) return false;

    return true;
  });

  // ==========================================
  // FORMAT DATE
  // ==========================================
  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleString();
  };

  // ==========================================
  // STATUS COUNTS
  // ==========================================
  const scheduledTrips = trips.filter(
    (trip) => trip.status === "Scheduled"
  ).length;

  const inProgressTrips = trips.filter(
    (trip) => trip.status === "In Progress"
  ).length;

  const completedTrips = trips.filter(
    (trip) => trip.status === "Completed"
  ).length;

  return (
    <div className="deliveries-page">

      {/* ==========================================
          PAGE HEADER
      ========================================== */}
      <div className="delivery-page-header">
        <div>
          <p className="delivery-eyebrow">Fleet operations</p>
          <h1>
          Deliveries
          </h1>

        <p className="delivery-page-description">
          Manage and monitor fleet trips
        </p>
        </div>
        <div className="delivery-header-actions">
          {(isManager || isCustomer) && <button type="button" className="delivery-add-button" onClick={isCustomer ? () => setShowRequestForm(true) : openCreateForm}>
            <span aria-hidden="true">+</span> {isCustomer ? "Request a delivery" : "Add delivery"}
          </button>}
          <div className="delivery-live-indicator"><span></span>Trip overview</div>
        </div>
      </div>

      {/* ==========================================
          MESSAGE
      ========================================== */}
      {message && (
        <div className="delivery-message">
          {message}
        </div>
      )}

      {showCreateForm && (
        <div className="delivery-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowCreateForm(false)}>
          <section className="delivery-modal" role="dialog" aria-modal="true" aria-labelledby="delivery-form-title">
            <div className="delivery-modal-header">
              <div>
                <p className="delivery-eyebrow">New trip</p>
                <h2 id="delivery-form-title">Add delivery</h2>
              </div>
              <button type="button" className="delivery-modal-close" onClick={() => setShowCreateForm(false)} aria-label="Close">×</button>
            </div>

            {loadingResources ? (
              <p className="delivery-form-note">Loading available vehicles and drivers…</p>
            ) : (
              <form className="delivery-form" onSubmit={submitDelivery}>
                <label>
                  Source
                  <input required value={deliveryForm.source} onChange={(event) => setDeliveryForm({ ...deliveryForm, source: event.target.value })} placeholder="Pickup location" />
                </label>
                <label>
                  Destination
                  <input required value={deliveryForm.destination} onChange={(event) => setDeliveryForm({ ...deliveryForm, destination: event.target.value })} placeholder="Delivery location" />
                </label>
                <label>
                  Customer name
                  <input value={deliveryForm.customerName} onChange={(event) => setDeliveryForm({ ...deliveryForm, customerName: event.target.value })} placeholder="Optional" />
                </label>
                <label>
                  Customer email for updates
                  <input type="email" required value={deliveryForm.customerEmail} onChange={(event) => setDeliveryForm({ ...deliveryForm, customerEmail: event.target.value })} placeholder="customer@example.com" />
                </label>
                <label>
                  Vehicle
                  <select required value={deliveryForm.vehicleId} onChange={(event) => setDeliveryForm({ ...deliveryForm, vehicleId: event.target.value, driverId: "" })}>
                    <option value="">Select an available vehicle</option>
                    {availableVehicles.map((vehicle) => <option key={vehicle._id} value={vehicle._id}>{vehicle.vehicleNumber} · {vehicle.vehicleType}</option>)}
                  </select>
                </label>
                <label>
                  Driver
                  <select required value={deliveryForm.driverId} onChange={(event) => setDeliveryForm({ ...deliveryForm, driverId: event.target.value })} disabled={!selectedVehicle}>
                    <option value="">{selectedVehicle ? "Select an available driver" : "Select a vehicle first"}</option>
                    {availableDrivers.map((driver) => <option key={driver._id} value={driver._id}>{driver.name} · {driver.phone}</option>)}
                  </select>
                </label>
                {selectedVehicle && availableDrivers.length === 0 && <p className="delivery-form-note">No available driver can be assigned to this vehicle.</p>}
                {availableVehicles.length === 0 && <p className="delivery-form-note">There are no available vehicles for a new delivery.</p>}
                <label>
                  Cargo details
                  <input value={deliveryForm.cargoDetails} onChange={(event) => setDeliveryForm({ ...deliveryForm, cargoDetails: event.target.value })} placeholder="Optional" />
                </label>
                <label>
                  Distance (km)
                  <input type="number" min="0" step="any" value={deliveryForm.distance} onChange={(event) => setDeliveryForm({ ...deliveryForm, distance: event.target.value })} placeholder="0" />
                </label>
                <label>
                  Start time
                  <input type="datetime-local" value={deliveryForm.startTime} onChange={(event) => setDeliveryForm({ ...deliveryForm, startTime: event.target.value })} />
                </label>
                <div className="delivery-form-actions">
                  <button type="button" className="delivery-form-cancel" onClick={() => setShowCreateForm(false)}>Cancel</button>
                  <button type="submit" className="delivery-add-button" disabled={savingDelivery || loadingResources || !availableVehicles.length}>
                    {savingDelivery ? "Saving…" : "Save delivery"}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      {showRequestForm && <div className="delivery-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowRequestForm(false)}><section className="delivery-modal" role="dialog" aria-modal="true"><div className="delivery-modal-header"><div><p className="delivery-eyebrow">Customer order</p><h2>Request a delivery</h2></div><button type="button" className="delivery-modal-close" onClick={() => setShowRequestForm(false)} aria-label="Close">×</button></div><form className="delivery-form" onSubmit={submitRequest}><label>Pickup location<input required value={requestForm.source} onChange={(event) => setRequestForm({ ...requestForm, source: event.target.value })} /></label><label>Delivery location<input required value={requestForm.destination} onChange={(event) => setRequestForm({ ...requestForm, destination: event.target.value })} /></label><label>What are we delivering?<input value={requestForm.cargoDetails} onChange={(event) => setRequestForm({ ...requestForm, cargoDetails: event.target.value })} /></label><label>Preferred pickup time<input type="datetime-local" value={requestForm.startTime} onChange={(event) => setRequestForm({ ...requestForm, startTime: event.target.value })} /></label><p className="delivery-form-note">The fleet manager will confirm the driver, vehicle, and schedule.</p><div className="delivery-form-actions"><button type="button" className="delivery-form-cancel" onClick={() => setShowRequestForm(false)}>Cancel</button><button type="submit" className="delivery-add-button" disabled={savingDelivery}>{savingDelivery ? "Sending…" : "Send request"}</button></div></form></section></div>}

      {assignmentTrip && (
        <div className="delivery-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setAssignmentTrip(null)}>
          <section className="delivery-modal" role="dialog" aria-modal="true" aria-labelledby="assignment-title">
            <div className="delivery-modal-header"><div><p className="delivery-eyebrow">Delivery setup</p><h2 id="assignment-title">Resources and customer</h2></div><button type="button" className="delivery-modal-close" onClick={() => setAssignmentTrip(null)} aria-label="Close">×</button></div>
            {loadingResources ? <p className="delivery-form-note">Loading available vehicles and drivers…</p> : (
              <form className="delivery-form" onSubmit={saveAssignment}>
                <label>Vehicle<select required={!assignmentTrip.vehicleId?._id || assignmentTrip.vehicleId?.vehicleNumber === "Vehicle record unavailable"} value={assignmentForm.vehicleId} onChange={(event) => setAssignmentForm({ ...assignmentForm, vehicleId: event.target.value, driverId: "" })}><option value="">Choose available vehicle</option>{vehicles.filter((vehicle) => vehicle.status === "Available" || vehicle._id === assignmentForm.vehicleId).map((vehicle) => <option key={vehicle._id} value={vehicle._id}>{vehicle.vehicleNumber} · {vehicle.vehicleType}</option>)}</select></label>
                <label>Driver<select required={!assignmentTrip.driverId?._id || assignmentTrip.driverId?.name === "Driver record unavailable"} disabled={!assignmentForm.vehicleId} value={assignmentForm.driverId} onChange={(event) => setAssignmentForm({ ...assignmentForm, driverId: event.target.value })}><option value="">Choose available driver</option>{drivers.filter((driver) => driver.status === "Available" || driver._id === assignmentForm.driverId || (driver.status === "Assigned" && String(driver.assignedVehicle?._id || driver.assignedVehicle) === assignmentForm.vehicleId)).map((driver) => <option key={driver._id} value={driver._id}>{driver.name} · {driver.phone}</option>)}</select></label>
                <label>Customer name<input value={assignmentForm.customerName} onChange={(event) => setAssignmentForm({ ...assignmentForm, customerName: event.target.value })} /></label>
                <label>Customer email for portal updates<input type="email" value={assignmentForm.customerEmail} onChange={(event) => setAssignmentForm({ ...assignmentForm, customerEmail: event.target.value })} placeholder="customer@example.com" /></label>
                <div className="delivery-form-actions"><button type="button" className="delivery-form-cancel" onClick={() => setAssignmentTrip(null)}>Cancel</button><button type="submit" className="delivery-add-button" disabled={savingAssignment || loadingResources}>{savingAssignment ? "Assigning…" : "Save assignment"}</button></div>
              </form>
            )}
          </section>
        </div>
      )}

      {/* ==========================================
          SUMMARY CARDS
      ========================================== */}
      <div className="delivery-summary-grid">

        {/* Total */}
        <div className="delivery-stat-card delivery-stat-total">
          <p className="delivery-stat-label">
            Total Trips
          </p>

          <h2 className="delivery-stat-value">
            {trips.length}
          </h2>
        </div>

        {/* Scheduled */}
        <div className="delivery-stat-card delivery-stat-scheduled">
          <p className="delivery-stat-label">
            Scheduled
          </p>

          <h2 className="delivery-stat-value">
            {scheduledTrips}
          </h2>
        </div>

        {/* In Progress */}
        <div className="delivery-stat-card delivery-stat-progress">
          <p className="delivery-stat-label">
            In Progress
          </p>

          <h2 className="delivery-stat-value">
            {inProgressTrips}
          </h2>
        </div>

        {/* Completed */}
        <div className="delivery-stat-card delivery-stat-completed">
          <p className="delivery-stat-label">
            Completed
          </p>

          <h2 className="delivery-stat-value">
            {completedTrips}
          </h2>
        </div>

      </div>

      {/* ==========================================
          SEARCH AND FILTER
      ========================================== */}
      <div className="delivery-filter-panel">

        <div className="delivery-filter-controls">

          {/* Search */}
          <div className="delivery-search-wrap">
            <input
              type="text"
              placeholder="Search source, destination, vehicle or driver..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="delivery-search-input"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="delivery-status-select"
            >
              <option value="All">
                All Status
              </option>

              <option value="Scheduled">
                Scheduled
              </option>

              <option value="In Progress">
                In Progress
              </option>

              <option value="Completed">
                Completed
              </option>

              <option value="Cancelled">
                Cancelled
              </option>
            </select>
          </div>

        </div>

      </div>

      {/* ==========================================
          LOADING
      ========================================== */}
      {loading && (
        <div className="delivery-loading">
          <p>
            Loading trips...
          </p>
        </div>
      )}

      {/* ==========================================
          TRIPS TABLE
      ========================================== */}
      {!loading && (
        <div className="delivery-table-panel">

          <div className="delivery-table-scroll">

            <table className="delivery-table">

              {/* TABLE HEADER */}
              <thead>

                <tr>

                  <th>
                    Vehicle
                  </th>

                  <th>
                    Driver
                  </th>

                  <th>
                    Route
                  </th>

                  <th>
                    Cargo
                  </th>

                  <th>
                    Distance
                  </th>

                  <th>
                    Start Time
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>

              {/* TABLE BODY */}
              <tbody>

                {filteredTrips.length === 0 ? (

                  <tr>

                    <td
                      colSpan="8"
                      className="delivery-empty-state"
                    >
                      No trips found
                    </td>

                  </tr>

                ) : (

                  filteredTrips.map((trip) => (

                    <tr
                      key={trip._id}
                      className="delivery-table-row"
                    >

                      {/* ==================================
                          VEHICLE
                      ================================== */}
                      <td className="px-5 py-4">

                        <div className="font-medium text-gray-800">
                          {trip.vehicleId?.vehicleNumber || "Vehicle details unavailable"}
                        </div>

                        <div className="text-sm text-gray-500">
                          {trip.vehicleId?.vehicleType || ""}
                        </div>

                      </td>

                      {/* ==================================
                          DRIVER
                      ================================== */}
                      <td className="px-5 py-4">

                        <div className="font-medium text-gray-800">
                          {trip.driverId?.name || "Driver details unavailable"}
                        </div>

                        <div className="text-sm text-gray-500">
                          {trip.driverId?.phone || ""}
                        </div>

                      </td>

                      {/* ==================================
                          ROUTE
                      ================================== */}
                      <td className="px-5 py-4">

                        <div className="font-medium text-gray-800">
                          {trip.source || "-"}
                        </div>

                        <div className="text-sm text-gray-500 mt-1">
                          → {trip.destination || "-"}
                        </div>
                        {user.role === "customer" && (trip.currentLocation || Number.isFinite(trip.currentLatitude)) && (
                          <div className="small text-success mt-2">
                            <i className="bi bi-geo-alt-fill me-1"></i>
                            {trip.currentLocation || `${trip.currentLatitude}, ${trip.currentLongitude}`}
                          </div>
                        )}
                        {isManager && trip.customerEmail && (
                          <div className="small text-muted mt-2">Customer: {trip.customerName || trip.customerEmail}</div>
                        )}

                      </td>

                      {/* ==================================
                          CARGO
                      ================================== */}
                      <td className="px-5 py-4">

                        <span className="text-gray-700">
                          {trip.cargoDetails ||
                            "Not Specified"}
                        </span>

                      </td>

                      {/* ==================================
                          DISTANCE
                      ================================== */}
                      <td className="px-5 py-4">

                        <span className="text-gray-700">
                          {trip.distance || 0} km
                        </span>

                      </td>

                      {/* ==================================
                          START TIME
                      ================================== */}
                      <td className="px-5 py-4">

                        <span className="text-sm text-gray-600">
                          {formatDate(trip.startTime)}
                        </span>

                      </td>

                      {/* ==================================
                          STATUS
                      ================================== */}
                      <td className="px-5 py-4">

                        <span
                          className={`delivery-status-badge ${
                            trip.status === "Scheduled"
                              ? "status-scheduled"
                              : trip.status === "In Progress"
                              ? "status-progress"
                              : trip.status === "Completed"
                              ? "status-completed"
                              : "status-cancelled"
                          }`}
                        >
                          {trip.status}
                        </span>

                      </td>

                      {/* ==================================
                          ACTIONS
                      ================================== */}
                      <td className="px-5 py-4">

                        <div className="delivery-actions">

                          {/* START */}
                          {isManager && ["Requested", "Scheduled"].includes(trip.status) && (trip.status === "Requested" || !trip.vehicleId?._id || !trip.driverId?._id || trip.vehicleId?.vehicleNumber === "Vehicle record unavailable" || trip.driverId?.name === "Driver record unavailable" || !trip.customerEmail) && (
                            <button onClick={() => openAssignmentForm(trip)} className="delivery-action-button delivery-action-start">{trip.customerEmail ? "Assign" : "Link customer"}</button>
                          )}
                          {isDriver && trip.status === "Scheduled" && (
                            <button
                              onClick={() =>
                                updateStatus(
                                  trip._id,
                                  "In Progress"
                                )
                              }
                              className="delivery-action-button delivery-action-start"
                            >
                              Start
                            </button>
                          )}

                          {/* COMPLETE */}
                          {isDriver && trip.status === "In Progress" && (
                            <button
                              onClick={() =>
                                updateStatus(
                                  trip._id,
                                  "Completed"
                                )
                              }
                              className="delivery-action-button delivery-action-complete"
                            >
                              Complete
                            </button>
                          )}

                          {/* CANCEL */}
                          {isManager && trip.status !== "Completed" &&
                            trip.status !== "Cancelled" && (
                              <button
                                onClick={() =>
                                  cancelTrip(trip._id)
                                }
                                className="delivery-action-button delivery-action-cancel"
                              >
                                Cancel
                              </button>
                            )}

                          {/* NO ACTION */}
                          {(trip.status === "Completed" ||
                            trip.status === "Cancelled") && (
                            <span className="delivery-no-action">
                              No action
                            </span>
                          )}

                        </div>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </div>
      )}

      {/* ==========================================
          RESULT COUNT
      ========================================== */}
      {!loading && filteredTrips.length > 0 && (
        <div className="delivery-result-count">
          Showing {filteredTrips.length} of {trips.length} trips
        </div>
      )}

    </div>
  );
}

export default Deliveries;
