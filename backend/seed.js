/**
 * Optional seed script for demo listings.
 * Usage (from backend folder): node seed.js
 * - Reuses existing MONGO_URI from backend/.env
 * - Does NOT delete or modify existing users/listings
 * - Inserts sample mess listings only if the messes collection is empty
 * - Requires at least one owner user to exist (or creates none; will abort with message)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/user');
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
      console.log(`Seed skipped: ${existingCount} mess listing(s) already exist.`);
      process.exit(0);
    }

    let owner = await User.findOne({ role: 'owner', isActive: { $ne: false } });
    if (!owner) {
      console.log('No owner account found. Seed aborted (no listings created). Create an owner account first, then run seed again.');
      process.exit(0);
    }

    const samples = [
      {
        owner: owner._id, name: 'Green Valley Mess', description: 'Clean and affordable student mess near college area.', address: 'Tantigeria Main Road', area: 'Tantigeria', city: 'Midnapore',
        location: { lat: 22.431, lng: 87.311, mapUrl: '' }, price: 3200, roomType: 'Shared', gender: 'Boys', foodType: 'Veg + Non-Veg', foodAvailable: true,
        facilities: ['Wi-Fi', 'Laundry', 'Study Table', 'RO Water'], rules: ['Gate closes at 10 PM', 'No smoking'], contactPhone: '9876543210', whatsapp: '9876543210',
        images: [], availabilityStatus: 'available', approvalStatus: 'approved', averageRating: 4.5, reviewCount: 0
      },
      {
        owner: owner._id, name: 'Sunrise Girls Mess', description: 'Safe and comfortable accommodation for female students.', address: 'Rabindra Nagar', area: 'Rabindra Nagar', city: 'Midnapore',
        location: { lat: 22.424, lng: 87.319, mapUrl: '' }, price: 3800, roomType: 'Shared', gender: 'Girls', foodType: 'Veg', foodAvailable: true,
        facilities: ['CCTV', 'Wi-Fi', 'Home Food', 'Study Area'], rules: ['Visitors with permission only'], contactPhone: '9876543211', whatsapp: '9876543211',
        images: [], availabilityStatus: 'available', approvalStatus: 'approved', averageRating: 4.7, reviewCount: 0
      },
      {
        owner: owner._id, name: 'Campus Comfort Stay', description: 'Convenient location with good facilities for students.', address: 'Rangamati', area: 'Rangamati', city: 'Midnapore',
        location: { lat: 22.429, lng: 87.326, mapUrl: '' }, price: 4200, roomType: 'Single/Shared', gender: 'Co-ed', foodType: 'Both', foodAvailable: true,
        facilities: ['Wi-Fi', 'Parking', 'Power Backup', 'RO Water'], rules: ['Maintain cleanliness'], contactPhone: '9876543212', whatsapp: '9876543212',
        images: [], availabilityStatus: 'available', approvalStatus: 'approved', averageRating: 4.3, reviewCount: 0
      }
    ];

    await Mess.insertMany(samples);
    console.log(`Inserted ${samples.length} sample approved listings for owner ${owner.email}.`);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
})();
