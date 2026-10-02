const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: false,
    },

    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: false,
    },

    source: {
      type: String,
      required: true,
      trim: true,
    },

    destination: {
      type: String,
      required: true,
      trim: true,
    },

    customerName: { type: String, trim: true, default: "" },
    customerEmail: { type: String, trim: true, lowercase: true, default: "", index: true },
    currentLatitude: { type: Number, default: null },
    currentLongitude: { type: Number, default: null },
    currentLocation: { type: String, default: "" },

    cargoDetails: {
      type: String,
      default: "Not Specified",
    },

    distance: {
      type: Number,
      default: 0,
    },

    startTime: {
      type: Date,
      default: Date.now,
    },

    endTime: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["Requested", "Scheduled", "In Progress", "Completed", "Cancelled"],
      default: "Scheduled",
    },
  },
  {
    timestamps: true,
  }
);

const Trip = mongoose.model("Trip", tripSchema);

module.exports = Trip;
