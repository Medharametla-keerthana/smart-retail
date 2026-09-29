const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");

// ===============================
// IMPORT ROUTES
// ===============================

const authRoutes = require("./routes/authRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const driverRoutes = require("./routes/driverRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const tripRoutes = require("./routes/tripRoutes");
const locationRoutes = require("./routes/locationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
// ===============================
// CREATE EXPRESS APP
// ===============================

const app = express();

// ===============================
// MIDDLEWARE
// ===============================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

// ===============================
// TEST ROUTE
// ===============================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Smart Fleet Logistics Backend is running",
  });
});

// ===============================
// API ROUTES
// ===============================
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/dashboard", dashboardRoutes);
// ===============================
// 404 ROUTE
// ===============================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ===============================
// ERROR HANDLER
// ===============================

app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ===============================
// MONGODB CONNECTION
// ===============================

if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      console.error("MongoDB connection failed:", error.message);
      process.exitCode = 1;
    });
}

module.exports = app;