const Location = require("../models/Location");
const Vehicle = require("../models/Vehicle");
const Trip = require("../models/Trip");

const canReadVehicle = async (req, vehicleId) => {
  if (req.user.role === "fleetManager") return true;
  if (req.user.role === "driver") return String(req.driver?.assignedVehicle) === String(vehicleId);
  return Boolean(await Trip.exists({ vehicleId, customerEmail: req.user.email.toLowerCase() }));
};


// Update Vehicle Location
const updateVehicleLocation = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const {
      latitude,
      longitude,
      locationName,
      speed,
    } = req.body;

    // Check required fields
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    // Check if vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    if (req.user.role === "driver" && String(vehicle.driverId) !== String(req.driver?._id)) {
      return res.status(403).json({ success: false, message: "You can only update your assigned vehicle location" });
    }

    // Save location in location history
    const location = await Location.create({
      vehicleId,
      latitude,
      longitude,
      locationName,
      speed,
    });

    // Update vehicle current location
    if (locationName) {
      vehicle.currentLocation = locationName;
    }

    const activeTrip = await Trip.findOne({ vehicleId, status: { $in: ["Scheduled", "In Progress"] } });
    if (activeTrip) {
      activeTrip.currentLatitude = Number(latitude);
      activeTrip.currentLongitude = Number(longitude);
      if (locationName) activeTrip.currentLocation = locationName;
      await activeTrip.save();
    }
    await vehicle.save();

    res.status(201).json({
      success: true,
      message: "Vehicle location updated successfully",
      location,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Get Current Vehicle Location
const getCurrentLocation = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    // Check vehicle
    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    if (!(await canReadVehicle(req, vehicleId))) return res.status(403).json({ success: false, message: "You cannot view this vehicle location" });

    // Get latest location
    const location = await Location.findOne({
      vehicleId,
    }).sort({
      recordedAt: -1,
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "No location data found for this vehicle",
      });
    }

    res.status(200).json({
      success: true,
      message: "Current location retrieved successfully",
      location,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Get Vehicle Location History
const getLocationHistory = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    // Check vehicle
    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    if (!(await canReadVehicle(req, vehicleId))) return res.status(403).json({ success: false, message: "You cannot view this vehicle location history" });

    // Get all location history
    const locations = await Location.find({
      vehicleId,
    }).sort({
      recordedAt: -1,
    });

    res.status(200).json({
      success: true,
      count: locations.length,
      locations,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


module.exports = {
  updateVehicleLocation,
  getCurrentLocation,
  getLocationHistory,
};
