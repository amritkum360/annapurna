import mongoose from 'mongoose';
import User from '../models/User.js';
import Donation from '../models/Donation.js';

/**
 * List registered NGOs with their verification status
 * GET /api/admin/ngos
 * Access: Private (Admin only)
 */
export const getNgos = async (req, res, next) => {
  try {
    const { status } = req.query;

    const query = { role: 'ngo' };
    if (status && status !== 'all') {
      query.verificationStatus = status;
    }

    const ngos = await User.find(query)
      .select('-password')
      .populate('verifiedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      status: 'success',
      results: ngos.length,
      data: {
        ngos
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve or reject an NGO verification application
 * PATCH /api/admin/ngos/:id/verify
 * Access: Private (Admin only)
 */
export const verifyNgo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Status must be either "verified" or "rejected".'
      });
    }

    const ngo = await User.findById(id);
    if (!ngo || ngo.role !== 'ngo') {
      return res.status(404).json({
        status: 'error',
        message: 'NGO profile not found.'
      });
    }

    const isVerified = status === 'verified';
    ngo.verificationStatus = status;
    ngo.isVerified = isVerified;
    ngo.verifiedAt = new Date();
    ngo.verifiedBy = req.user._id;
    if (notes !== undefined) {
      ngo.verificationNotes = notes.trim();
    }

    await ngo.save();

    const populatedNgo = await User.findById(id)
      .select('-password')
      .populate('verifiedBy', 'name email');

    res.status(200).json({
      status: 'success',
      message: `NGO successfully ${isVerified ? 'approved' : 'rejected'}.`,
      data: {
        ngo: populatedNgo
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Platform impact analytics aggregated from real database records
 * GET /api/admin/analytics/overview
 * Access: Private (Admin only)
 */
export const getPlatformAnalytics = async (req, res, next) => {
  try {
    // 1. User counts
    const [
      totalUsers,
      donorsCount,
      volunteersCount,
      adminsCount,
      ngosTotal,
      ngosPending,
      ngosVerified,
      ngosRejected
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: 'volunteer' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'ngo' }),
      User.countDocuments({ role: 'ngo', verificationStatus: 'pending' }),
      User.countDocuments({ role: 'ngo', verificationStatus: 'verified' }),
      User.countDocuments({ role: 'ngo', verificationStatus: 'rejected' })
    ]);

    // 2. Donation counts by status
    const [
      totalDonations,
      availableCount,
      acceptedCount,
      pickedUpCount,
      deliveredCount,
      cancelledCount
    ] = await Promise.all([
      Donation.countDocuments(),
      Donation.countDocuments({ status: 'available' }),
      Donation.countDocuments({ status: 'accepted' }),
      Donation.countDocuments({ status: 'picked_up' }),
      Donation.countDocuments({ status: 'delivered' }),
      Donation.countDocuments({ status: 'cancelled' })
    ]);

    // 3. Meals rescued: counted STRICTLY from successfully delivered donations
    const mealsResult = await Donation.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, totalMeals: { $sum: '$quantityMeals' } } }
    ]);
    const totalMealsRescued = mealsResult[0]?.totalMeals || 0;

    // 4. Delivery completion rate: delivered / claimed (handles division by zero)
    const claimedTotal = acceptedCount + pickedUpCount + deliveredCount;
    const deliveryCompletionRate =
      claimedTotal > 0
        ? Math.round((deliveredCount / claimedTotal) * 1000) / 10
        : 0;

    // 5. Recent activity
    const recentActivity = await Donation.find()
      .populate('donor', 'name email phone organization address isVerified role')
      .populate('claimedBy', 'name email phone organization address isVerified verificationStatus role')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    res.status(200).json({
      status: 'success',
      data: {
        analytics: {
          users: {
            total: totalUsers,
            donors: donorsCount,
            volunteers: volunteersCount,
            admins: adminsCount,
            ngos: {
              total: ngosTotal,
              pending: ngosPending,
              verified: ngosVerified,
              rejected: ngosRejected
            }
          },
          donations: {
            total: totalDonations,
            available: availableCount,
            accepted: acceptedCount,
            pickedUp: pickedUpCount,
            delivered: deliveredCount,
            cancelled: cancelledCount
          },
          impact: {
            totalMealsRescued,
            deliveredCount,
            claimedTotal,
            deliveryCompletionRate
          },
          recentActivity
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch detailed user profile and rescue impact history for admin inspection
 * GET /api/admin/users/:id
 * Access: Private (Admin only)
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid user ID format.'
      });
    }

    const user = await User.findById(id)
      .select('-password')
      .populate('verifiedBy', 'name email')
      .lean();

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User profile not found.'
      });
    }

    const userObjId = new mongoose.Types.ObjectId(id);
    let stats = {};
    let recentHistory = [];

    if (user.role === 'donor') {
      const [totalDonations, deliveredCount, mealsAgg, recentListings] = await Promise.all([
        Donation.countDocuments({ donor: userObjId }),
        Donation.countDocuments({ donor: userObjId, status: 'delivered' }),
        Donation.aggregate([
          { $match: { donor: userObjId, status: 'delivered' } },
          { $group: { _id: null, totalMeals: { $sum: '$quantityMeals' } } }
        ]),
        Donation.find({ donor: userObjId })
          .populate('claimedBy', 'name role organization phone')
          .sort({ createdAt: -1 })
          .limit(6)
          .lean()
      ]);

      stats = {
        totalDonations,
        deliveredCount,
        totalMealsRescued: mealsAgg[0]?.totalMeals || 0
      };
      recentHistory = recentListings;
    } else if (user.role === 'ngo' || user.role === 'volunteer') {
      const [totalClaimed, deliveredCount, mealsAgg, recentMissions] = await Promise.all([
        Donation.countDocuments({ claimedBy: userObjId }),
        Donation.countDocuments({ claimedBy: userObjId, status: 'delivered' }),
        Donation.aggregate([
          { $match: { claimedBy: userObjId, status: 'delivered' } },
          { $group: { _id: null, totalMeals: { $sum: '$quantityMeals' } } }
        ]),
        Donation.find({ claimedBy: userObjId })
          .populate('donor', 'name organization phone address pickupAddress')
          .sort({ createdAt: -1 })
          .limit(6)
          .lean()
      ]);

      stats = {
        totalClaimed,
        deliveredCount,
        totalMealsDelivered: mealsAgg[0]?.totalMeals || 0
      };
      recentHistory = recentMissions;
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
        stats,
        recentHistory
      }
    });
  } catch (error) {
    next(error);
  }
};
