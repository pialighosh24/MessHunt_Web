const mongoose = require('mongoose');

/**
 * Connect to MongoDB using the existing project configuration.
 * - Reuses MONGO_URI from backend/.env (loaded by dotenv in server.js)
 * - Falls back to the existing local/default URI pattern already used by the project
 * - Does not create duplicate connections intentionally
 */
const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/messhunt';

  try {
    await mongoose.connect(mongoUri);
    const dbName = mongoose.connection.db ? mongoose.connection.db.databaseName : '(unknown)';
    console.log(`MongoDB connected successfully (database: ${dbName})`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    // Do not exit automatically; allow server to start so non-DB parts can be inspected.
    // DB-dependent operations will fail until connectivity/configuration is available.
  }
};

module.exports = connectDB;
