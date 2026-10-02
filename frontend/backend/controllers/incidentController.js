const Incident = require("../models/Incident");
const Notification = require("../models/Notification");
const Trip = require("../models/Trip");

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
    const { tripId, title, description, severity = "Medium" } = req.body;
    if (!tripId || !title?.trim() || !description?.trim()) {
      return res.status(400).json({ success: false, message: "Choose a delivery and enter an incident title and description" });
    }
    const trip = await Trip.findOne({ _id: tripId, driverId: req.driver._id, status: { $in: ["Scheduled", "In Progress"] } });
    if (!trip) return res.status(404).json({ success: false, message: "Active delivery not found for this driver" });

    const incident = await Incident.create({
      tripId: trip._id,
      vehicleId: trip.vehicleId,
      driverId: req.driver._id,
      title: title.trim(),
      description: description.trim(),
      severity,
      reporterName: req.user.name,
      reporterEmail: req.user.email,
    });
    if (trip.customerEmail) {
      await Notification.create({
        recipientEmail: trip.customerEmail,
        title: "Delivery incident reported",
        message: `${title.trim()} was reported during delivery to ${trip.destination}. Our fleet team is reviewing it.`,
        category: "Incident",
        tripId: trip._id,
        incidentId: incident._id,
      });
    }
    return res.status(201).json({ success: true, incident });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const resolveIncident = async (req, res) => {
  try {
    const incident = await Incident.findByIdAndUpdate(req.params.id, { status: "Resolved" }, { new: true });
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
