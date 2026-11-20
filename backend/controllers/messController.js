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

  // Location
  if (Object.prototype.hasOwnProperty.call(body, 'lat') || Object.prototype.hasOwnProperty.call(body, 'lng') || Object.prototype.hasOwnProperty.call(body, 'mapUrl')) {
    payload.location = {
      lat: body.lat !== undefined && body.lat !== '' ? Number(body.lat) : (body.location?.lat ?? null),
      lng: body.lng !== undefined && body.lng !== '' ? Number(body.lng) : (body.location?.lng ?? null),
      mapUrl: body.mapUrl ?? body.location?.mapUrl ?? '',
    };
  } else if (body.location) {
    payload.location = body.location;
  }

  // Nearby
  if (body.nearby || body.nearbyCollege || body.nearbyBusStand || body.nearbyRailwayStation) {
    payload.nearby = {
      college: (body.nearby?.college ?? body.nearbyCollege ?? '').toString().trim(),
      busStand: (body.nearby?.busStand ?? body.nearbyBusStand ?? '').toString().trim(),
      railwayStation: (body.nearby?.railwayStation ?? body.nearbyRailwayStation ?? '').toString().trim(),
    };
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
    payload.approvalStatus = 'pending';
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

  // Text/location search (case-insensitive, partial)
  const searchText = String(search || location || area || '').trim();
  if (searchText) {
    const regex = new RegExp(escapeRegex(searchText), 'i');
    query.$or = [
      { name: regex }, { area: regex }, { address: regex }, { city: regex }, { description: regex },
      { foodType: regex }, { foodPreference: regex }, { roomType: regex }, { roomSharing: regex },
      { 'nearby.college': regex }, { 'nearby.busStand': regex }, { 'nearby.railwayStation': regex }
    ];
  }
  if (city) query.city = new RegExp(escapeRegex(city), 'i');
  if (area && !search) query.area = new RegExp(escapeRegex(area), 'i');

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
      foodAnd.push({ $or: [{ foodPreference: /^both$/i }, { foodType: /both|veg\s*\+|non-?veg/i }] });
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

  // Facilities (simple useful set supported; match in facilities array or bathroomType field)
  if (facilities) {
    const facs = String(facilities).split(',').map(s => s.trim()).filter(Boolean);
    const facAnd = query.$and || [];
    facs.forEach(f => {
      if (/attached bathroom/i.test(f)) {
        facAnd.push({ $or: [
          { bathroomType: /attached/i },
          { facilities: { $elemMatch: { $regex: /attached/i } } }
        ]});
      } else {
        facAnd.push({ facilities: { $elemMatch: { $regex: new RegExp(escapeRegex(f), 'i') } } });
      }
    });
    if (facAnd.length) query.$and = facAnd;
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
  res.status(201).json({ success: true, message: 'Mess listing created and submitted for approval.', data: mess });
});

const getMyMesses = asyncHandler(async (req, res) => {
  const items = await Mess.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: items });
});

const updateMyMess = asyncHandler(async (req, res) => {
  const mess = await Mess.findById(req.params.id);
  if (!mess) return res.status(404).json({ success: false, message: 'Mess listing not found.' });
  if (String(mess.owner) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'You can only edit your own listings.' });
  }
  const payload = buildMessPayload(req.body || {}, req.user._id, false);
  delete payload.owner;
  Object.assign(mess, payload);
  if (mess.approvalStatus === 'approved') {
    mess.approvalStatus = 'pending';
    mess.rejectionReason = '';
  }
  await mess.save();
  res.json({ success: true, message: 'Mess listing updated.', data: mess });
});

const deleteMyMess = asyncHandler(async (req, res) => {
  const mess = await Mess.findById(req.params.id);
  if (!mess) return res.status(404).json({ success: false, message: 'Mess listing not found.' });
  if (String(mess.owner) !== String(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this listing.' });
  }
  await mess.deleteOne();
  res.json({ success: true, message: 'Mess listing deleted.' });
});

module.exports = {
  getPublicMesses, getPublicMessById, getFeaturedMesses, getRecentMesses,
  createMess, getMyMesses, updateMyMess, deleteMyMess
};
