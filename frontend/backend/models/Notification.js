const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipientEmail: { type: String, required: true, lowercase: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  category: { type: String, enum: ["Delivery", "Incident", "Request"], required: true },
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", default: null },
  incidentId: { type: mongoose.Schema.Types.ObjectId, ref: "Incident", default: null },
  actionUrl: { type: String, default: "" },
  readAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
