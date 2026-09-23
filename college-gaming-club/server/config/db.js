const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gaming_club', {
      // Connection pool sizing for 500+ concurrent users
      minPoolSize: 10,
      maxPoolSize: 50,
      // Timeouts
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      // Performance
      autoIndex: process.env.NODE_ENV !== 'production',
    });
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host} (pool: 10-50)`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
  }
};

module.exports = connectDB;
