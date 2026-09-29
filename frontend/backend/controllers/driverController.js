const Driver = require("../models/Driver");

// Create Driver
const createDriver = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      licenseNumber,
      experience,
      status,
      currentLocation,
    } = req.body;

    // Check required fields
    if (!name || !email || !phone || !licenseNumber) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required driver details",
      });
    }

    // Check existing driver by email
    const existingDriver = await Driver.findOne({
      $or: [
        { email },
        { licenseNumber },
      ],
    });

    if (existingDriver) {
      return res.status(400).json({
        success: false,
        message: "Driver already exists with this email or license number",
      });
    }

    // Create driver
    const driver = await Driver.create({
      name,
      email,
      phone,
      licenseNumber,
      experience,
      status,
      currentLocation,
    });

    res.status(201).json({
      success: true,
      message: "Driver created successfully",
      driver,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Get All Drivers
const getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find();

    res.status(200).json({
      success: true,
      count: drivers.length,
      drivers,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Get Single Driver
const getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    res.status(200).json({
      success: true,
      driver,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Update Driver
const updateDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Driver updated successfully",
      driver,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Delete Driver
const deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Driver deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ==========================================
// SEARCH AND FILTER DRIVERS
// ==========================================

const searchDrivers = async (req, res) => {
  try {
    const { search, status } = req.query;

    const filter = {};

    // Search by name or email
    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
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

    const drivers = await Driver.find(filter);

    res.status(200).json({
      success: true,
      count: drivers.length,
      drivers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


module.exports = {
  createDriver,
  getDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  searchDrivers,
};