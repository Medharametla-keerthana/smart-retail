import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

function Vehicles() {
  const [vehicles, setVehicles] = useState([
    {
      id: "VH-001",
      name: "Tata Prima 5530",
      type: "Heavy Truck",
      driver: "Raj Kumar",
      status: "Active",
    },
    {
      id: "VH-002",
      name: "Ashok Leyland 4825",
      type: "Container Truck",
      driver: "Amit Sharma",
      status: "Active",
    },
    {
      id: "VH-003",
      name: "Mahindra Blazo X",
      type: "Cargo Truck",
      driver: "Vijay Singh",
      status: "Maintenance",
    },
    {
      id: "VH-004",
      name: "Eicher Pro 6048",
      type: "Heavy Truck",
      driver: "Suresh Patel",
      status: "Available",
    },
    {
      id: "VH-005",
      name: "BharatBenz 3528",
      type: "Cargo Truck",
      driver: "Not Assigned",
      status: "Inactive",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [newVehicle, setNewVehicle] = useState({
    name: "",
    type: "",
    driver: "",
    status: "Available",
  });

  const [editVehicle, setEditVehicle] = useState({
    id: "",
    name: "",
    type: "",
    driver: "",
    status: "",
  });

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function handleInputChange(event) {
    const { name, value } = event.target;

    setNewVehicle({
      ...newVehicle,
      [name]: value,
    });
  }

  function handleAddVehicle(event) {
    event.preventDefault();

    const vehicle = {
      id: `VH-${String(vehicles.length + 1).padStart(3, "0")}`,
      name: newVehicle.name,
      type: newVehicle.type,
      driver: newVehicle.driver || "Not Assigned",
      status: newVehicle.status,
    };

    setVehicles([...vehicles, vehicle]);

    setNewVehicle({
      name: "",
      type: "",
      driver: "",
      status: "Available",
    });

    setShowAddModal(false);
  }

  function handleView(vehicle) {
    setSelectedVehicle(vehicle);
    setShowViewModal(true);
  }

  function handleEditClick(vehicle) {
    setEditVehicle({ ...vehicle });
    setShowEditModal(true);
  }

  function handleEditChange(event) {
    const { name, value } = event.target;

    setEditVehicle({
      ...editVehicle,
      [name]: value,
    });
  }

  function handleUpdateVehicle(event) {
    event.preventDefault();

    setVehicles(
      vehicles.map((vehicle) =>
        vehicle.id === editVehicle.id ? editVehicle : vehicle
      )
    );

    setShowEditModal(false);
  }

  function handleDelete(id) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this vehicle?"
    );

    if (confirmDelete) {
      setVehicles(
        vehicles.filter((vehicle) => vehicle.id !== id)
      );
    }
  }

  function getStatusClass(status) {
    if (status === "Active") return "bg-success";

    if (status === "Maintenance") {
      return "bg-warning text-dark";
    }

    if (status === "Available") return "bg-primary";

    return "bg-secondary";
  }

  return (
    <DashboardLayout>

      {/* PAGE HEADER */}

      <div className="d-flex justify-content-between align-items-center mb-4">

        <div>
          <h1 className="fw-bold mb-1">
            Vehicle Management
          </h1>

          <p className="text-muted mb-0">
            Manage and monitor your fleet vehicles.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <i className="bi bi-plus-lg me-2"></i>
          Add Vehicle
        </button>

      </div>


      {/* STATISTICS */}

      <div className="row g-4 mb-4">

        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">

              <p className="text-muted mb-1">
                Total Vehicles
              </p>

              <h3 className="fw-bold mb-0">
                {vehicles.length}
              </h3>

            </div>
          </div>
        </div>


        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">

              <p className="text-muted mb-1">
                Active
              </p>

              <h3 className="fw-bold text-success mb-0">
                {
                  vehicles.filter(
                    (v) => v.status === "Active"
                  ).length
                }
              </h3>

            </div>
          </div>
        </div>


        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">

              <p className="text-muted mb-1">
                Maintenance
              </p>

              <h3 className="fw-bold text-warning mb-0">
                {
                  vehicles.filter(
                    (v) => v.status === "Maintenance"
                  ).length
                }
              </h3>

            </div>
          </div>
        </div>


        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">

              <p className="text-muted mb-1">
                Available
              </p>

              <h3 className="fw-bold text-primary mb-0">
                {
                  vehicles.filter(
                    (v) => v.status === "Available"
                  ).length
                }
              </h3>

            </div>
          </div>
        </div>

      </div>


      {/* VEHICLE TABLE */}

      <div className="card border-0 shadow-sm">

        <div className="card-body">

          <div className="row mb-4">

            <div className="col-md-5">

              <div className="input-group">

                <span className="input-group-text bg-white">
                  <i className="bi bi-search"></i>
                </span>

                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by vehicle name or ID..."
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(e.target.value)
                  }
                />

              </div>

            </div>

          </div>


          <div className="table-responsive">

            <table className="table align-middle">

              <thead className="table-light">

                <tr>
                  <th>Vehicle ID</th>
                  <th>Vehicle Name</th>
                  <th>Type</th>
                  <th>Assigned Driver</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>

              </thead>


              <tbody>

                {filteredVehicles.map((vehicle) => (

                  <tr key={vehicle.id}>

                    <td className="fw-semibold">
                      {vehicle.id}
                    </td>

                    <td>{vehicle.name}</td>

                    <td>{vehicle.type}</td>

                    <td>{vehicle.driver}</td>

                    <td>

                      <span
                        className={`badge ${getStatusClass(
                          vehicle.status
                        )}`}
                      >
                        {vehicle.status}
                      </span>

                    </td>


                    <td>

                      <div className="d-flex gap-2">

                        {/* VIEW */}

                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleView(vehicle)}
                          title="View"
                        >
                          <i className="bi bi-eye"></i>
                        </button>


                        {/* EDIT */}

                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={() =>
                            handleEditClick(vehicle)
                          }
                          title="Edit"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>


                        {/* DELETE */}

                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() =>
                            handleDelete(vehicle.id)
                          }
                          title="Delete"
                        >
                          <i className="bi bi-trash"></i>
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}


                {filteredVehicles.length === 0 && (

                  <tr>

                    <td
                      colSpan="6"
                      className="text-center text-muted py-4"
                    >
                      No vehicles found.
                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>


      {/* ADD VEHICLE MODAL */}

      {showAddModal && (

        <div className="modal-overlay">

          <div className="modal-box">

            <div className="d-flex justify-content-between align-items-center mb-4">

              <h4 className="fw-bold mb-0">
                Add New Vehicle
              </h4>

              <button
                className="btn-close"
                onClick={() =>
                  setShowAddModal(false)
                }
              ></button>

            </div>


            <form onSubmit={handleAddVehicle}>

              <VehicleForm
                vehicle={newVehicle}
                onChange={handleInputChange}
              />

              <div className="d-flex justify-content-end gap-2">

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    setShowAddModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Add Vehicle
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* VIEW VEHICLE MODAL */}

      {showViewModal && selectedVehicle && (

        <div className="modal-overlay">

          <div className="modal-box">

            <div className="d-flex justify-content-between align-items-center mb-4">

              <h4 className="fw-bold mb-0">
                Vehicle Details
              </h4>

              <button
                className="btn-close"
                onClick={() =>
                  setShowViewModal(false)
                }
              ></button>

            </div>


            <div className="vehicle-details">

              <p>
                <strong>Vehicle ID:</strong>{" "}
                {selectedVehicle.id}
              </p>

              <p>
                <strong>Vehicle Name:</strong>{" "}
                {selectedVehicle.name}
              </p>

              <p>
                <strong>Vehicle Type:</strong>{" "}
                {selectedVehicle.type}
              </p>

              <p>
                <strong>Assigned Driver:</strong>{" "}
                {selectedVehicle.driver}
              </p>

              <p>
                <strong>Status:</strong>{" "}

                <span
                  className={`badge ${getStatusClass(
                    selectedVehicle.status
                  )}`}
                >
                  {selectedVehicle.status}
                </span>

              </p>

            </div>


            <div className="text-end">

              <button
                className="btn btn-secondary"
                onClick={() =>
                  setShowViewModal(false)
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}


      {/* EDIT VEHICLE MODAL */}

      {showEditModal && (

        <div className="modal-overlay">

          <div className="modal-box">

            <div className="d-flex justify-content-between align-items-center mb-4">

              <h4 className="fw-bold mb-0">
                Edit Vehicle
              </h4>

              <button
                className="btn-close"
                onClick={() =>
                  setShowEditModal(false)
                }
              ></button>

            </div>


            <form onSubmit={handleUpdateVehicle}>

              <VehicleForm
                vehicle={editVehicle}
                onChange={handleEditChange}
              />

              <div className="d-flex justify-content-end gap-2">

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    setShowEditModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-success"
                >
                  Update Vehicle
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </DashboardLayout>
  );
}


/* REUSABLE VEHICLE FORM */

function VehicleForm({ vehicle, onChange }) {
  return (
    <>
      <div className="mb-3">

        <label className="form-label">
          Vehicle Name
        </label>

        <input
          type="text"
          name="name"
          className="form-control"
          value={vehicle.name}
          onChange={onChange}
          required
        />

      </div>


      <div className="mb-3">

        <label className="form-label">
          Vehicle Type
        </label>

        <select
          name="type"
          className="form-select"
          value={vehicle.type}
          onChange={onChange}
          required
        >

          <option value="">
            Select vehicle type
          </option>

          <option value="Heavy Truck">
            Heavy Truck
          </option>

          <option value="Cargo Truck">
            Cargo Truck
          </option>

          <option value="Container Truck">
            Container Truck
          </option>

          <option value="Mini Truck">
            Mini Truck
          </option>

        </select>

      </div>


      <div className="mb-3">

        <label className="form-label">
          Assigned Driver
        </label>

        <input
          type="text"
          name="driver"
          className="form-control"
          value={vehicle.driver}
          onChange={onChange}
        />

      </div>


      <div className="mb-4">

        <label className="form-label">
          Status
        </label>

        <select
          name="status"
          className="form-select"
          value={vehicle.status}
          onChange={onChange}
        >

          <option value="Available">
            Available
          </option>

          <option value="Active">
            Active
          </option>

          <option value="Maintenance">
            Maintenance
          </option>

          <option value="Inactive">
            Inactive
          </option>

        </select>

      </div>
    </>
  );
}

export default Vehicles;