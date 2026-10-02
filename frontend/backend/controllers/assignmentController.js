const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const Trip = require("../models/Trip");

// ==========================================
// 1. ASSIGN DRIVER TO VEHICLE
// ==========================================

const assignDriverToVehicle = async (req, res) => {
  try {
    const { vehicleId, driverId } = req.body;

    // Check required fields
    if (!vehicleId || !driverId) {
      return res.status(400).json({
        success: false,
        message: "Vehicle ID and Driver ID are required",
      });
    }

    // Find vehicle
    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    // Find driver
    const driver = await Driver.findById(driverId);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    if (vehicle.status !== "Available" || driver.status !== "Available") {
      return res.status(400).json({
        success: false,
        message: "Only an available vehicle and driver can be assigned",
      });
    }

    const activeTrip = await Trip.findOne({
      status: { $in: ["Scheduled", "In Progress"] },
      $or: [{ vehicleId }, { driverId }],
    });

    if (activeTrip) {
      return res.status(400).json({
        success: false,
        message: "The vehicle or driver already has an active delivery",
      });
    }

    // Check if vehicle already has a driver
    if (vehicle.driverId) {
      return res.status(400).json({
        success: false,
        message: "A driver is already assigned to this vehicle",
      });
    }

    // Check if driver is already assigned
    const existingVehicle = await Vehicle.findOne({
      driverId: driverId,
    });

    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: "This driver is already assigned to another vehicle",
      });
    }

    // Assign driver to vehicle
    vehicle.driverId = driverId;

    await vehicle.save();

    // Update driver status
    driver.status = "Assigned";
    driver.assignedVehicle = vehicleId;

    await driver.save();

    // Get updated vehicle with driver details
    const updatedVehicle = await Vehicle.findById(vehicleId).populate(
      "driverId",
      "name email phone licenseNumber status currentLocation"
    );

    res.status(200).json({
      success: true,
      message: "Driver assigned to vehicle successfully",
      vehicle: updatedVehicle,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// 2. REMOVE DRIVER ASSIGNMENT
// ==========================================

const removeDriverAssignment = async (req, res) => {
  try {
    const { vehicleId } = req.body;

    // Check required field
    if (!vehicleId) {
      return res.status(400).json({
        success: false,
        message: "Vehicle ID is required",
      });
    }

    // Find vehicle
    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    // Check if driver is assigned
    if (!vehicle.driverId) {
      return res.status(400).json({
        success: false,
        message: "No driver is assigned to this vehicle",
      });
    }

    const activeTrip = await Trip.findOne({
      status: { $in: ["Scheduled", "In Progress"] },
      $or: [{ vehicleId }, { driverId: vehicle.driverId }],
    });

    if (activeTrip) {
      return res.status(400).json({
        success: false,
        message: "Cannot remove the driver while the vehicle has an active delivery",
      });
    }

    // Store driver ID before removing
    const driverId = vehicle.driverId;

    // Remove driver from vehicle
    vehicle.driverId = null;

    await vehicle.save();

    // Update driver status
    const driver = await Driver.findById(driverId);

    if (driver) {
      driver.status = "Available";
      driver.assignedVehicle = null;
      await driver.save();
    }

    res.status(200).json({
      success: true,
      message: "Driver removed from vehicle successfully",
      vehicle,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// 3. GET ASSIGNMENT DETAILS
// ==========================================

const getAssignmentDetails = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const vehicle = await Vehicle.findById(vehicleId).populate(
      "driverId",
      "name email phone licenseNumber status currentLocation"
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    if (!vehicle.driverId) {
      return res.status(404).json({
        success: false,
        message: "No driver assigned to this vehicle",
      });
    }

    res.status(200).json({
      success: true,
      message: "Assignment details retrieved successfully",
      vehicle,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  assignDriverToVehicle,
  removeDriverAssignment,
  getAssignmentDetails,
};
