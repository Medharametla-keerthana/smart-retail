const Vehicle = require("../models/Vehicle");

// ==========================================
// 1. CREATE VEHICLE
// ==========================================

const createVehicle = async (req, res) => {
  try {
    const {
      vehicleNumber,
      vehicleType,
      model,
      capacity,
      status,
      currentLocation,
    } = req.body;

    // Check required fields
    if (!vehicleNumber || !vehicleType || !model) {
      return res.status(400).json({
        success: false,
        message: "Vehicle number, vehicle type and model are required",
      });
    }

    // Check duplicate vehicle number
    const existingVehicle = await Vehicle.findOne({
      vehicleNumber,
    });

    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: "Vehicle with this number already exists",
      });
    }

    const vehicle = await Vehicle.create({
      vehicleNumber,
      vehicleType,
      model,
      capacity,
      status: status || "Available",
      currentLocation: currentLocation || "Unknown",
      driverId: null,
    });

    res.status(201).json({
      success: true,
      message: "Vehicle created successfully",
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
// 2. GET ALL VEHICLES
// ==========================================

const getAllVehicles = async (req, res) => {
  try {
    const filter = req.user.role === "driver" ? { _id: req.driver?.assignedVehicle } : {};
    const vehicles = await Vehicle.find(filter).populate(
      "driverId",
      "name email phone licenseNumber status currentLocation"
    );

    res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// 3. GET VEHICLE BY ID
// ==========================================

const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role === "driver" && String(req.driver?.assignedVehicle) !== String(id)) {
      return res.status(403).json({ success: false, message: "You can only view your assigned vehicle" });
    }

    const vehicle = await Vehicle.findById(id).populate(
      "driverId",
      "name email phone licenseNumber status currentLocation"
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Vehicle retrieved successfully",
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
// 4. UPDATE VEHICLE
// ==========================================

const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findById(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    const {
      vehicleNumber,
      vehicleType,
      model,
      capacity,
      status,
      currentLocation,
    } = req.body;

    if (vehicleNumber !== undefined) {
      vehicle.vehicleNumber = vehicleNumber;
    }

    if (vehicleType !== undefined) {
      vehicle.vehicleType = vehicleType;
    }

    if (model !== undefined) {
      vehicle.model = model;
    }

    if (capacity !== undefined) {
      vehicle.capacity = capacity;
    }

    if (status !== undefined) {
      vehicle.status = status;
    }

    if (currentLocation !== undefined) {
      vehicle.currentLocation = currentLocation;
    }

    await vehicle.save();

    res.status(200).json({
      success: true,
      message: "Vehicle updated successfully",
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
// 5. DELETE VEHICLE
// ==========================================

const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findById(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    await Vehicle.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// 6. SEARCH AND FILTER VEHICLES
// ==========================================

const searchVehicles = async (req, res) => {
  try {
    const { search, status, vehicleType } = req.query;

    const filter = {};

    // Search by vehicle number or model
    if (search) {
      filter.$or = [
        {
          vehicleNumber: {
            $regex: search,
            $options: "i",
          },
        },
        {
          model: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // Filter by vehicle type
    if (vehicleType) {
      filter.vehicleType = vehicleType;
    }

    const vehicles = await Vehicle.find(filter).populate(
      "driverId",
      "name email phone licenseNumber status currentLocation"
    );

    res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  searchVehicles,
};
