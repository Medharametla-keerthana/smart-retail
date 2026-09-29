const mongoose = require("mongoose");

let connectionPromise;

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI environment variable is required");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGO_URI).catch((error) => {
      connectionPromise = undefined;
      throw error;
    });
  }

  const connection = await connectionPromise;
  console.log(`MongoDB Connected: ${connection.connection.host}`);
  return connection.connection;
};

module.exports = connectDB;