const Trip = require("../models/Trip");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const Notification = require("../models/Notification");
const User = require("../models/User");

const notifyCustomer = async (trip, title, message, category = "Delivery", incidentId = null) => {
  if (!trip.customerEmail) return;
  await Notification.create({ recipientEmail: trip.customerEmail, title, message, category, tripId: trip._id, incidentId });
};

const roleFilter = (user, driver) => user.role === "driver"
  ? { driverId: driver?._id }
  : user.role === "customer"
    ? { customerEmail: user.email.toLowerCase() }
    : {};

const requestTrip = async (req, res) => {
  try {
    const { source, destination, cargoDetails, startTime } = req.body;
    if (!source?.trim() || !destination?.trim()) return res.status(400).json({ success: false, message: "Pickup and delivery locations are required" });
    const trip = await Trip.create({
      source: source.trim(), destination: destination.trim(), cargoDetails: cargoDetails?.trim() || "Not specified",
      startTime: startTime || undefined, customerName: req.user.name, customerEmail: req.user.email.toLowerCase(), status: "Requested",
    });
    const managers = await User.find({ role: { $in: ["fleetManager", "admin"] } }).select("email");
    if (managers.length) await Notification.insertMany(managers.map(({ email }) => ({ recipientEmail: email, title: "New delivery request", message: `${req.user.name} requested a delivery from ${trip.source} to ${trip.destination}.`, category: "Request", tripId: trip._id })));
    return res.status(201).json({ success: true, message: "Delivery request sent to the fleet manager", trip });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

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
      customerName,
      customerEmail,
    } = req.body;

    if (!vehicleId || !driverId || !source || !destination || !customerEmail?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Vehicle, driver, source, destination, and customer email are required",
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

    if (!["Available", "Assigned"].includes(driver.status)) return res.status(400).json({ success: false, message: "The selected driver is not available" });
    if (vehicle.driverId && String(vehicle.driverId) !== String(driverId)) return res.status(400).json({ success: false, message: "A different driver is already assigned to this vehicle" });
    if (driver.assignedVehicle && String(driver.assignedVehicle) !== String(vehicleId)) return res.status(400).json({ success: false, message: "The driver is assigned to a different vehicle" });

    const activeTrip = await Trip.findOne({ status: { $in: ["Scheduled", "In Progress"] }, $or: [{ vehicleId }, { driverId }] });
    if (activeTrip) return res.status(400).json({ success: false, message: "The selected vehicle or driver already has an active delivery" });

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
      customerName,
      customerEmail: customerEmail?.trim().toLowerCase(),
      cargoDetails,
      distance,
      startTime,
      status: "Scheduled",
    });

    await notifyCustomer(trip, "Delivery scheduled", `Your delivery from ${trip.source} to ${trip.destination} has been scheduled.`);

    res.status(201).json({
      success: true,
      message: "Trip created successfully",
      trip: await Trip.findById(trip._id)
        .populate("vehicleId", "vehicleNumber vehicleType model status currentLocation")
        .populate("driverId", "name email phone licenseNumber status currentLocation"),
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const assignTripResources = async (req, res) => {
  try {
    const { customerName, customerEmail } = req.body;
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: "Delivery not found" });
    if (!["Requested", "Scheduled", "In Progress"].includes(trip.status)) return res.status(400).json({ success: false, message: "Only requested or active deliveries can be assigned" });
    if (trip.status === "In Progress") return res.status(400).json({ success: false, message: "Resources cannot be changed while a delivery is in progress" });
    const vehicleId = req.body.vehicleId || trip.vehicleId?.toString();
    const driverId = req.body.driverId || trip.driverId?.toString();
    if (!vehicleId || !driverId) return res.status(400).json({ success: false, message: "Select a vehicle and a driver" });
    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(customerEmail).trim())) {
      return res.status(400).json({ success: false, message: "Enter a valid customer email" });
    }

    const [vehicle, driver] = await Promise.all([Vehicle.findById(vehicleId), Driver.findById(driverId)]);
    if (!vehicle || !driver) return res.status(404).json({ success: false, message: "The selected vehicle or driver was not found" });
    const resourcesChanged = String(trip.vehicleId || "") !== String(vehicle._id) || String(trip.driverId || "") !== String(driver._id);
    if (resourcesChanged && (vehicle.status !== "Available" || !["Available", "Assigned"].includes(driver.status))) {
      return res.status(409).json({ success: false, message: "The selected vehicle or driver is unavailable" });
    }
    if (resourcesChanged && driver.assignedVehicle && String(driver.assignedVehicle) !== String(vehicle._id)) {
      return res.status(409).json({ success: false, message: "The selected driver is assigned to another vehicle" });
    }
    if (resourcesChanged) {
      const activeTrip = await Trip.findOne({ _id: { $ne: trip._id }, status: { $in: ["Scheduled", "In Progress"] }, $or: [{ vehicleId }, { driverId }] });
      if (activeTrip) return res.status(409).json({ success: false, message: "The selected vehicle or driver is already assigned to another delivery" });

      const [oldVehicle, oldDriver] = await Promise.all([Vehicle.findById(trip.vehicleId), Driver.findById(trip.driverId)]);
      if (oldVehicle && String(oldVehicle._id) !== String(vehicle._id) && oldVehicle.status === "Reserved") {
        oldVehicle.status = "Available";
        oldVehicle.driverId = null;
      }
      if (oldDriver && String(oldDriver._id) !== String(driver._id) && oldDriver.status === "Assigned") {
        oldDriver.status = "Available";
        oldDriver.assignedVehicle = null;
      }
      vehicle.driverId = driver._id;
      vehicle.status = "Reserved";
      driver.assignedVehicle = vehicle._id;
      driver.status = "Assigned";
      await Promise.all([vehicle.save(), driver.save(), oldVehicle?.save(), oldDriver?.save()].filter(Boolean));
    }
    trip.vehicleId = vehicle._id;
    trip.driverId = driver._id;
    if (trip.status === "Requested") trip.status = "Scheduled";
    if (customerName !== undefined) trip.customerName = String(customerName).trim();
    if (customerEmail !== undefined) trip.customerEmail = String(customerEmail).trim().toLowerCase();
    await trip.save();
    if (trip.customerEmail) await notifyCustomer(trip, "Delivery details updated", `Your delivery from ${trip.source} to ${trip.destination} is linked to your customer account.`);
    const assigned = await Trip.findById(trip._id)
      .populate("vehicleId", "vehicleNumber vehicleType status currentLocation")
      .populate("driverId", "name email phone status");
    return res.json({ success: true, trip: assigned, message: "Vehicle and driver assigned" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


// Get All Trips
const getAllTrips = async (req, res) => {
  try {
    const filter = roleFilter(req.user, req.driver);
    const trips = await Trip.find(filter)
      .populate({ path: "vehicleId", select: "vehicleNumber vehicleType model status currentLocation", transform: (doc, id) => doc || { _id: id, vehicleNumber: "Vehicle record unavailable" } })
      .populate({ path: "driverId", select: "name email phone licenseNumber status currentLocation", transform: (doc, id) => doc || { _id: id, name: "Driver record unavailable" } });

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

    const trip = await Trip.findOne({ _id: id, ...roleFilter(req.user, req.driver) })
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

    if (req.user.role === "customer" || (req.user.role === "driver" && String(trip.driverId) !== String(req.driver?._id))) {
      return res.status(403).json({ success: false, message: "You can only update your assigned deliveries" });
    }

    if (status === "Cancelled") return res.status(400).json({ success: false, message: "Use the cancel delivery action to cancel a trip" });
    if (status === "In Progress" && trip.status !== "Scheduled") {
      return res.status(400).json({ success: false, message: "Only scheduled deliveries can be started" });
    }
    if (status === "Completed" && trip.status !== "In Progress") {
      return res.status(400).json({ success: false, message: "Only in-progress deliveries can be completed" });
    }

    const [vehicle, driver] = await Promise.all([
      Vehicle.findById(trip.vehicleId),
      Driver.findById(trip.driverId),
    ]);
    if (!vehicle || !driver) {
      return res.status(409).json({ success: false, message: "This delivery is missing its assigned vehicle or driver. Reassign the missing resource before starting it." });
    }

    if (status === "In Progress") {
      if (!["Available", "Reserved"].includes(vehicle.status) || !["Available", "Assigned"].includes(driver.status)) {
        return res.status(409).json({ success: false, message: "The assigned vehicle or driver is busy or unavailable" });
      }
      vehicle.status = "On Trip";
      driver.status = "On Trip";
      await Promise.all([vehicle.save(), driver.save()]);
    }

    trip.status = status;

    if (status === "Completed") {
      trip.endTime = new Date();
    }

    await trip.save();

    if (status === "Completed") {
      vehicle.status = "Available";
      driver.status = "Available";
      await Promise.all([vehicle.save(), driver.save()]);
    }
    if (status === "In Progress") await notifyCustomer(trip, "Delivery in progress", `Your delivery from ${trip.source} to ${trip.destination} is now on the way.`);
    if (status === "Completed") await notifyCustomer(trip, "Delivery completed", `Your delivery to ${trip.destination} has been completed.`);

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

    if (req.user.role !== "fleetManager") return res.status(403).json({ success: false, message: "Only fleet managers can cancel deliveries" });

    if (trip.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: "Completed trip cannot be cancelled",
      });
    }

    trip.status = "Cancelled";
    const [vehicle, driver] = await Promise.all([Vehicle.findById(trip.vehicleId), Driver.findById(trip.driverId)]);
    if (vehicle && ["Reserved", "On Trip"].includes(vehicle.status)) vehicle.status = "Available";
    if (driver && ["Assigned", "On Trip"].includes(driver.status)) driver.status = "Available";
    await Promise.all([trip.save(), vehicle?.save(), driver?.save()].filter(Boolean));
    await notifyCustomer(trip, "Delivery cancelled", `Your delivery from ${trip.source} to ${trip.destination} was cancelled.`);

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

    const filter = roleFilter(req.user, req.driver);

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
  requestTrip,
  createTrip,
  assignTripResources,
  getAllTrips,
  getTripById,
  updateTripStatus,
  cancelTrip,
  searchTrips,
};

