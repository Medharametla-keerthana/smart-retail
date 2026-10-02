const Incident = require("../models/Incident");
const Notification = require("../models/Notification");
const Trip = require("../models/Trip");
const Vehicle = require("../models/Vehicle");
const Location = require("../models/Location");
const User = require("../models/User");

const getIncidents = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === "driver") filter.driverId = req.driver._id;
    if (req.user.role === "customer") {
      const trips = await Trip.find({ customerEmail: req.user.email.toLowerCase() }).select("_id");
      filter.tripId = { $in: trips.map((trip) => trip._id) };
    }
    const incidents = await Incident.find(filter).sort({ createdAt: -1 })
      .populate("tripId", "source destination status")
      .populate("vehicleId", "vehicleNumber")
      .populate("driverId", "name email");
    return res.json({ success: true, count: incidents.length, incidents });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const reportIncident = async (req, res) => {
  try {
    const { tripId, title, description, severity = "Medium", latitude, longitude, locationName } = req.body;
    if (!tripId || !title?.trim() || !description?.trim()) {
      return res.status(400).json({ success: false, message: "Choose a delivery and enter an incident title and description" });
    }
    const trip = await Trip.findOne({ _id: tripId, driverId: req.driver._id, status: { $in: ["Scheduled", "In Progress"] } });
    if (!trip) return res.status(404).json({ success: false, message: "Active delivery not found for this driver" });

    const hasCoordinates = Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude)) && latitude !== null && longitude !== null;
    const alternateRouteUrl = hasCoordinates
      ? `https://www.google.com/maps/dir/?${new URLSearchParams({ api: "1", origin: `${Number(latitude)},${Number(longitude)}`, destination: trip.destination, travelmode: "driving" }).toString()}`
      : "";
    const incident = await Incident.create({
      tripId: trip._id,
      vehicleId: trip.vehicleId,
      driverId: req.driver._id,
      title: title.trim(),
      description: description.trim(),
      severity,
      reporterName: req.user.name,
      reporterEmail: req.user.email,
      latitude: hasCoordinates ? Number(latitude) : null,
      longitude: hasCoordinates ? Number(longitude) : null,
      locationName: locationName || "",
      alternateRouteUrl,
    });
    if (alternateRouteUrl) {
      trip.alternateRouteUrl = alternateRouteUrl;
      trip.alternateRouteUpdatedAt = new Date();
      trip.currentLatitude = Number(latitude);
      trip.currentLongitude = Number(longitude);
      trip.currentLocation = locationName || `GPS ${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`;
      await trip.save();
      await Promise.all([
        Vehicle.findByIdAndUpdate(trip.vehicleId, { currentLocation: trip.currentLocation }),
        Location.create({ vehicleId: trip.vehicleId, latitude: Number(latitude), longitude: Number(longitude), locationName: trip.currentLocation, speed: 0 }),
      ]);
    }
    if (trip.customerEmail) {
      await Notification.create({
        recipientEmail: trip.customerEmail,
        title: "Delivery incident reported",
        message: `${title.trim()} was reported during delivery to ${trip.destination}. Our fleet team is reviewing it.`,
        category: "Incident",
        tripId: trip._id,
        incidentId: incident._id,
        actionUrl: alternateRouteUrl,
      });
    }
    const managers = await User.find({ role: { $in: ["fleetManager", "admin"] } }).select("email");
    if (managers.length) await Notification.insertMany(managers.map(({ email }) => ({
      recipientEmail: email,
      title: "Delivery incident reported",
      message: `${title.trim()} was reported on the route to ${trip.destination}.`,
      category: "Incident",
      tripId: trip._id,
      incidentId: incident._id,
    })));
    return res.status(201).json({ success: true, incident, alternateRouteUrl });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const resolveIncident = async (req, res) => {
  try {
    const incidentId = req.params.id || req.body.incidentId;
    if (!incidentId) return res.status(400).json({ success: false, message: "Incident ID is required" });
    const incident = await Incident.findByIdAndUpdate(incidentId, { status: "Resolved" }, { new: true });
    if (!incident) return res.status(404).json({ success: false, message: "Incident not found" });
    const trip = await Trip.findById(incident.tripId);
    if (trip?.customerEmail) {
      await Notification.create({
        recipientEmail: trip.customerEmail,
        title: "Incident resolved",
        message: `The incident reported for your delivery to ${trip.destination} has been resolved.`,
        category: "Incident",
        tripId: trip._id,
        incidentId: incident._id,
      });
    }
    return res.json({ success: true, incident });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getIncidents, reportIncident, resolveIncident };
