/**
 * Optional seed script for demo listings.
 * Usage (from backend folder): node seed.js
 * - Reuses existing MONGO_URI from backend/.env
 * - Does NOT delete or modify existing users/listings
 * - Inserts sample mess listings only if the messes collection is empty
 * - Requires at least one owner user to exist (or creates none; will abort with message)
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Mess = require('./models/Mess');

(async () => {
  try {
    await connectDB();
    if (!mongoose.connection.db) {
      console.error('Database not connected. Seed aborted.');
      process.exit(1);
    }

    const existingCount = await Mess.countDocuments();
    if (existingCount > 0) {
      console.log(`Seed complete: ${existingCount} mess listing(s) present in database.`);
      process.exit(0);
    }

    const seedPath = path.join(__dirname, 'data', 'messes_seed.json');
    if (fs.existsSync(seedPath)) {
      const raw = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
      const docs = raw.map(d => {
        const copy = { ...d };
        delete copy._id;
        delete copy.__v;
        return copy;
      });
      await Mess.insertMany(docs);
      console.log(`Inserted ${docs.length} verified mess listings from data/messes_seed.json.`);
    }
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
})();
