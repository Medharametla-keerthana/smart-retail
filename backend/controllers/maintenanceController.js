const Maintenance = require("../models/Maintenance");
const Vehicle = require("../models/Vehicle");

const populateVehicle = (query) => query.populate("vehicleId", "vehicleNumber vehicleType model capacity currentLocation status");

const getMaintenance = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status && req.query.status !== "All") filter.status = req.query.status;
    if (req.query.priority && req.query.priority !== "All") filter.priority = req.query.priority;
    if (req.query.vehicleId) filter.vehicleId = req.query.vehicleId;
    const records = await populateVehicle(Maintenance.find(filter).sort({ scheduledDate: -1, createdAt: -1 }));
    return res.json({ success: true, records });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const scheduleMaintenance = async (req, res) => {
  try {
    const { vehicleId, type, scheduledDate, estimatedCompletionDate, priority, mechanic, workshop, notes } = req.body;
    if (!vehicleId || !type || !scheduledDate || !estimatedCompletionDate) {
      return res.status(400).json({ success: false, message: "Vehicle, service type, scheduled date, and estimated completion date are required" });
    }
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ success: false, message: "Vehicle not found" });
    if (["Reserved", "On Trip"].includes(vehicle.status)) {
      return res.status(409).json({ success: false, message: "A reserved or active-trip vehicle cannot be scheduled for maintenance" });
    }
    const activeRecord = await Maintenance.findOne({ vehicleId, status: { $nin: ["Completed", "Cancelled"] } });
    if (activeRecord) return res.status(409).json({ success: false, message: "This vehicle already has an open maintenance record" });
    const start = new Date(scheduledDate);
    const end = new Date(estimatedCompletionDate);
    if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || end < start) {
      return res.status(400).json({ success: false, message: "Estimated completion must be on or after the scheduled date" });
    }
    const record = await Maintenance.create({
      vehicleId, type, scheduledDate: start, estimatedCompletionDate: end,
      priority: priority || "Medium", mechanic, workshop, notes, createdBy: req.user.email,
    });
    vehicle.status = "Maintenance";
    await vehicle.save();
    return res.status(201).json({ success: true, record: await populateVehicle(Maintenance.findById(record._id)), message: "Maintenance scheduled" });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const updateMaintenance = async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: "Maintenance record not found" });
    if (["Completed", "Cancelled"].includes(record.status)) {
      return res.status(409).json({ success: false, message: "Completed or cancelled maintenance records cannot be changed" });
    }
    const { status, priority, mechanic, workshop, notes, partsCost, labourCost, estimatedCompletionDate } = req.body;
    if (status !== undefined) record.status = status;
    if (priority !== undefined) record.priority = priority;
    if (mechanic !== undefined) record.mechanic = mechanic;
    if (workshop !== undefined) record.workshop = workshop;
    if (notes !== undefined) record.notes = notes;
    if (partsCost !== undefined) record.partsCost = Number(partsCost);
    if (labourCost !== undefined) record.labourCost = Number(labourCost);
    if (estimatedCompletionDate !== undefined) record.estimatedCompletionDate = new Date(estimatedCompletionDate);
    if (record.estimatedCompletionDate < record.scheduledDate || Number.isNaN(record.estimatedCompletionDate.valueOf())) {
      return res.status(400).json({ success: false, message: "Estimated completion must be on or after the scheduled date" });
    }
    if (["Completed", "Cancelled"].includes(record.status)) record.completedAt = new Date();
    await record.save();
    if (["Completed", "Cancelled"].includes(record.status)) {
      const otherOpenRecord = await Maintenance.exists({ vehicleId: record.vehicleId, _id: { $ne: record._id }, status: { $nin: ["Completed", "Cancelled"] } });
      if (!otherOpenRecord) await Vehicle.findByIdAndUpdate(record.vehicleId, { status: "Available" });
    }
    return res.json({ success: true, record: await populateVehicle(Maintenance.findById(record._id)), message: "Maintenance record updated" });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getMaintenance, scheduleMaintenance, updateMaintenance };
