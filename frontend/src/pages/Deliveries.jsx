import { useEffect, useState } from "react";
import "./Deliveries.css";

const API_URL = "/api";

function Deliveries() {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
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
        }),
      });
      const data = await response.json();

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
      });
      setMessage("Delivery created and vehicle and driver reserved.");
      window.setTimeout(() => setMessage(""), 4000);
    } catch (error) {
      setMessage(error.message || "Could not create delivery");
    } finally {
      setSavingDelivery(false);
    }
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

      const data = await response.json();

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
    } catch {
      setMessage("Unable to connect to backend");
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

      const data = await response.json();

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
    } catch {
      setMessage("Unable to connect to backend");
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
          <button type="button" className="delivery-add-button" onClick={openCreateForm}>
            <span aria-hidden="true">+</span> Add delivery
          </button>
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
                          {trip.vehicleId?.vehicleNumber || "-"}
                        </div>

                        <div className="text-sm text-gray-500">
                          {trip.vehicleId?.vehicleType || "-"}
                        </div>

                      </td>

                      {/* ==================================
                          DRIVER
                      ================================== */}
                      <td className="px-5 py-4">

                        <div className="font-medium text-gray-800">
                          {trip.driverId?.name || "-"}
                        </div>

                        <div className="text-sm text-gray-500">
                          {trip.driverId?.phone || "-"}
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
                          {trip.status === "Scheduled" && (
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
                          {trip.status === "In Progress" && (
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
                          {trip.status !== "Completed" &&
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
