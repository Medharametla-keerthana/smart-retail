const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const Trip = require("../models/Trip");
const Notification = require("../models/Notification");

// ==========================================
// DASHBOARD SUMMARY
// ==========================================

const getDashboardSummary = async (req, res) => {
  try {
    if (req.user.role === "driver") {
      const driver = req.driver;
      await driver.populate("assignedVehicle", "vehicleNumber vehicleType status currentLocation");
      const [totalTrips, completedTrips, activeTrips, upcomingTrips] = await Promise.all([
        Trip.countDocuments({ driverId: driver._id }),
        Trip.countDocuments({ driverId: driver._id, status: "Completed" }),
        Trip.countDocuments({ driverId: driver._id, status: "In Progress" }),
        Trip.countDocuments({ driverId: driver._id, status: "Scheduled" }),
      ]);
      return res.json({ success: true, summary: { driver: { totalTrips, completedTrips, activeTrips, upcomingTrips, availability: driver.status, currentLocation: driver.currentLocation, vehicle: driver.assignedVehicle } } });
    }
    if (req.user.role === "customer") {
      const filter = { customerEmail: req.user.email.toLowerCase() };
      const [totalTrips, completedTrips, activeTrips, requestedTrips, recentTrips, unreadNotifications] = await Promise.all([
        Trip.countDocuments(filter), Trip.countDocuments({ ...filter, status: "Completed" }),
        Trip.countDocuments({ ...filter, status: "In Progress" }), Trip.countDocuments({ ...filter, status: "Requested" }),
        Trip.find(filter).sort({ createdAt: -1 }).limit(5).select("source destination cargoDetails status startTime createdAt"),
        Notification.countDocuments({ recipientEmail: req.user.email.toLowerCase(), readAt: null }),
      ]);
      return res.json({ success: true, summary: { customer: { totalTrips, completedTrips, activeTrips, requestedTrips, unreadNotifications, recentTrips } } });
    }
    const totalVehicles = await Vehicle.countDocuments();

    const availableVehicles = await Vehicle.countDocuments({
      status: "Available",
    });

    const totalDrivers = await Driver.countDocuments();

    const assignedDrivers = await Driver.countDocuments({
      status: "Assigned",
    });

    const totalTrips = await Trip.countDocuments();

    const scheduledTrips = await Trip.countDocuments({
      status: "Scheduled",
    });

    const inProgressTrips = await Trip.countDocuments({
      status: "In Progress",
    });

    const completedTrips = await Trip.countDocuments({
      status: "Completed",
    });

    const cancelledTrips = await Trip.countDocuments({
      status: "Cancelled",
    });

    res.status(200).json({
      success: true,
      message: "Dashboard summary retrieved successfully",

      summary: {
        totalVehicles,
        availableVehicles,
        totalDrivers,
        assignedDrivers,
        totalTrips,
        scheduledTrips,
        inProgressTrips,
        completedTrips,
        cancelledTrips,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// DASHBOARD ANALYTICS
// ==========================================

const getDashboardAnalytics = async (req, res) => {
  try {
    // Vehicle statistics
    const availableVehicles = await Vehicle.countDocuments({
      status: "Available",
    });

    const assignedVehicles = await Vehicle.countDocuments({
      status: "Assigned",
    });

    const maintenanceVehicles = await Vehicle.countDocuments({
      status: "Maintenance",
    });

    // Driver statistics
    const availableDrivers = await Driver.countDocuments({
      status: "Available",
    });

    const assignedDrivers = await Driver.countDocuments({
      status: "Assigned",
    });

    // Trip statistics
    const scheduledTrips = await Trip.countDocuments({
      status: "Scheduled",
    });

    const inProgressTrips = await Trip.countDocuments({
      status: "In Progress",
    });

    const completedTrips = await Trip.countDocuments({
      status: "Completed",
    });

    const cancelledTrips = await Trip.countDocuments({
      status: "Cancelled",
    });

    // Calculate total distance
    const distanceResult = await Trip.aggregate([
      {
        $match: {
          distance: {
            $exists: true,
            $ne: null,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalDistance: {
            $sum: "$distance",
          },
        },
      },
    ]);

    const totalDistance =
      distanceResult.length > 0
        ? distanceResult[0].totalDistance
        : 0;

    res.status(200).json({
      success: true,
      message: "Dashboard analytics retrieved successfully",

      analytics: {
        vehicles: {
          available: availableVehicles,
          assigned: assignedVehicles,
          maintenance: maintenanceVehicles,
        },

        drivers: {
          available: availableDrivers,
          assigned: assignedDrivers,
        },

        trips: {
          scheduled: scheduledTrips,
          inProgress: inProgressTrips,
          completed: completedTrips,
          cancelled: cancelledTrips,
        },

        totalDistance,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


module.exports = {
  getDashboardSummary,
  getDashboardAnalytics,
};
