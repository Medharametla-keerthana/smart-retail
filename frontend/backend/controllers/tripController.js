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

    if (vehicle.status !== "Available") {
      return res.status(400).json({
        success: false,
        message: "The selected vehicle is not available",
      });
    }

    if (driver.status !== "Available" && driver.status !== "Assigned") {
      return res.status(400).json({
        success: false,
        message: "The selected driver is not available",
      });
    }

    const assignedVehicleId = vehicle.driverId?.toString();
    const driverVehicleId = driver.assignedVehicle?.toString();

    if (assignedVehicleId && assignedVehicleId !== driverId) {
      return res.status(400).json({
        success: false,
        message: "A different driver is already assigned to this vehicle",
      });
    }

    if (driverVehicleId && driverVehicleId !== vehicleId) {
      return res.status(400).json({
        success: false,
        message: "The selected driver is assigned to a different vehicle",
      });
    }

    const activeTrip = await Trip.findOne({
      status: { $in: ["Scheduled", "In Progress"] },
      $or: [{ vehicleId }, { driverId }],
    });

    if (activeTrip) {
      return res.status(400).json({
        success: false,
        message: "The selected vehicle or driver already has an active delivery",
      });
    }

    if (driver.status === "Assigned" && assignedVehicleId !== driverId && driverVehicleId !== vehicleId) {
      return res.status(400).json({
        success: false,
        message: "The selected driver is already assigned elsewhere",
      });
    }

    vehicle.driverId = driverId;
    vehicle.status = "Reserved";
    driver.assignedVehicle = vehicleId;
    driver.status = "Assigned";

    await Promise.all([vehicle.save(), driver.save()]);

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

    const populatedTrip = await Trip.findById(trip._id)
      .populate("vehicleId", "vehicleNumber vehicleType model status currentLocation")
      .populate("driverId", "name email phone licenseNumber status currentLocation");

    res.status(201).json({
      success: true,
      message: "Trip created successfully",
      trip: populatedTrip,
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

    if (status === "In Progress") {
      if (trip.status !== "Scheduled") {
        return res.status(400).json({
          success: false,
          message: "Only scheduled deliveries can be started",
        });
      }

      const activeTrip = await Trip.findOne({
        _id: { $ne: trip._id },
        status: { $in: ["Scheduled", "In Progress"] },
        $or: [{ vehicleId: trip.vehicleId }, { driverId: trip.driverId }],
      });

      if (activeTrip) {
        return res.status(400).json({
          success: false,
          message: "The vehicle or driver is assigned to another active delivery",
        });
      }

      const [vehicle, driver] = await Promise.all([
        Vehicle.findById(trip.vehicleId),
        Driver.findById(trip.driverId),
      ]);

      if (!vehicle || !driver) {
        return res.status(404).json({
          success: false,
          message: "The delivery vehicle or driver could not be found",
        });
      }

      if (
        !["Available", "Reserved"].includes(vehicle.status) ||
        !["Available", "Assigned"].includes(driver.status)
      ) {
        return res.status(400).json({
          success: false,
          message: "The delivery vehicle or driver is no longer available",
        });
      }

      vehicle.status = "On Trip";
      driver.status = "On Trip";
      await Promise.all([vehicle.save(), driver.save()]);
    }

    if (status === "Completed" && trip.status !== "In Progress") {
      return res.status(400).json({
        success: false,
        message: "Only in-progress deliveries can be completed",
      });
    }

    trip.status = status;

    if (status === "Completed") {
      trip.endTime = new Date();
    }

    await trip.save();

    if (status === "Completed") {
      const [vehicle, driver] = await Promise.all([
        Vehicle.findById(trip.vehicleId),
        Driver.findById(trip.driverId),
      ]);

      if (vehicle?.status === "On Trip") vehicle.status = "Available";
      if (driver?.status === "On Trip") driver.status = "Available";
      await Promise.all([vehicle?.save(), driver?.save()].filter(Boolean));
    }

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

    const [vehicle, driver] = await Promise.all([
      Vehicle.findById(trip.vehicleId),
      Driver.findById(trip.driverId),
    ]);

    if (vehicle?.status === "Reserved" || vehicle?.status === "On Trip") {
      vehicle.status = "Available";
    }
    if (driver?.status === "Assigned" || driver?.status === "On Trip") {
      driver.status = "Available";
    }

    trip.status = "Cancelled";

    await Promise.all([
      trip.save(),
      vehicle?.save(),
      driver?.save(),
    ].filter(Boolean));

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
