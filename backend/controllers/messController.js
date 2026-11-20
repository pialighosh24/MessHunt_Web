const Mess = require('../models/Mess');
const asyncHandler = require('../utils/asyncHandler');

const parseBoolean = (val) => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return ['true', '1', 'yes'].includes(val.toLowerCase());
  return false;
};

const buildMessPayload = (body, ownerId, isCreate = false) => {
  const payload = {};
  const fields = ['name','description','address','area','city','price','roomType','gender','foodType','foodAvailable','facilities','rules','contactPhone','contactEmail','whatsapp','images','availabilityStatus'];
  for (const f of fields) {
    if (Object.prototype.hasOwnProperty.call(body, f)) payload[f] = body[f];
  }
  if (Object.prototype.hasOwnProperty.call(body, 'lat') || Object.prototype.hasOwnProperty.call(body, 'lng') || Object.prototype.hasOwnProperty.call(body, 'mapUrl')) {
    payload.location = {
      lat: body.lat !== undefined && body.lat !== '' ? Number(body.lat) : (body.location?.lat ?? null),
      lng: body.lng !== undefined && body.lng !== '' ? Number(body.lng) : (body.location?.lng ?? null),
      mapUrl: body.mapUrl ?? body.location?.mapUrl ?? '',
    };
  } else if (body.location) {
    payload.location = body.location;
  }
  if (typeof payload.price === 'string') payload.price = Number(payload.price);
  if (typeof payload.facilities === 'string') payload.facilities = payload.facilities.split(',').map(s => s.trim()).filter(Boolean);
  if (typeof payload.rules === 'string') payload.rules = payload.rules.split(',').map(s => s.trim()).filter(Boolean);
  if (typeof payload.images === 'string') payload.images = payload.images.split(',').map(s => s.trim()).filter(Boolean);
  if (isCreate) {
    payload.owner = ownerId;
    payload.approvalStatus = 'pending';
  }
  return payload;
};

// Public: list approved & available messes with search/filter/sort/pagination
const getPublicMesses = asyncHandler(async (req, res) => {
  const {
    search = '', area, city, gender, foodType, foodAvailable, roomType, minPrice, maxPrice,
    facilities, availability, sort = 'newest', page = 1, limit = 12
  } = req.query;

  const query = { approvalStatus: 'approved', availabilityStatus: 'available' };

  if (search) {
    const regex = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [
      { name: regex }, { area: regex }, { address: regex }, { city: regex }, { description: regex }, { foodType: regex }, { roomType: regex }
    ];
  }
  if (area) query.area = new RegExp(`^${String(area).trim()}$`, 'i');
  if (city) query.city = new RegExp(String(city).trim(), 'i');
  if (gender) query.gender = gender;
  if (roomType) query.roomType = new RegExp(String(roomType).trim(), 'i');
  if (foodType) query.foodType = new RegExp(String(foodType).trim(), 'i');
  if (foodAvailable !== undefined) query.foodAvailable = parseBoolean(foodAvailable);
  if (availability) query.availabilityStatus = availability;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }
  if (facilities) {
    const facs = String(facilities).split(',').map(s => s.trim()).filter(Boolean);
    if (facs.length) query.facilities = { $all: facs.map(f => new RegExp(f, 'i')) };
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

  // Public can view only approved listings in general; owner/admin may view their own/non-approved via separate routes,
  // but details endpoint should be useful. Allow if approved, else only owner/admin.
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
  // If owner edits an approved listing, set back to pending for re-approval? safer to require approval; keep simple: set pending on substantive edits
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
