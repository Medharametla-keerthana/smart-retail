const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  severity: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
  status: { type: String, enum: ["Open", "Resolved"], default: "Open" },
  reporterName: { type: String, required: true },
  reporterEmail: { type: String, required: true, lowercase: true },
}, { timestamps: true });

module.exports = mongoose.model("Incident", incidentSchema);
