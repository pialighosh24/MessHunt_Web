const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

/**
 * Connect to MongoDB using the existing project configuration.
 * - Reuses MONGO_URI from backend/.env (loaded by dotenv in server.js)
 * - Falls back to the existing local/default URI pattern already used by the project
 * - Auto-restores the 20 verified mess listings from data/messes_seed.json if the database is empty
 */
const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/messhunt';

  try {
    await mongoose.connect(mongoUri);
    const dbName = mongoose.connection.db ? mongoose.connection.db.databaseName : '(unknown)';
    console.log(`MongoDB connected successfully (database: ${dbName})`);

    try {
      const Mess = require('../models/Mess');
      const count = await Mess.countDocuments();
      const seedPath = path.join(__dirname, '..', 'data', 'messes_seed.json');
      if (count === 0 && fs.existsSync(seedPath)) {
        const raw = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
        if (Array.isArray(raw) && raw.length > 0) {
          const docs = raw.map(d => {
            const copy = { ...d };
            delete copy._id;
            delete copy.__v;
            return copy;
          });
          await Mess.insertMany(docs);
          console.log(`Auto-loaded ${docs.length} verified mess listings from data/messes_seed.json`);
        }
      }
    } catch (seedErr) {
      console.warn('Auto-seed check skipped:', seedErr.message);
    }
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
  }
};

module.exports = connectDB;
