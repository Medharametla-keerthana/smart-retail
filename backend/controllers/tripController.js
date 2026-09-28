const Trip = require("../models/Trip");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");

// Create Trip
const createTrip = async (req, res) => {
  try {
    const {
      vehicleId,
      driverId,
      source,
      destination,
      cargoDetails,
      distance,
      startTime,
    } = req.body;

    if (!vehicleId || !driverId || !source || !destination) {
      return res.status(400).json({
        success: false,
        message:
          "Vehicle ID, Driver ID, source and destination are required",
      });
    }

    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    const driver = await Driver.findById(driverId);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    if (
      !vehicle.driverId ||
      vehicle.driverId.toString() !== driverId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This driver is not assigned to the selected vehicle",
      });
    }

    const trip = await Trip.create({
      vehicleId,
      driverId,
      source,
      destination,
      cargoDetails,
      distance,
      startTime,
      status: "Scheduled",
    });

    res.status(201).json({
      success: true,
      message: "Trip created successfully",
      trip,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Get All Trips
const getAllTrips = async (req, res) => {
  try {
    const trips = await Trip.find()
      .populate(
        "vehicleId",
        "vehicleNumber vehicleType model status currentLocation"
      )
      .populate(
        "driverId",
        "name email phone licenseNumber status currentLocation"
      );

    res.status(200).json({
      success: true,
      count: trips.length,
      trips,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Get Single Trip by ID
const getTripById = async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await Trip.findById(id)
      .populate(
        "vehicleId",
        "vehicleNumber vehicleType model capacity status currentLocation"
      )
      .populate(
        "driverId",
        "name email phone licenseNumber experience status currentLocation"
      );

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Trip retrieved successfully",
      trip,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Update Trip Status
const updateTripStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "Scheduled",
      "In Progress",
      "Completed",
      "Cancelled",
    ];

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Trip status is required",
      });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid trip status",
      });
    }

    const trip = await Trip.findById(id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    trip.status = status;

    if (status === "Completed") {
      trip.endTime = new Date();
    }

    await trip.save();

    res.status(200).json({
      success: true,
      message: "Trip status updated successfully",
      trip,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Cancel Trip
const cancelTrip = async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await Trip.findById(id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    if (trip.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: "Completed trip cannot be cancelled",
      });
    }

    trip.status = "Cancelled";

    await trip.save();

    res.status(200).json({
      success: true,
      message: "Trip cancelled successfully",
      trip,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ==========================================
// SEARCH AND FILTER TRIPS
// ==========================================

const searchTrips = async (req, res) => {
  try {
    const {
      search,
      status,
      vehicleId,
      driverId,
    } = req.query;

    const filter = {};

    // Search by source or destination
    if (search) {
      filter.$or = [
        {
          source: {
            $regex: search,
            $options: "i",
          },
        },
        {
          destination: {
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

    // Filter by vehicle
    if (vehicleId) {
      filter.vehicleId = vehicleId;
    }

    // Filter by driver
    if (driverId) {
      filter.driverId = driverId;
    }

    const trips = await Trip.find(filter)
      .populate(
        "vehicleId",
        "vehicleNumber vehicleType model status currentLocation"
      )
      .populate(
        "driverId",
        "name email phone licenseNumber status currentLocation"
      );

    res.status(200).json({
      success: true,
      count: trips.length,
      trips,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createTrip,
  getAllTrips,
  getTripById,
  updateTripStatus,
  cancelTrip,
  searchTrips,
};