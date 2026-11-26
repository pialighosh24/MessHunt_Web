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
      const User = require('../models/user');
      const Mess = require('../models/Mess');

      const ensureAccount = async (email, name, password, role, verified = false, forceRoleAndPass = false) => {
        let u = await User.findOne({ email: email.toLowerCase() });
        if (!u) {
          u = new User({ name, email: email.toLowerCase(), password, role, isActive: true, ownerVerified: verified });
          await u.save();
        } else if (forceRoleAndPass) {
          let changed = false;
          if (u.role !== role) { u.role = role; changed = true; }
          if (verified && !u.ownerVerified) { u.ownerVerified = true; changed = true; }
          if (password) { u.password = password; changed = true; }
          if (changed) await u.save();
        }
        return u;
      };

      const owner1 = await ensureAccount('maityankana@gmail.com', 'Anu', '123456', 'owner', true);
      const owner2 = await ensureAccount('pialighosh@gmail.com', 'piali ghosh', '1234', 'owner', true);
      const owner3 = await ensureAccount('shrestha@gmail.com', 'Shrestha', '1234', 'owner', true);
      const owner4 = await ensureAccount('anima@gmail.com', 'Anima', '1234', 'owner', true);
      await ensureAccount('maityankana913@gmail.com', 'Ankana', '123456', 'student', false);
      await ensureAccount('pialighosh2006@gmail.com', 'Piali Ghosh', 'ghosh123', 'admin', false, true);

      const ownerByMess = {
        'Debi Sarbajaya Mess': owner1._id, 'Puspak Mess': owner1._id, 'Uttaran Mess': owner1._id,
        'Sahachari Chhatri Nibas': owner2._id, 'Kanak Mess Cum Paying Guest': owner2._id, 'Johim Mess': owner2._id, 'Peace Avenue Girls Mess': owner2._id, 'Manjusri Chatrinivas': owner2._id,
        'Silver Spring Boys Mess': owner3._id, 'Chakadola Ladies Mess': owner3._id, 'Bhadra Mess Bari': owner3._id, 'Aurobinda Mess': owner3._id,
        'Shantiniketan Mess': owner4._id, 'Bharat PG': owner4._id, 'AFS Apartment': owner4._id, 'Tapas P.G.': owner4._id, 'Kharagpur P.G.': owner4._id, 'Premium Boys AC PG': owner4._id, 'Sujay Kr Sharma PG Hostel': owner4._id, 'TM - MESS': owner4._id
      };

      const count = await Mess.countDocuments();
      const seedPath = path.join(__dirname, '..', 'data', 'messes_seed.json');
      if (fs.existsSync(seedPath)) {
        const raw = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
        if (count === 0 && Array.isArray(raw) && raw.length > 0) {
          const docs = raw.map(d => {
            const copy = { ...d };
            delete copy._id;
            delete copy.__v;
            if (ownerByMess[copy.name]) copy.owner = ownerByMess[copy.name];
            return copy;
          });
          await Mess.insertMany(docs);
          console.log(`Auto-loaded ${docs.length} verified mess listings from data/messes_seed.json`);
        } else if (count > 0 && Array.isArray(raw)) {
          // Ensure existing databases auto-sync totalRooms and 4-owner assignments on server start
          for (const d of raw) {
            const updateFields = {};
            if (d.totalRooms) updateFields.totalRooms = d.totalRooms;
            if (ownerByMess[d.name]) updateFields.owner = ownerByMess[d.name];
            if (Object.keys(updateFields).length > 0) {
              await Mess.updateOne(
                { name: d.name, $or: [{ totalRooms: null }, { totalRooms: { $exists: false } }, { owner: { $ne: ownerByMess[d.name] } }] },
                { $set: updateFields }
              );
            }
          }
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
