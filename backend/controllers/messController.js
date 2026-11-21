const Mess = require('../models/Mess');
const asyncHandler = require('../utils/asyncHandler');

const parseBoolean = (val) => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return ['true', '1', 'yes'].includes(val.toLowerCase());
  return false;
};

const toArray = (v) => {
  if (Array.isArray(v)) return v.map(s => String(s).trim()).filter(Boolean);
  if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
  return [];
};

const normalizeAccommodationType = (v) => {
  const s = String(v || '').trim();
  if (/^boys$/i.test(s)) return 'Boys';
  if (/^girls$/i.test(s)) return 'Girls';
  if (/^(unisex|co-?ed)$/i.test(s)) return 'Unisex';
  return '';
};

const LOCALITY_COORDS = [
  { match: /gate\s*no\.?\s*3|chakadola/i, lat: 22.4316, lng: 87.2994 },
  { match: /baisakhipally/i, lat: 22.4322, lng: 87.3012 },
  { match: /ramayan\s*para|tantigeria/i, lat: 22.4304, lng: 87.3025 },
  { match: /rangamati|paramedical/i, lat: 22.4292, lng: 87.2998 },
  { match: /vidyasagar\s*university|v\.?u\.?\s*road/i, lat: 22.4310, lng: 87.2980 },
  { match: /boxibazar|patnabazar/i, lat: 22.4172, lng: 87.3282 },
  { match: /raja\s*bazar|collegiate/i, lat: 22.4216, lng: 87.3258 },
  { match: /ashok\s*nagar|smriti/i, lat: 22.4192, lng: 87.3178 },
  { match: /saratpally/i, lat: 22.4198, lng: 87.3138 },
  { match: /mahatabpur|judges\s*court/i, lat: 22.4158, lng: 87.3195 },
  { match: /keranitola|midnapore\s*college/i, lat: 22.4235, lng: 87.3222 },
  { match: /panchberia|vidyasagarpur|regent\s*saras/i, lat: 22.3542, lng: 87.3312 },
  { match: /ramkrishnapally|inda/i, lat: 22.3485, lng: 87.3348 },
  { match: /puratan\s*bazar|kar\s*gaddi/i, lat: 22.3432, lng: 87.3280 },
  { match: /subhaspally/i, lat: 22.3375, lng: 87.3295 },
  { match: /rabindrapally|iit\s*bypass|hijli|prembazar/i, lat: 22.3240, lng: 87.3170 },
  { match: /gole\s*bazar/i, lat: 22.3418, lng: 87.3171 },
  { match: /malancha/i, lat: 22.3443, lng: 87.2866 },
  { match: /nimpura/i, lat: 22.3257, lng: 87.2654 },
  { match: /ghatal/i, lat: 22.6675, lng: 87.7347 },
  { match: /chandrakona/i, lat: 22.7336, lng: 87.5150 },
  { match: /debra/i, lat: 22.3833, lng: 87.5500 },
  { match: /garbeta/i, lat: 22.8631, lng: 87.3586 },
  { match: /salboni/i, lat: 22.6428, lng: 87.3275 },
  { match: /keshpur/i, lat: 22.5539, lng: 87.4667 },
  { match: /dantan/i, lat: 21.9461, lng: 87.2708 },
  { match: /pingla/i, lat: 22.2736, lng: 87.5861 },
  { match: /narayangarh/i, lat: 22.1528, lng: 87.3917 },
  { match: /jhargram/i, lat: 22.4550, lng: 86.9974 },
  { match: /kharagpur/i, lat: 22.3397, lng: 87.3250 },
  { match: /midnapore|medinipur/i, lat: 22.4235, lng: 87.3210 },
];

const inferLocationFromFields = (payload) => {
  const combined = [payload.name, payload.address, payload.area, payload.nearby?.college, payload.city].filter(Boolean).join(' ');
  for (const entry of LOCALITY_COORDS) {
    if (entry.match.test(combined)) {
      // Deterministic tiny offset by name so two messes in the same area remain distinct pins
      const str = String(payload.name || '');
      let hash = 0;
      for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i);
      const offsetLat = ((hash % 7) - 3) * 0.00018;
      const offsetLng = (((hash >> 3) % 7) - 3) * 0.00018;
      return {
        lat: Number((entry.lat + offsetLat).toFixed(5)),
        lng: Number((entry.lng + offsetLng).toFixed(5)),
      };
    }
  }
  return { lat: 22.4235, lng: 87.3210 };
};

const buildMessPayload = (body, ownerId, isCreate = false) => {
  const payload = {};
  const fields = [
    'name','description','address','area','city','price','securityDeposit','roomType','roomSharing','furnishing','bathroomType',
    'gender','accommodationType','foodType','foodAvailable','foodIncluded','foodPreference','breakfast','lunch','dinner',
    'selfCooking','kitchenAccess','cookingGas','inductionCooking','electricityCharges','waterSupply',
    'facilities','rules','contactPhone','contactEmail','whatsapp','images','availabilityStatus'
  ];
  for (const f of fields) {
    if (Object.prototype.hasOwnProperty.call(body, f)) payload[f] = body[f];
  }

  // Nearby
  if (body.nearby || body.nearbyCollege || body.nearbyBusStand || body.nearbyRailwayStation) {
    payload.nearby = {
      college: (body.nearby?.college ?? body.nearbyCollege ?? '').toString().trim(),
      busStand: (body.nearby?.busStand ?? body.nearbyBusStand ?? '').toString().trim(),
      railwayStation: (body.nearby?.railwayStation ?? body.nearbyRailwayStation ?? '').toString().trim(),
    };
  }

  // Location (with automatic coordinate & Google Maps URL fallback when owner leaves lat/lng blank)
  const rawLat = body.lat !== undefined && body.lat !== '' && body.lat !== null ? Number(body.lat) : (body.location?.lat ?? null);
  const rawLng = body.lng !== undefined && body.lng !== '' && body.lng !== null ? Number(body.lng) : (body.location?.lng ?? null);
  const hasValidCoords = rawLat !== null && rawLng !== null && !Number.isNaN(Number(rawLat)) && !Number.isNaN(Number(rawLng));
  const rawMapUrl = (body.mapUrl ?? body.location?.mapUrl ?? '').toString().trim();

  if (hasValidCoords || rawMapUrl || isCreate || Object.prototype.hasOwnProperty.call(body, 'lat') || Object.prototype.hasOwnProperty.call(body, 'address') || Object.prototype.hasOwnProperty.call(body, 'area') || Object.prototype.hasOwnProperty.call(body, 'city')) {
    const inferred = hasValidCoords ? { lat: Number(rawLat), lng: Number(rawLng) } : inferLocationFromFields(payload);
    const placeQuery = [payload.name, payload.address || payload.area, payload.city || 'Midnapore', 'West Bengal'].filter(Boolean).join(', ');
    payload.location = {
      lat: inferred.lat,
      lng: inferred.lng,
      mapUrl: rawMapUrl || (placeQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeQuery)}` : ''),
    };
  } else if (body.location) {
    payload.location = body.location;
  }

  // Types/conversions
  if (payload.price !== undefined && payload.price !== '') payload.price = Number(payload.price);
  if (payload.securityDeposit === '' || payload.securityDeposit === undefined) {
    // keep null if explicitly blank in create? but don't overwrite unintentionally on partial update unless provided
    if (isCreate || Object.prototype.hasOwnProperty.call(body, 'securityDeposit')) payload.securityDeposit = null;
  } else if (payload.securityDeposit !== undefined) {
    payload.securityDeposit = Number(payload.securityDeposit);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'facilities')) payload.facilities = toArray(payload.facilities);
  if (Object.prototype.hasOwnProperty.call(body, 'rules')) payload.rules = toArray(payload.rules);
  if (Object.prototype.hasOwnProperty.call(body, 'images')) payload.images = toArray(payload.images);
  if (Object.prototype.hasOwnProperty.call(body, 'foodAvailable')) payload.foodAvailable = parseBoolean(payload.foodAvailable);

  // Normalize accommodation type and keep gender in sync for compatibility
  const acc = normalizeAccommodationType(payload.accommodationType || payload.gender);
  if (acc) {
    payload.accommodationType = acc;
    payload.gender = acc === 'Unisex' ? 'Co-ed' : acc; // maintain compatibility with existing enum usage
  } else if (payload.accommodationType) {
    payload.accommodationType = String(payload.accommodationType).trim();
  }

  // Derive foodAvailable if foodIncluded/foodPreference indicates no food
  if (payload.foodIncluded === 'Not available' || payload.foodPreference === 'No food') {
    payload.foodAvailable = false;
  }

  // Keep legacy foodType aligned if foodPreference provided
  if (payload.foodPreference && payload.foodPreference !== 'Not specified' && !payload.foodType) {
    payload.foodType = payload.foodPreference === 'Non-veg' ? 'Non-Veg' : payload.foodPreference;
  }

  if (isCreate) {
    payload.owner = ownerId;
    payload.approvalStatus = 'approved';
  }
  return payload;
};

const escapeRegex = (s) => String(s).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Public: list approved & available messes with search/filter/sort/pagination
const getPublicMesses = asyncHandler(async (req, res) => {
  const {
    search = '',
    location, // preferred
    area, city,
    accommodationType, gender,
    foodPreference, foodType,
    minPrice, maxPrice,
    nearby, // college | bus | railway
    facilities,
    sort = 'newest',
    page = 1,
    limit = 12
  } = req.query;

  const query = { approvalStatus: 'approved', availabilityStatus: 'available' };

  // Text/location search (case-insensitive, handles autocomplete strings like "Midnapore (Medinipur)" & synonyms)
  const expandLocationSynonyms = (raw) => {
    const terms = new Set();
    const cleaned = String(raw || '').trim();
    if (!cleaned) return [];
    terms.add(cleaned);
    cleaned.split(/[(),/]+/).map(s => s.trim()).filter(Boolean).forEach(p => terms.add(p));
    Array.from(terms).forEach(t => {
      if (/^midnapore$/i.test(t) || /^medinipur$/i.test(t)) {
        terms.add('Midnapore');
        terms.add('Medinipur');
      }
      if (/^kgp$/i.test(t)) terms.add('Kharagpur');
      if (/^vu$/i.test(t)) terms.add('Vidyasagar University');
    });
    return Array.from(terms);
  };

  const searchText = String(search || '').trim();
  if (searchText) {
    const searchVariants = expandLocationSynonyms(searchText);
    const searchOr = [];
    searchVariants.forEach(term => {
      const regex = new RegExp(escapeRegex(term), 'i');
      searchOr.push(
        { name: regex }, { area: regex }, { address: regex }, { city: regex }, { description: regex },
        { accommodationType: regex }, { gender: regex },
        { foodType: regex }, { foodPreference: regex }, { roomType: regex }, { roomSharing: regex },
        { facilities: { $elemMatch: { $regex: regex } } },
        { 'nearby.college': regex }, { 'nearby.busStand': regex }, { 'nearby.railwayStation': regex }
      );
    });
    query.$and = [...(query.$and || []), { $or: searchOr }];
  }

  // Location filter is applied independently of the hero search (so both can be combined).
  const locationText = String(location || (searchText ? '' : area) || '').trim();
  if (locationText) {
    const parts = expandLocationSynonyms(locationText);
    const locOr = [];
    parts.forEach(p => {
      const r = new RegExp(escapeRegex(p), 'i');
      locOr.push(
        { area: r }, { address: r }, { city: r },
        { 'nearby.college': r }, { 'nearby.busStand': r }, { 'nearby.railwayStation': r }
      );
    });
    query.$and = [...(query.$and || []), { $or: locOr }];
  }
  if (city) {
    const cityVariants = expandLocationSynonyms(city);
    query.$and = [...(query.$and || []), { $or: cityVariants.map(c => ({ city: new RegExp(escapeRegex(c), 'i') })) }];
  }
  if (area && searchText && !location) query.area = new RegExp(escapeRegex(area), 'i');

  // Accommodation type (Boys/Girls/Unisex) with compatibility
  const acc = normalizeAccommodationType(accommodationType || gender);
  if (acc === 'Boys') query.$and = [...(query.$and || []), { $or: [{ accommodationType: 'Boys' }, { gender: 'Boys' }] }];
  if (acc === 'Girls') query.$and = [...(query.$and || []), { $or: [{ accommodationType: 'Girls' }, { gender: 'Girls' }] }];
  if (acc === 'Unisex') query.$and = [...(query.$and || []), { $or: [{ accommodationType: 'Unisex' }, { gender: { $in: ['Co-ed', 'Unisex', 'Any'] } }] }];

  // Food preference (Veg/Non-veg/Both/No food)
  const fp = String(foodPreference || foodType || '').trim().toLowerCase();
  if (fp) {
    const foodAnd = query.$and || [];
    if (fp === 'no food' || fp === 'no-food' || fp === 'none') {
      foodAnd.push({ $or: [{ foodIncluded: 'Not available' }, { foodAvailable: false }, { foodPreference: 'No food' }] });
    } else if (fp === 'veg') {
      foodAnd.push({ $or: [{ foodPreference: /^veg$/i }, { foodType: /^veg$/i }] });
    } else if (fp === 'non-veg' || fp === 'nonveg' || fp === 'non veg') {
      foodAnd.push({ $or: [{ foodPreference: /^non-?veg$/i }, { foodType: /^non-?veg$/i }] });
    } else if (fp === 'both') {
      foodAnd.push({ $or: [{ foodPreference: /^both$/i }, { foodType: /both|veg\s*\+/i }] });
    }
    if (foodAnd.length) query.$and = foodAnd;
  }

  // Budget
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice !== '' && minPrice !== undefined) query.price.$gte = Number(minPrice);
    if (maxPrice !== '' && maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    if (Object.keys(query.price).length === 0) delete query.price;
  }

  // Nearby places filter (text-based, only matches if owner provided info)
  if (nearby) {
    const n = String(nearby).toLowerCase();
    const nearAnd = query.$and || [];
    if (n === 'college' || n === 'university' || n === 'college_university') {
      nearAnd.push({ 'nearby.college': { $exists: true, $nin: ['', null] } });
    } else if (n === 'bus' || n === 'bus_stand' || n === 'bus-stand') {
      nearAnd.push({ 'nearby.busStand': { $exists: true, $nin: ['', null] } });
    } else if (n === 'railway' || n === 'railway_station' || n === 'railway-station') {
      nearAnd.push({ 'nearby.railwayStation': { $exists: true, $nin: ['', null] } });
    }
    if (nearAnd.length) query.$and = nearAnd;
  }

  // Facilities (flexible: match if listing has AT LEAST ONE of the selected facilities)
  if (facilities) {
    const facs = String(facilities).split(',').map(s => s.trim()).filter(Boolean);
    const facOr = [];
    facs.forEach(f => {
      if (/attached bathroom/i.test(f)) {
        facOr.push(
          { bathroomType: /attached/i },
          { facilities: { $elemMatch: { $regex: /attached/i } } }
        );
      } else {
        facOr.push({ facilities: { $elemMatch: { $regex: new RegExp(escapeRegex(f), 'i') } } });
      }
    });
    if (facOr.length) query.$and = [...(query.$and || []), { $or: facOr }];
  }

  let sortObj = { createdAt: -1 };
  if (sort === 'price_asc') sortObj = { price: 1, createdAt: -1 };
  else if (sort === 'price_desc') sortObj = { price: -1, createdAt: -1 };
  else if (sort === 'rating_desc') sortObj = { averageRating: -1, reviewCount: -1, createdAt: -1 };
  else if (sort === 'oldest') sortObj = { createdAt: 1 };

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 50);
  const skip = (pageNum - 1) * limitNum;

  const [items, total] = await Promise.all([
    Mess.find(query).populate('owner', 'name phone email ownerVerified').sort(sortObj).skip(skip).limit(limitNum),
    Mess.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) || 1 }
  });
});

const getPublicMessById = asyncHandler(async (req, res) => {
  const mess = await Mess.findById(req.params.id).populate('owner', 'name phone email ownerVerified role');
  if (!mess) return res.status(404).json({ success: false, message: 'Mess listing not found.' });

  const isOwner = req.user && String(mess.owner?._id || mess.owner) === String(req.user._id);
  const isAdmin = req.user && req.user.role === 'admin';
  if (mess.approvalStatus !== 'approved' && !isOwner && !isAdmin) {
    return res.status(404).json({ success: false, message: 'Mess listing not found.' });
  }
  res.json({ success: true, data: mess });
});

const getFeaturedMesses = asyncHandler(async (req, res) => {
  const items = await Mess.find({ approvalStatus: 'approved', availabilityStatus: 'available' })
    .sort({ averageRating: -1, reviewCount: -1, createdAt: -1 })
    .limit(6)
    .populate('owner', 'name ownerVerified');
  res.json({ success: true, data: items });
});

const getRecentMesses = asyncHandler(async (req, res) => {
  const items = await Mess.find({ approvalStatus: 'approved', availabilityStatus: 'available' })
    .sort({ createdAt: -1 })
    .limit(6)
    .populate('owner', 'name ownerVerified');
  res.json({ success: true, data: items });
});

// Owner
const createMess = asyncHandler(async (req, res) => {
  const payload = buildMessPayload(req.body || {}, req.user._id, true);
  if (!payload.name || payload.price === undefined || Number.isNaN(Number(payload.price))) {
    return res.status(400).json({ success: false, message: 'Mess name and valid price are required.' });
  }
  const mess = await Mess.create(payload);
  res.status(201).json({ success: true, message: 'Mess listing created and published.', data: mess });
});

const getMyMesses = asyncHandler(async (req, res) => {
  const Review = require('../models/Review');
  const items = await Mess.find({}).sort({ createdAt: -1 });
  // Ensure ratings & review counts strictly reflect real student reviews in DB
  const stats = await Review.aggregate([
    { $match: { isHidden: { $ne: true } } },
    { $group: { _id: '$mess', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  const statMap = new Map(stats.map(s => [String(s._id), s]));
  const enriched = items.map(m => {
    const obj = m.toObject();
    const st = statMap.get(String(m._id));
    obj.averageRating = st ? Math.round(st.avgRating * 10) / 10 : 0;
    obj.reviewCount = st ? st.count : 0;
    return obj;
  });
  res.json({ success: true, data: enriched });
});

const updateMyMess = asyncHandler(async (req, res) => {
  const mess = await Mess.findById(req.params.id);
  if (!mess) return res.status(404).json({ success: false, message: 'Mess listing not found.' });
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only mess owners can edit listings.' });
  }
  const payload = buildMessPayload(req.body || {}, req.user._id, false);
  delete payload.owner;
  Object.assign(mess, payload);
  await mess.save();
  res.json({ success: true, message: 'Mess listing updated.', data: mess });
});

const deleteMyMess = asyncHandler(async (req, res) => {
  const mess = await Mess.findById(req.params.id);
  if (!mess) return res.status(404).json({ success: false, message: 'Mess listing not found.' });
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this listing.' });
  }
  const Booking = require('../models/Booking');
  const Review = require('../models/Review');
  await Promise.all([
    Booking.deleteMany({ mess: mess._id }),
    Review.deleteMany({ mess: mess._id }),
    mess.deleteOne()
  ]);
  res.json({ success: true, message: 'Mess listing deleted.' });
});

module.exports = {
  getPublicMesses, getPublicMessById, getFeaturedMesses, getRecentMesses,
  createMess, getMyMesses, updateMyMess, deleteMyMess
};
