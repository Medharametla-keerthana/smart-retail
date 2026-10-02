const mongoose = require("mongoose");

const maintenanceSchema = new mongoose.Schema({
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true, index: true },
  type: {
    type: String,
    enum: ["Regular service", "Oil change", "Brake service", "Tyre replacement", "Engine repair", "Other"],
    required: true,
  },
  scheduledDate: { type: Date, required: true },
  estimatedCompletionDate: { type: Date, required: true },
  priority: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
  mechanic: { type: String, trim: true, maxlength: 120, default: "" },
  workshop: { type: String, trim: true, maxlength: 160, default: "" },
  notes: { type: String, trim: true, maxlength: 2000, default: "" },
  status: {
    type: String,
    enum: ["Scheduled", "Vehicle Received", "Inspection", "Repair in Progress", "Quality Check", "Completed", "Cancelled"],
    default: "Scheduled",
  },
  partsCost: { type: Number, min: 0, default: 0 },
  labourCost: { type: Number, min: 0, default: 0 },
  completedAt: { type: Date, default: null },
  createdBy: { type: String, lowercase: true, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("Maintenance", maintenanceSchema);
