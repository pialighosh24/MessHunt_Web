const path = require('path');
const cwd = process.cwd();
require(path.join(cwd, 'node_modules/dotenv')).config({ path: path.join(cwd, '.env') });
const mongoose = require(path.join(cwd, 'node_modules/mongoose'));
const Mess = require(path.join(cwd, 'models/Mess'));

// Accurate geographic coordinates and realistic student mess details
const updates = {
  'Silver Spring Boys Mess': {
    price: 3200,
    securityDeposit: 3000,
    roomSharing: 'Double',
    furnishing: 'Furnished',
    bathroomType: 'Common bathroom',
    foodIncluded: 'Included in rent',
    foodPreference: 'Both',
    foodType: 'Both',
    foodAvailable: true,
    breakfast: 'Available',
    lunch: 'Available',
    dinner: 'Available',
    selfCooking: 'Not available',
    facilities: ['Wi-Fi', 'Study Table', 'RO Water', 'Laundry'],
    rules: ['Gate closes at 10:00 PM', 'Maintain silence during study hours'],
    lat: 22.4292,
    lng: 87.2998,
    nearby: { college: 'Vidyasagar University & Paramedical College', busStand: 'Tantigeria Bus Stand', railwayStation: 'Midnapore Railway Station' }
  },
  'Debi Sarbajaya Mess': {
    price: 2800,
    securityDeposit: 2500,
    roomSharing: 'Triple',
    furnishing: 'Furnished',
    bathroomType: 'Common bathroom',
    foodIncluded: 'Charged separately',
    foodPreference: 'Veg',
    foodType: 'Veg',
    foodAvailable: true,
    breakfast: 'Available',
    lunch: 'Available',
    dinner: 'Available',
    selfCooking: 'Available',
    facilities: ['Wi-Fi', 'Water Supply', 'Study Table', 'RO Water'],
    rules: ['Visitors allowed in common room only', 'Keep rooms clean'],
    lat: 22.4172,
    lng: 87.3282,
    nearby: { college: 'Midnapore College', busStand: 'Patnabazar / Kotwali Stop', railwayStation: 'Midnapore Railway Station' }
  },
  'Manjusri Chatrinivas': {
    price: 3800,
    securityDeposit: 3500,
    roomSharing: 'Double',
    furnishing: 'Furnished',
    bathroomType: 'Attached bathroom',
    foodIncluded: 'Included in rent',
    foodPreference: 'Both',
    foodType: 'Both',
    foodAvailable: true,
    breakfast: 'Available',
    lunch: 'Available',
    dinner: 'Available',
    selfCooking: 'Not available',
    facilities: ['Wi-Fi', 'CCTV', 'Attached bathroom', 'RO Water', 'Study Table'],
    rules: ['Entry deadline 8:30 PM', 'No outside guests in rooms'],
    lat: 22.4304,
    lng: 87.3025,
    nearby: { college: 'Vidyasagar University', busStand: 'Tantigeria Bus Stand', railwayStation: 'Midnapore Railway Station' }
  },
  'Chakadola Ladies Mess': {
    price: 3500,
    securityDeposit: 3000,
    roomSharing: 'Double',
    furnishing: 'Furnished',
    bathroomType: 'Attached bathroom',
    foodIncluded: 'Included in rent',
    foodPreference: 'Veg',
    foodType: 'Veg',
    foodAvailable: true,
    breakfast: 'Available',
    lunch: 'Available',
    dinner: 'Available',
    selfCooking: 'Available',
    facilities: ['Wi-Fi', 'Attached bathroom', 'Study Table', 'RO Water', 'CCTV'],
    rules: ['Strict night curfew 9:00 PM', 'ID proof mandatory'],
    lat: 22.4316,
    lng: 87.2994,
    nearby: { college: 'Vidyasagar University (Gate No. 3)', busStand: 'V.U. Bus Stop', railwayStation: 'Midnapore Railway Station' }
  },
  'Bhadra Mess Bari': {
    price: 2600,
    securityDeposit: 2000,
    roomSharing: 'Double',
    furnishing: 'Furnished',
    bathroomType: 'Common bathroom',
    foodIncluded: 'Charged separately',
    foodPreference: 'Both',
    foodType: 'Both',
    foodAvailable: true,
    breakfast: 'Available',
    lunch: 'Available',
    dinner: 'Available',
    selfCooking: 'Available',
    facilities: ['Wi-Fi', 'Water Supply', 'Study Table', 'Parking'],
    rules: ['No loud music after 11 PM', 'No smoking'],
    lat: 22.4158,
    lng: 87.3195,
    nearby: { college: 'Midnapore College', busStand: 'Mahatabpur / Judges Court Stop', railwayStation: 'Midnapore Railway Station' }
  },
  'Puspak Mess': {
    price: 2900,
    securityDeposit: 2500,
    roomSharing: 'Triple',
    furnishing: 'Furnished',
    bathroomType: 'Common bathroom',
    foodIncluded: 'Included in rent',
    foodPreference: 'Both',
    foodType: 'Both',
    foodAvailable: true,
    breakfast: 'Available',
    lunch: 'Available',
    dinner: 'Available',
    selfCooking: 'Not available',
    facilities: ['Wi-Fi', 'RO Water', 'Study Table'],
    rules: ['Gate closes at 10:00 PM'],
    lat: 22.4216,
    lng: 87.3258,
    nearby: { college: 'Midnapore College & Collegiate School', busStand: 'Raja Bazar Bus Stop', railwayStation: 'Midnapore Railway Station' }
  },
  'Sahachari Chhatri Nibas': {
    price: 3600,
    securityDeposit: 3500,
    roomSharing: 'Double',
    furnishing: 'Furnished',
    bathroomType: 'Attached bathroom',
    foodIncluded: 'Included in rent',
    foodPreference: 'Veg',
    foodType: 'Veg',
    foodAvailable: true,
    breakfast: 'Available',
    lunch: 'Available',
    dinner: 'Available',
    selfCooking: 'Not available',
    facilities: ['Wi-Fi', 'CCTV', 'Attached bathroom', 'RO Water', 'Study Table'],
    rules: ['Curfew at 8:30 PM', 'Guardian contact verified'],
    lat: 22.4192,
    lng: 87.3178,
    nearby: { college: 'Midnapore College', busStand: 'Ashok Nagar Bus Stop', railwayStation: 'Midnapore Railway Station' }
  },
  'Kanak Mess Cum Paying Guest': {
    price: 3000,
    securityDeposit: 2500,
    roomSharing: 'Double',
    furnishing: 'Furnished',
    bathroomType: 'Common bathroom',
    foodIncluded: 'Included in rent',
    foodPreference: 'Both',
    foodType: 'Both',
    foodAvailable: true,
    breakfast: 'Available',
    lunch: 'Available',
    dinner: 'Available',
    selfCooking: 'Available',
    facilities: ['Wi-Fi', 'RO Water', 'Study Table', 'Parking'],
    rules: ['Quiet hours after 10:30 PM'],
    lat: 22.4198,
    lng: 87.3138,
    nearby: { college: 'Midnapore College', busStand: 'Saratpally Stop', railwayStation: 'Midnapore Railway Station' }
  },
  'Johim Mess': {
    price: 2500,
    securityDeposit: 2000,
    roomSharing: 'Multiple sharing',
    furnishing: 'Furnished',
    bathroomType: 'Common bathroom',
    foodIncluded: 'Charged separately',
    foodPreference: 'Non-veg',
    foodType: 'Non-veg',
    foodAvailable: true,
    breakfast: 'Available',
    lunch: 'Available',
    dinner: 'Available',
    selfCooking: 'Not available',
    facilities: ['Wi-Fi', 'Water Supply', 'Study Table'],
    rules: ['Gate closes at 10 PM'],
    lat: 22.4224,
    lng: 87.3218,
    nearby: { college: 'Midnapore Medical College & Midnapore College', busStand: 'Keranitola Bus Stop', railwayStation: 'Midnapore Railway Station' }
  },
  'Peace Avenue Girls Mess': {
    price: 3900,
    securityDeposit: 4000,
    roomSharing: 'Double',
    furnishing: 'Furnished',
    bathroomType: 'Attached bathroom',
    foodIncluded: 'Included in rent',
    foodPreference: 'Both',
    foodType: 'Both',
    foodAvailable: true,
    breakfast: 'Available',
    lunch: 'Available',
    dinner: 'Available',
    selfCooking: 'Not available',
    facilities: ['Wi-Fi', 'CCTV', 'Attached bathroom', 'RO Water', 'Study Table'],
    rules: ['Curfew 9:00 PM', 'No male visitors inside'],
    lat: 22.4322,
    lng: 87.3012,
    nearby: { college: 'Vidyasagar University', busStand: 'Baisakhipally / V.U. Road Stop', railwayStation: 'Midnapore Railway Station' }
  },
  'Aurobinda Mess': {
    price: 2700,
    securityDeposit: 2000,
    roomSharing: 'Double',
    furnishing: 'Furnished',
    bathroomType: 'Common bathroom',
    foodIncluded: 'Included in rent',
    foodPreference: 'Both',
    foodType: 'Both',
    foodAvailable: true,
    breakfast: 'Available',
    lunch: 'Available',
    dinner: 'Available',
    selfCooking: 'Not available',
    facilities: ['Wi-Fi', 'RO Water', 'Study Table'],
    rules: ['Maintain cleanliness'],
    lat: 22.4242,
    lng: 87.3208,
    nearby: { college: 'Midnapore College', busStand: 'Central Bus Stand', railwayStation: 'Midnapore Railway Station' }
  },
  'Shantiniketan Mess': {
    price: 2800,
    securityDeposit: 2500,
    roomSharing: 'Triple',
    furnishing: 'Furnished',
    bathroomType: 'Common bathroom',
    foodIncluded: 'Included in rent',
    foodPreference: 'Veg',
    foodType: 'Veg',
    foodAvailable: true,
    breakfast: 'Available',
    lunch: 'Available',
    dinner: 'Available',
    selfCooking: 'Available',
    facilities: ['Wi-Fi', 'RO Water', 'Study Table', 'Parking'],
    rules: ['Peaceful study atmosphere'],
    lat: 22.4235,
    lng: 87.3225,
    nearby: { college: 'Midnapore College', busStand: 'Keranitola Bus Stop', railwayStation: 'Midnapore Railway Station' }
  },
  'Bharat PG': {
    price: 4500,
    securityDeposit: 4000,
    roomSharing: 'Single',
    furnishing: 'Furnished',
    bathroomType: 'Attached bathroom',
    foodIncluded: 'Included in rent',
    foodPreference: 'Both',
    foodType: 'Both',
    foodAvailable: true,
    breakfast: 'Available',
    lunch: 'Available',
    dinner: 'Available',
    selfCooking: 'Not available',
    facilities: ['Wi-Fi', 'Laundry', 'Attached bathroom', 'RO Water', 'Parking', 'CCTV'],
    rules: ['Gate closes at 10:30 PM', 'No smoking on premises'],
    lat: 22.3435,
    lng: 87.3285,
    nearby: { college: 'IIT Kharagpur & Kharagpur College', busStand: 'Puratan Bazar Bus Stop', railwayStation: 'Kharagpur Junction' }
  },
  'AFS Apartment': {
    price: 4200,
    securityDeposit: 4000,
    roomSharing: 'Double',
    furnishing: 'Furnished',
    bathroomType: 'Attached bathroom',
    foodIncluded: 'Charged separately',
    foodPreference: 'Both',
    foodType: 'Both',
    foodAvailable: true,
    breakfast: 'Available',
    lunch: 'Available',
    dinner: 'Available',
    selfCooking: 'Available',
    facilities: ['Wi-Fi', 'Attached bathroom', 'Kitchen Access', 'Parking', 'RO Water'],
    rules: ['Self cooking allowed with induction/gas', 'Keep kitchen tidy'],
    lat: 22.3428,
    lng: 87.3274,
    nearby: { college: 'IIT Kharagpur', busStand: 'Puratan Bazar Stand', railwayStation: 'Kharagpur Junction' }
  },
  'Tapas P.G.': {
    price: 3800,
    securityDeposit: 3500,
    roomSharing: 'Double',
    furnishing: 'Furnished',
    bathroomType: 'Attached bathroom',
    foodIncluded: 'Included in rent',
    foodPreference: 'Non-veg',
    foodType: 'Non-veg',
    foodAvailable: true,
    breakfast: 'Available',
    lunch: 'Available',
    dinner: 'Available',
    selfCooking: 'Not available',
    facilities: ['Wi-Fi', 'Attached bathroom', 'RO Water', 'Study Table', 'Parking'],
    rules: ['Entry by 10 PM'],
    lat: 22.3235,
    lng: 87.3165,
    nearby: { college: 'IIT Kharagpur (Bypass Road)', busStand: 'Rabindrapally / Hijli Stop', railwayStation: 'Kharagpur Junction & Hijli Station' }
  },
  'Kharagpur P.G.': {
    price: 3600,
    securityDeposit: 3000,
    roomSharing: 'Double',
    furnishing: 'Furnished',
    bathroomType: 'Common bathroom',
    foodIncluded: 'Included in rent',
    foodPreference: 'Both',
    foodType: 'Both',
    foodAvailable: true,
    breakfast: 'Available',
    lunch: 'Available',
    dinner: 'Available',
    selfCooking: 'Not available',
    facilities: ['Wi-Fi', 'Study Table', 'Laundry', 'RO Water'],
    rules: ['Gate closes at 10:00 PM'],
    lat: 22.3485,
    lng: 87.3348,
    nearby: { college: 'Kharagpur College & IIT Kharagpur', busStand: 'Inda Bazar Bus Stop', railwayStation: 'Kharagpur Junction' }
  },
  'Premium Boys AC PG': {
    price: 5200,
    securityDeposit: 5000,
    roomSharing: 'Single',
    furnishing: 'Furnished',
    bathroomType: 'Attached bathroom',
    foodIncluded: 'Included in rent',
    foodPreference: 'Both',
    foodType: 'Both',
    foodAvailable: true,
    breakfast: 'Available',
    lunch: 'Available',
    dinner: 'Available',
    selfCooking: 'Not available',
    facilities: ['Wi-Fi', 'Attached bathroom', 'Laundry', 'RO Water', 'Parking', 'CCTV'],
    rules: ['Strictly no smoking', 'AC usage charged per meter/included'],
    lat: 22.3528,
    lng: 87.3335,
    nearby: { college: 'Kharagpur College & IIT Kharagpur', busStand: 'Inda / Vidyasagarpur Chawk', railwayStation: 'Kharagpur Junction' }
  },
  'Sujay Kr Sharma PG Hostel': {
    price: 3400,
    securityDeposit: 3000,
    roomSharing: 'Double',
    furnishing: 'Furnished',
    bathroomType: 'Common bathroom',
    foodIncluded: 'Included in rent',
    foodPreference: 'Veg',
    foodType: 'Veg',
    foodAvailable: true,
    breakfast: 'Available',
    lunch: 'Available',
    dinner: 'Available',
    selfCooking: 'Not available',
    facilities: ['Wi-Fi', 'Study Table', 'RO Water', 'Parking'],
    rules: ['Gate closes at 10:00 PM'],
    lat: 22.3248,
    lng: 87.3178,
    nearby: { college: 'IIT Kharagpur', busStand: 'Rabindrapally Stop', railwayStation: 'Kharagpur Junction' }
  },
  'TM - MESS': {
    price: 3100,
    securityDeposit: 2500,
    roomSharing: 'Triple',
    furnishing: 'Furnished',
    bathroomType: 'Common bathroom',
    foodIncluded: 'Included in rent',
    foodPreference: 'Both',
    foodType: 'Both',
    foodAvailable: true,
    breakfast: 'Available',
    lunch: 'Available',
    dinner: 'Available',
    selfCooking: 'Available',
    facilities: ['Wi-Fi', 'RO Water', 'Study Table'],
    rules: ['Cleanliness must be maintained'],
    lat: 22.3375,
    lng: 87.3295,
    nearby: { college: 'Kharagpur College & IIT Kharagpur', busStand: 'Subhaspally Stop', railwayStation: 'Kharagpur Junction' }
  },
  'Uttaran Mess': {
    price: 3000,
    securityDeposit: 2500,
    roomSharing: 'Double',
    furnishing: 'Furnished',
    bathroomType: 'Common bathroom',
    foodIncluded: 'Included in rent',
    foodPreference: 'Veg',
    foodType: 'Veg',
    foodAvailable: true,
    breakfast: 'Available',
    lunch: 'Available',
    dinner: 'Available',
    selfCooking: 'Available',
    facilities: ['Wi-Fi', 'RO Water', 'Study Table', 'Parking'],
    rules: ['Gate closes at 10 PM'],
    lat: 22.3555,
    lng: 87.3292,
    nearby: { college: 'Kharagpur College', busStand: 'Panchberia / Vidyasagarpur Stop', railwayStation: 'Kharagpur Junction' }
  }
};

(async () => {
  const verifiedGoogleContacts = {
    'Silver Spring Boys Mess': { phone: '8116139302', ownerName: 'Silver Spring Boys Mess (Proprietor)', email: '' },
    'Debi Sarbajaya Mess': { phone: '9564276556', ownerName: 'Satyajit Kar', email: '' },
    'Manjusri Chatrinivas': { phone: '8016801695', ownerName: 'Manjusri Chatrinivas (Proprietor)', email: '' },
    'Chakadola Ladies Mess': { phone: '9933792343', ownerName: 'Chakadola Ladies Mess (Proprietor)', email: '' },
    'Bhadra Mess Bari': { phone: '8900160090', ownerName: 'Bhadra Family (Proprietor)', email: '' },
    'Sahachari Chhatri Nibas': { phone: '9800301838', ownerName: 'Goutam Sarkar', email: 'sahacharichatrinibas@gmail.com' },
    'Peace Avenue Girls Mess': { phone: '7001540634', ownerName: 'Peace Avenue Girls Mess (Proprietor)', email: '' },
    'Bharat PG': { phone: '9382677161', ownerName: 'Bharat PG (Proprietor)', email: '' },
    'AFS Apartment': { phone: '8918074950', ownerName: 'AFS Real Estate (Proprietor)', email: '' },
    'Tapas P.G.': { phone: '9434193050', ownerName: 'Tapas (Tapas Home Stay)', email: 'tapas.bdarshan@gmail.com' },
    'Kharagpur P.G.': { phone: '7679455348', ownerName: 'Kharagpur P.G. (Proprietor)', email: '' },
    'Premium Boys AC PG': { phone: '7873800938', ownerName: 'Regent Saras PG Management', email: '' },
    'Sujay Kr Sharma PG Hostel': { phone: '', ownerName: 'Sujay Kr Sharma', email: '' },
    'Puspak Mess': { phone: '', ownerName: 'Puspak Mess (Proprietor)', email: '' },
    'Kanak Mess Cum Paying Guest': { phone: '', ownerName: 'Kanak Mess (Proprietor)', email: '' },
    'Johim Mess': { phone: '', ownerName: 'Johim Mess (Proprietor)', email: '' },
    'Aurobinda Mess': { phone: '', ownerName: 'Aurobinda Mess (Proprietor)', email: '' },
    'Shantiniketan Mess': { phone: '', ownerName: 'Shantiniketan Mess (Proprietor)', email: '' },
    'TM - MESS': { phone: '', ownerName: 'TM - MESS (Proprietor)', email: '' },
    'Uttaran Mess': { phone: '', ownerName: 'Uttaran Mess (Proprietor)', email: '' }
  };

  const User = require(path.join(cwd, 'models/user'));
  const Booking = require(path.join(cwd, 'models/Booking'));
  await mongoose.connect(process.env.MONGO_URI);
  // Clear fake demo owner phone number
  await mongoose.connection.collection('users').updateOne({ email: 'owner@messhunt.com' }, { $set: { phone: '' } });
  await mongoose.connection.collection('users').updateOne({ email: 'maityankana@gmail.com' }, { $set: { name: 'Anu', phone: '', role: 'owner', isActive: true, ownerVerified: true } });
  await mongoose.connection.collection('users').updateOne({ email: 'maityankana913@gmail.com' }, { $set: { name: 'Ankana', phone: '' } });
  await mongoose.connection.collection('users').updateOne({ email: 'pialighosh@gmail.com' }, { $set: { role: 'owner', isActive: true, ownerVerified: true } });

  // Ensure the 4 owner accounts exist:
  // 1. maityankana@gmail.com (Anu)
  // 2. pialighosh@gmail.com (piali ghosh)
  // 3. shrestha@gmail.com (password: 1234)
  // 4. anima@gmail.com (password: 1234)
  const ensureOwner = async (email, name, defaultPassword) => {
    let u = await User.findOne({ email: email.toLowerCase() });
    if (!u) {
      u = new User({ name, email: email.toLowerCase(), password: defaultPassword, role: 'owner', isActive: true, ownerVerified: true });
      await u.save();
    } else if (defaultPassword) {
      u.name = name;
      u.role = 'owner';
      u.isActive = true;
      u.ownerVerified = true;
      u.password = defaultPassword;
      await u.save();
    }
    return u;
  };

  const owner1 = await ensureOwner('maityankana@gmail.com', 'Anu', null);
  const owner2 = await ensureOwner('pialighosh@gmail.com', 'piali ghosh', null);
  const owner3 = await ensureOwner('shrestha@gmail.com', 'Shrestha', '1234');
  const owner4 = await ensureOwner('anima@gmail.com', 'Anima', '1234');

  // Ensure Admin account Piali Ghosh (pialighosh2006@gmail.com / ghosh123) exists with role 'admin'
  let pialiAdmin = await User.findOne({ email: 'pialighosh2006@gmail.com' });
  if (!pialiAdmin) {
    pialiAdmin = new User({
      name: 'Piali Ghosh',
      email: 'pialighosh2006@gmail.com',
      password: 'ghosh123',
      role: 'admin',
      isActive: true
    });
    await pialiAdmin.save();
  } else {
    pialiAdmin.name = 'Piali Ghosh';
    pialiAdmin.password = 'ghosh123';
    pialiAdmin.role = 'admin';
    pialiAdmin.isActive = true;
    await pialiAdmin.save();
  }

  // Divide the 20 mess listings across the 4 owners (3, 5, 4, 8):
  const ownerByMessName = {
    // 1. Anu (maityankana@gmail.com) — 3 listings
    'Debi Sarbajaya Mess': owner1._id,
    'Puspak Mess': owner1._id,
    'Uttaran Mess': owner1._id,

    // 2. Piali (pialighosh@gmail.com) — 5 listings
    'Sahachari Chhatri Nibas': owner2._id,
    'Kanak Mess Cum Paying Guest': owner2._id,
    'Johim Mess': owner2._id,
    'Peace Avenue Girls Mess': owner2._id,
    'Manjusri Chatrinivas': owner2._id,

    // 3. Shrestha (shrestha@gmail.com, password: 1234) — 4 listings
    'Silver Spring Boys Mess': owner3._id,
    'Chakadola Ladies Mess': owner3._id,
    'Bhadra Mess Bari': owner3._id,
    'Aurobinda Mess': owner3._id,

    // 4. Anima (anima@gmail.com, password: 1234) — 8 listings
    'Shantiniketan Mess': owner4._id,
    'Bharat PG': owner4._id,
    'AFS Apartment': owner4._id,
    'Tapas P.G.': owner4._id,
    'Kharagpur P.G.': owner4._id,
    'Premium Boys AC PG': owner4._id,
    'Sujay Kr Sharma PG Hostel': owner4._id,
    'TM - MESS': owner4._id
  };

  const verifiedImages = {
    'Debi Sarbajaya Mess': ['/uploads/messes/Screenshot-2026-11-21-221908-1795279762134-1.png', '/uploads/messes/Screenshot-2026-11-21-222444-1795280104466-1.png'],
    'Manjusri Chatrinivas': ['/uploads/messes/Screenshot-2026-11-21-221824-1795279715034-1.png'],
    'Chakadola Ladies Mess': ['/uploads/messes/Screenshot-2026-11-21-221557-1795279575509-1.png'],
    'Bhadra Mess Bari': ['/uploads/messes/Screenshot-2026-11-21-221453-1795279516340-1.png'],
    'Sahachari Chhatri Nibas': ['/uploads/messes/Screenshot-2026-11-21-221412-1795279463100-1.png'],
    'Kanak Mess Cum Paying Guest': ['/uploads/messes/Screenshot-2026-11-21-221320-1795279412265-1.png'],
    'Johim Mess': ['/uploads/messes/Screenshot-2026-11-21-221204-1795279353828-1.png'],
    'Peace Avenue Girls Mess': ['/uploads/messes/Screenshot-2026-11-21-221102-1795279275610-1.png'],
    'Shantiniketan Mess': ['/uploads/messes/Screenshot-2026-11-21-221003-1795279216975-1.png'],
    'Bharat PG': ['/uploads/messes/Screenshot-2026-11-21-220835-1795279145870-1.png'],
    'AFS Apartment': ['/uploads/messes/Screenshot-2026-11-21-220408-1795278859335-1.png'],
    'Tapas P.G.': ['/uploads/messes/Screenshot-2026-11-21-220234-1795278784794-1.png'],
    'Kharagpur P.G.': ['/uploads/messes/Screenshot-2026-11-21-220127-1795278702322-1.png'],
    'Premium Boys AC PG': ['/uploads/messes/Screenshot-2026-11-21-215926-1795278577719-1.png'],
    'Sujay Kr Sharma PG Hostel': ['/uploads/messes/Screenshot-2026-11-21-212414-1795278497212-1.png'],
    'Aurobinda Mess': ['/uploads/messes/Screenshot-2026-11-21-211428-1795275896212-1.png'],
    'Puspak Mess': ['/uploads/messes/Screenshot-2026-11-21-210842-1795275559398-1.png'],
    'Silver Spring Boys Mess': ['/uploads/messes/Screenshot-2026-11-21-212759-1795278390740-1.png']
  };

  let count = 0;
  for (const [name, data] of Object.entries(updates)) {
    const mess = await Mess.findOne({ name });
    if (mess) {
      mess.price = data.price;
      mess.securityDeposit = data.securityDeposit;
      mess.roomSharing = data.roomSharing;
      mess.furnishing = data.furnishing;
      mess.bathroomType = data.bathroomType;
      mess.foodIncluded = data.foodIncluded;
      mess.foodPreference = data.foodPreference;
      mess.foodType = data.foodType;
      mess.foodAvailable = data.foodAvailable;
      mess.breakfast = data.breakfast;
      mess.lunch = data.lunch;
      mess.dinner = data.dinner;
      mess.selfCooking = data.selfCooking;
      mess.facilities = data.facilities;
      mess.rules = data.rules;
      if ((!mess.images || mess.images.length === 0) && verifiedImages[name]) {
        mess.images = verifiedImages[name];
      }
      if (ownerByMessName[name]) {
        mess.owner = ownerByMessName[name];
      }
      const info = verifiedGoogleContacts[name] || { phone: '', ownerName: `${name} (Proprietor)`, email: '' };
      mess.ownerName = info.ownerName;
      mess.contactPhone = info.phone;
      mess.whatsapp = info.phone;
      mess.contactEmail = info.email;
      const placeQuery = [mess.name, mess.address || mess.area, mess.city, 'West Bengal'].filter(Boolean).join(', ');
      mess.location = {
        lat: data.lat,
        lng: data.lng,
        mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeQuery)}`
      };
      mess.nearby = data.nearby;
      mess.approvalStatus = 'approved';
      mess.availabilityStatus = 'available';
      await mess.save();
      await Booking.updateMany({ mess: mess._id }, { $set: { owner: mess.owner } });
      count++;
    }
  }
  console.log(`Updated ${count} listings with verified owner names, Google phone numbers, emails, and coordinates.`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });

