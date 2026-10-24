import crypto from 'crypto';
import User from '../models/User.js';
import Donation from '../models/Donation.js';
import PickupTask from '../models/PickupTask.js';
import { isValidCoordinate, calculateHaversineDistance } from '../utils/distance.js';
import { geocodeAddress } from '../services/geocoding.service.js';
import { encryptCode, decryptCode } from '../utils/crypto.js';

/**
 * Create a new food donation listing
 * POST /api/donations
 * Access: Private (Donors and Admin only)
 */
export const createDonation = async (req, res, next) => {
  try {
    const {
      foodName,
      title,
      dietaryType,
      foodType,
      quantityMeals,
      quantity,
      preparationTime,
      pickupDeadline,
      safeConsumptionDeadline,
      pickupAddress,
      photoUrl,
      storageCondition,
      specialInstructions
    } = req.body;

    const resolvedFoodName = (foodName || title || '').trim();
    if (!resolvedFoodName) {
      return res.status(400).json({
        status: 'error',
        message: 'Food name is required'
      });
    }

    const meals = Number(quantityMeals);
    if (!meals || meals < 1) {
      return res.status(400).json({
        status: 'error',
        message: 'Quantity of meals must be a valid number of at least 1'
      });
    }

    if (!pickupDeadline || !safeConsumptionDeadline) {
      return res.status(400).json({
        status: 'error',
        message: 'Both pickup deadline and safe consumption deadline are required'
      });
    }

    const prepDate = preparationTime ? new Date(preparationTime) : new Date();
    const pickupDate = new Date(pickupDeadline);
    const safeDate = new Date(safeConsumptionDeadline);

    if (isNaN(pickupDate.getTime()) || isNaN(safeDate.getTime())) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid date format provided for deadlines'
      });
    }

    if (pickupDate <= new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'Pickup deadline must be a future time'
      });
    }

    if (safeDate < pickupDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Safe consumption deadline must be equal to or after the pickup deadline'
      });
    }

    if (!pickupAddress || !pickupAddress.street || !pickupAddress.city) {
      return res.status(400).json({
        status: 'error',
        message: 'Pickup street address and city are required'
      });
    }

    // Coordinate resolution and strict validation
    let resolvedLocation = {
      type: 'Point',
      latitude: null,
      longitude: null
    };

    const inputLat = req.body.latitude !== undefined ? req.body.latitude : req.body.location?.latitude;
    const inputLon = req.body.longitude !== undefined ? req.body.longitude : req.body.location?.longitude;

    if (inputLat !== undefined || inputLon !== undefined) {
      if (!isValidCoordinate(inputLat, inputLon)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid coordinate values. Latitude must be between -90 and 90, and longitude between -180 and 180.'
        });
      }
      resolvedLocation = {
        type: 'Point',
        latitude: Number(inputLat),
        longitude: Number(inputLon),
        coordinates: [Number(inputLon), Number(inputLat)]
      };
    } else {
      // Automatic geocoding with caching and graceful city fallback
      const geocoded = await geocodeAddress(pickupAddress);
      if (geocoded && isValidCoordinate(geocoded.latitude, geocoded.longitude)) {
        resolvedLocation = {
          type: 'Point',
          latitude: geocoded.latitude,
          longitude: geocoded.longitude,
          coordinates: [geocoded.longitude, geocoded.latitude]
        };
      }
    }

    // Security: derive donor strictly from authenticated session
    const newDonation = await Donation.create({
      donor: req.user._id,
      foodName: resolvedFoodName,
      title: resolvedFoodName,
      dietaryType: dietaryType || 'veg',
      foodType: foodType || 'cooked_meal',
      quantityMeals: meals,
      quantity: (quantity || `${meals} meals`).trim(),
      preparationTime: prepDate,
      pickupDeadline: pickupDate,
      safeConsumptionDeadline: safeDate,
      expiryDeadline: pickupDate,
      storageCondition: storageCondition || 'room_temperature',
      pickupAddress: {
        street: pickupAddress.street.trim(),
        city: pickupAddress.city.trim(),
        state: (pickupAddress.state || '').trim(),
        postalCode: (pickupAddress.postalCode || '').trim(),
        landmark: (pickupAddress.landmark || '').trim()
      },
      location: resolvedLocation,
      photoUrl: (photoUrl || '').trim(),
      specialInstructions: (specialInstructions || '').trim(),
      status: 'available'
    });

    res.status(201).json({
      status: 'success',
      data: {
        donation: newDonation
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve all donations created by the currently authenticated donor
 * GET /api/donations/my
 * Access: Private (Donors and Admin only)
 */
export const getMyDonations = async (req, res, next) => {
  try {
    const rawDonations = await Donation.find({ donor: req.user._id })
      .select('+deliveryCodeEncrypted')
      .populate('claimedBy', 'name organization phone role')
      .sort({ createdAt: -1 })
      .lean();

    const donations = rawDonations.map((d) => {
      const item = { ...d };
      if (item.status === 'picked_up' && item.deliveryCodeEncrypted) {
        item.deliveryConfirmationCode = decryptCode(item.deliveryCodeEncrypted);
      }
      delete item.deliveryCodeEncrypted;
      delete item.deliveryCodeHash;
      return item;
    });

    res.status(200).json({
      status: 'success',
      results: donations.length,
      data: {
        donations
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Discovery Feed: Browse all available and unexpired food donations
 * GET /api/donations/feed
 * Access: Private (NGOs, Volunteers, Admin)
 */
export const getAvailableFeed = async (req, res, next) => {
  try {
    const { city, dietaryType, lat, lon, sortBy, maxDistance } = req.query;
    const now = new Date();

    // Validate reference coordinates if either is supplied
    const hasReferenceLocation =
      lat !== undefined && lon !== undefined && lat !== '' && lon !== '';

    if ((lat !== undefined && lat !== '') || (lon !== undefined && lon !== '')) {
      if (!hasReferenceLocation || !isValidCoordinate(lat, lon)) {
        return res.status(400).json({
          status: 'error',
          message:
            'Invalid reference coordinates provided. Latitude must be between -90 and 90, and longitude between -180 and 180.'
        });
      }
    }

    const query = {
      status: 'available',
      pickupDeadline: { $gt: now }
    };

    if (dietaryType && dietaryType !== 'all') {
      query.dietaryType = dietaryType;
    }

    if (city && city.trim()) {
      query['pickupAddress.city'] = { $regex: new RegExp(city.trim(), 'i') };
    }

    let donations = await Donation.find(query)
      .populate('donor', 'name organization phone email')
      .sort({ pickupDeadline: 1 })
      .lean();

    // Calculate straight-line distance if valid reference location provided
    if (hasReferenceLocation) {
      const refLat = Number(lat);
      const refLon = Number(lon);

      donations = donations.map((item) => {
        const itemLat = item.location?.latitude;
        const itemLon = item.location?.longitude;
        const distance =
          itemLat !== null &&
          itemLat !== undefined &&
          itemLon !== null &&
          itemLon !== undefined
            ? calculateHaversineDistance(refLat, refLon, itemLat, itemLon)
            : null;

        return {
          ...item,
          distanceKm: distance
        };
      });

      // Filter by maxDistance if specified
      if (maxDistance && !isNaN(Number(maxDistance))) {
        const radius = Number(maxDistance);
        donations = donations.filter(
          (item) => item.distanceKm === null || item.distanceKm <= radius
        );
      }

      // Sort by distance if requested
      if (sortBy === 'distance') {
        donations.sort((a, b) => {
          if (a.distanceKm === null && b.distanceKm === null) return 0;
          if (a.distanceKm === null) return 1;
          if (b.distanceKm === null) return -1;
          return a.distanceKm - b.distanceKm;
        });
      }
    } else {
      donations = donations.map((item) => ({ ...item, distanceKm: null }));
    }

    res.status(200).json({
      status: 'success',
      results: donations.length,
      data: {
        donations
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Claim an available food donation
 * POST /api/donations/:id/claim
 * Access: Private (Verified NGOs, Volunteers, Admin)
 */
export const claimDonation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const collectorRole = req.user.role;
    if (!['ngo', 'volunteer', 'admin'].includes(collectorRole)) {
      return res.status(403).json({
        status: 'error',
        message: 'Only registered NGOs and volunteers can claim food donations.'
      });
    }

    if (collectorRole === 'ngo') {
      if (req.user.verificationStatus === 'rejected') {
        return res.status(403).json({
          status: 'error',
          message: 'Your NGO account application was rejected. Only verified NGOs can claim donations.'
        });
      }
      if (!req.user.isVerified || req.user.verificationStatus !== 'verified') {
        return res.status(403).json({
          status: 'error',
          message: 'Your NGO account is pending admin verification. Only verified NGOs can claim donations.'
        });
      }
    }

    const now = new Date();

    // Atomic update to prevent race conditions / duplicate claims
    const updatedDonation = await Donation.findOneAndUpdate(
      {
        _id: id,
        status: 'available',
        pickupDeadline: { $gt: now }
      },
      {
        $set: {
          status: 'accepted',
          claimedBy: req.user._id,
          claimedAt: now
        }
      },
      { returnDocument: 'after' }
    ).populate('donor', 'name organization phone email');

    if (!updatedDonation) {
      const existing = await Donation.findById(id);
      if (!existing) {
        return res.status(404).json({
          status: 'error',
          message: 'Donation listing not found.'
        });
      }

      if (existing.status !== 'available') {
        return res.status(409).json({
          status: 'error',
          message: 'This food donation is no longer available (already claimed by another collector).'
        });
      }

      if (existing.pickupDeadline <= now) {
        return res.status(400).json({
          status: 'error',
          message: 'This donation has expired and can no longer be claimed.'
        });
      }

      return res.status(400).json({
        status: 'error',
        message: 'Unable to claim donation at this time.'
      });
    }

    try {
      await PickupTask.create({
        donation: updatedDonation._id,
        volunteer: req.user._id,
        status: 'assigned',
        destination: {
          name: req.user.organization || req.user.name,
          address: ''
        }
      });
    } catch (taskErr) {
      console.warn('PickupTask record notice:', taskErr.message);
    }

    res.status(200).json({
      status: 'success',
      message: 'Donation claimed successfully!',
      data: {
        donation: updatedDonation
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve donations claimed by the currently authenticated collector
 * GET /api/donations/my-pickups
 * Access: Private (NGOs, Volunteers, Admin)
 */
export const getMyPickups = async (req, res, next) => {
  try {
    const donations = await Donation.find({
      claimedBy: req.user._id,
      status: { $in: ['accepted', 'picked_up', 'delivered'] }
    })
      .populate('donor', 'name organization phone email')
      .sort({ claimedAt: -1 })
      .lean();

    res.status(200).json({
      status: 'success',
      results: donations.length,
      data: {
        donations
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark an accepted donation as picked up
 * PATCH /api/donations/:id/pickup
 * Access: Private (Assigned Collector only, or Admin)
 */
export const markPickedUp = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check donation existence and ownership
    const donation = await Donation.findById(id);
    if (!donation) {
      return res.status(404).json({
        status: 'error',
        message: 'Donation listing not found.'
      });
    }

    // Role check: Only assigned collector or admin can update status
    const isAssigned = donation.claimedBy && donation.claimedBy.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isAssigned && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: You are not the assigned collector for this pickup.'
      });
    }

    // Progression validation: must currently be accepted
    if (donation.status !== 'accepted') {
      if (donation.status === 'picked_up') {
        return res.status(400).json({
          status: 'error',
          message: 'Donation has already been marked as picked up.'
        });
      }
      if (donation.status === 'delivered') {
        return res.status(400).json({
          status: 'error',
          message: 'Donation has already been delivered.'
        });
      }
      return res.status(400).json({
        status: 'error',
        message: `Cannot transition from '${donation.status}' to 'picked_up'.`
      });
    }

    // Safety check: Food shelf life expiration
    if (donation.safeConsumptionDeadline && new Date() > new Date(donation.safeConsumptionDeadline)) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot pick up food past its safe consumption deadline. Food safety policy violated.'
      });
    }

    // Generate cryptographically secure 6-digit confirmation code
    const rawCode = crypto.randomInt(100000, 999999).toString();
    const codeHash = crypto.createHash('sha256').update(rawCode).digest('hex');
    const encryptedCode = encryptCode(rawCode);
    const codeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours validity

    const now = new Date();

    // Atomic status update: never persists plaintext delivery code to MongoDB
    const updated = await Donation.findOneAndUpdate(
      {
        _id: id,
        status: 'accepted',
        ...(isAdmin ? {} : { claimedBy: req.user._id })
      },
      {
        $set: {
          status: 'picked_up',
          pickedUpAt: now,
          deliveryCodeHash: codeHash,
          deliveryCodeEncrypted: encryptedCode,
          deliveryCodeExpiresAt: codeExpiresAt,
          deliveryCodeAttempts: 0
        }
      },
      { returnDocument: 'after' }
    ).populate('donor', 'name organization phone email');

    if (!updated) {
      return res.status(409).json({
        status: 'error',
        message: 'Donation status could not be updated (concurrent update conflict).'
      });
    }

    // Sync associated PickupTask
    try {
      await PickupTask.findOneAndUpdate(
        { donation: id },
        {
          $set: {
            status: 'picked_up',
            pickedUpAt: now
          }
        }
      );
    } catch (taskErr) {
      console.warn('PickupTask update notice:', taskErr.message);
    }

    res.status(200).json({
      status: 'success',
      message: 'Donation marked as picked up successfully!',
      data: {
        donation: updated
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm food delivery using the one-time verification code
 * POST /api/donations/:id/confirm-delivery
 * Access: Private (Assigned Collector only, or Admin)
 */
export const confirmDelivery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { confirmationCode, deliveryNotes } = req.body;

    if (!confirmationCode || !confirmationCode.toString().trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide the 6-digit delivery confirmation code.'
      });
    }

    const donation = await Donation.findById(id).select('+deliveryCodeHash');
    if (!donation) {
      return res.status(404).json({
        status: 'error',
        message: 'Donation listing not found.'
      });
    }

    // Role check: Only assigned collector or admin can confirm delivery
    const isAssigned = donation.claimedBy && donation.claimedBy.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isAssigned && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: You are not the assigned collector for this delivery.'
      });
    }

    // Progression validation: must be picked_up before delivery can be confirmed
    if (donation.status !== 'picked_up') {
      if (donation.status === 'delivered') {
        return res.status(400).json({
          status: 'error',
          message: 'Donation has already been delivered.'
        });
      }
      if (donation.status === 'accepted') {
        return res.status(400).json({
          status: 'error',
          message: 'Donation must be marked as picked up before delivery can be confirmed.'
        });
      }
      return res.status(400).json({
        status: 'error',
        message: `Cannot confirm delivery for donation with status '${donation.status}'.`
      });
    }

    // Safety check: Food shelf life expiration
    if (donation.safeConsumptionDeadline && new Date() > new Date(donation.safeConsumptionDeadline)) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot deliver food past its safe consumption deadline. Food safety policy violated.'
      });
    }

    // Check failed attempts (lockout threshold: 5 attempts)
    if (donation.deliveryCodeAttempts >= 5) {
      return res.status(400).json({
        status: 'error',
        message: 'Too many failed delivery confirmation attempts. Code has been locked for security.'
      });
    }

    // Check code expiration
    if (donation.deliveryCodeExpiresAt && new Date() > donation.deliveryCodeExpiresAt) {
      return res.status(400).json({
        status: 'error',
        message: 'Delivery confirmation code has expired.'
      });
    }

    // Verify confirmation code hash
    const enteredCodeStr = confirmationCode.toString().trim();
    const enteredHash = crypto.createHash('sha256').update(enteredCodeStr).digest('hex');

    if (enteredHash !== donation.deliveryCodeHash) {
      donation.deliveryCodeAttempts += 1;
      await donation.save();
      const remainingAttempts = 5 - donation.deliveryCodeAttempts;

      return res.status(400).json({
        status: 'error',
        message: `Invalid delivery confirmation code. ${remainingAttempts > 0 ? `(${remainingAttempts} attempts remaining)` : 'Code is now locked.'}`
      });
    }

    const now = new Date();

    // Atomic update to delivered status
    const updated = await Donation.findOneAndUpdate(
      {
        _id: id,
        status: 'picked_up',
        ...(isAdmin ? {} : { claimedBy: req.user._id })
      },
      {
        $set: {
          status: 'delivered',
          deliveredAt: now,
          deliveryNotes: (deliveryNotes || '').trim(),
          deliveryCodeEncrypted: null // Clear encrypted code once redeemed
        }
      },
      { returnDocument: 'after' }
    ).populate('donor', 'name organization phone email');

    if (!updated) {
      return res.status(409).json({
        status: 'error',
        message: 'Donation status could not be updated (concurrent update conflict).'
      });
    }

    // Sync associated PickupTask
    try {
      await PickupTask.findOneAndUpdate(
        { donation: id },
        {
          $set: {
            status: 'delivered',
            deliveredAt: now,
            deliveryNotes: updated.deliveryNotes
          }
        }
      );
    } catch (taskErr) {
      console.warn('PickupTask delivery update notice:', taskErr.message);
    }

    res.status(200).json({
      status: 'success',
      message: 'Delivery confirmed successfully! Thank you for sharing hope.',
      data: {
        donation: updated
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get tracking timeline and status for a single donation
 * GET /api/donations/:id/tracking
 * Access: Private (Authorized Donor, Assigned Collector, Admin)
 */
export const getDonationTracking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const donation = await Donation.findById(id)
      .select('+deliveryCodeEncrypted')
      .populate('donor', 'name organization phone email')
      .populate('claimedBy', 'name organization phone role')
      .lean();

    if (!donation) {
      return res.status(404).json({
        status: 'error',
        message: 'Donation listing not found.'
      });
    }

    // Authorization: User must be Donor, Assigned Collector, or Admin
    const isDonor = req.user._id.equals(donation.donor?._id || donation.donor);
    const isCollector = donation.claimedBy && req.user._id.equals(donation.claimedBy._id || donation.claimedBy);
    const isAdmin = req.user.role === 'admin';

    if (!isDonor && !isCollector && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: You are not authorized to view tracking for this donation.'
      });
    }

    const trackingData = {
      _id: donation._id,
      foodName: donation.foodName,
      dietaryType: donation.dietaryType,
      quantityMeals: donation.quantityMeals,
      pickupAddress: donation.pickupAddress,
      status: donation.status,
      timestamps: {
        createdAt: donation.createdAt,
        claimedAt: donation.claimedAt,
        pickedUpAt: donation.pickedUpAt,
        deliveredAt: donation.deliveredAt
      },
      donor: {
        name: donation.donor?.name || 'Local Donor',
        organization: donation.donor?.organization || '',
        phone: donation.donor?.phone || ''
      },
      collector: donation.claimedBy
        ? {
            name: donation.claimedBy.name,
            organization: donation.claimedBy.organization || '',
            phone: donation.claimedBy.phone || '',
            role: donation.claimedBy.role
          }
        : null,
      location: donation.location || null,
      collectorLocation: donation.collectorLocation || null,
      deliveryNotes: donation.deliveryNotes || ''
    };

    // Sensitive code disclosure: ONLY the Donor or Admin can view the decrypted confirmation code
    if ((isDonor || isAdmin) && donation.status === 'picked_up' && donation.deliveryCodeEncrypted) {
      trackingData.deliveryConfirmationCode = decryptCode(donation.deliveryCodeEncrypted);
    }

    res.status(200).json({
      status: 'success',
      data: {
        tracking: trackingData
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update live location of the assigned collector (NGO / Volunteer)
 * PATCH /api/donations/:id/collector-location
 * Access: Private (Assigned Collector, Admin)
 */
export const updateCollectorLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, isArrived: manualArrived } = req.body;

    if (!isValidCoordinate(latitude, longitude)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid coordinate values. Latitude must be between -90 and 90, and longitude between -180 and 180.'
      });
    }

    const donation = await Donation.findById(id);
    if (!donation) {
      return res.status(404).json({
        status: 'error',
        message: 'Donation listing not found.'
      });
    }

    // Must be assigned collector or admin
    const isAssigned = donation.claimedBy && donation.claimedBy.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isAssigned && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: You are not the assigned collector for this donation.'
      });
    }

    // Status check: must be accepted or picked_up
    if (!['accepted', 'picked_up'].includes(donation.status)) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot update live location for donation in '${donation.status}' status.`
      });
    }

    const now = new Date();
    const latNum = Number(latitude);
    const lonNum = Number(longitude);

    // Calculate proximity to pickup spot
    let hasArrived = manualArrived === true || donation.collectorLocation?.isArrived === true;
    let distanceToPickupKm = null;

    const pLat = donation.location?.latitude;
    const pLon = donation.location?.longitude;
    if (typeof pLat === 'number' && typeof pLon === 'number') {
      distanceToPickupKm = calculateHaversineDistance(latNum, lonNum, pLat, pLon);
      // Auto-detect arrival within ~300 meters (0.3 km)
      if (distanceToPickupKm !== null && distanceToPickupKm <= 0.3) {
        hasArrived = true;
      }
    }

    const arrivedAtTimestamp = hasArrived
      ? (donation.collectorLocation?.arrivedAt || now)
      : null;

    donation.collectorLocation = {
      latitude: latNum,
      longitude: lonNum,
      isArrived: hasArrived,
      arrivedAt: arrivedAtTimestamp,
      updatedAt: now
    };

    await donation.save();

    res.status(200).json({
      status: 'success',
      message: hasArrived
        ? 'Collector has arrived at pickup location.'
        : 'Collector live location updated successfully.',
      data: {
        collectorLocation: donation.collectorLocation,
        distanceToPickupKm
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Public leaderboard of top donors and volunteers/NGOs
 * GET /api/donations/leaderboard
 * Access: Public (Visitors, Donors, Rescuers)
 */
export const getLeaderboard = async (req, res, next) => {
  try {
    // 1. Top Donors (Ranked by delivered meals rescued)
    const topDonorsRaw = await Donation.aggregate([
      { $match: { status: 'delivered' } },
      {
        $group: {
          _id: '$donor',
          totalMeals: { $sum: '$quantityMeals' },
          donationsCount: { $sum: 1 }
        }
      },
      { $sort: { totalMeals: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'donor'
        }
      },
      { $unwind: '$donor' },
      {
        $project: {
          _id: 1,
          totalMeals: 1,
          donationsCount: 1,
          'donor.name': 1,
          'donor.organization': 1,
          'donor.city': 1,
          'donor.address': 1
        }
      }
    ]);

    const topDonors = topDonorsRaw.map((item, index) => {
      const d = item.donor;
      return {
        rank: index + 1,
        id: item._id,
        name: d.organization || d.name || 'Anonymous Donor',
        type: d.organization ? 'Organization' : 'Individual Donor',
        city: d.address?.city || d.city || 'Mumbai',
        totalMeals: item.totalMeals,
        donationsCount: item.donationsCount
      };
    });

    // 2. Top Rescuers (NGOs & Volunteers ranked by delivered meals)
    const topRescuersRaw = await Donation.aggregate([
      { $match: { status: 'delivered', claimedBy: { $ne: null } } },
      {
        $group: {
          _id: '$claimedBy',
          totalMealsRescued: { $sum: '$quantityMeals' },
          missionsCompleted: { $sum: 1 }
        }
      },
      { $sort: { totalMealsRescued: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'rescuer'
        }
      },
      { $unwind: '$rescuer' },
      {
        $project: {
          _id: 1,
          totalMealsRescued: 1,
          missionsCompleted: 1,
          'rescuer.name': 1,
          'rescuer.organization': 1,
          'rescuer.role': 1,
          'rescuer.city': 1,
          'rescuer.address': 1
        }
      }
    ]);

    const topRescuers = topRescuersRaw.map((item, index) => {
      const r = item.rescuer;
      return {
        rank: index + 1,
        id: item._id,
        name: r.organization || r.name || 'Community Rescuer',
        role: r.role === 'ngo' ? 'Verified NGO' : 'Volunteer',
        city: r.address?.city || r.city || 'Mumbai',
        totalMealsRescued: item.totalMealsRescued,
        missionsCompleted: item.missionsCompleted
      };
    });

    // 3. Platform Community Impact Stats
    const totalMealsResult = await Donation.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, sum: { $sum: '$quantityMeals' } } }
    ]);
    const totalMealsRescued = totalMealsResult[0]?.sum || 0;
    const totalMissions = await Donation.countDocuments({ status: 'delivered' });

    res.status(200).json({
      status: 'success',
      data: {
        leaderboard: {
          topDonors,
          topRescuers,
          impact: {
            totalMealsRescued,
            totalMissions,
            donorsCount: topDonors.length,
            rescuersCount: topRescuers.length
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
