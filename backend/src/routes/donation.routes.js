import express from 'express';
import {
  createDonation,
  getMyDonations,
  getAvailableFeed,
  claimDonation,
  getMyPickups,
  markPickedUp,
  confirmDelivery,
  getDonationTracking,
  updateCollectorLocation,
  getLeaderboard
} from '../controllers/donation.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public Leaderboard route (Unauthenticated for landing page & visitors)
router.get('/leaderboard', getLeaderboard);

// Require authentication for all donation routes
router.use(protect);

// Donor-specific routes
router.post('/', authorize('donor', 'admin'), createDonation);
router.get('/my', authorize('donor', 'admin'), getMyDonations);

// Collector (NGO & Volunteer) routes
router.get('/feed', authorize('ngo', 'volunteer', 'admin'), getAvailableFeed);
router.post('/:id/claim', authorize('ngo', 'volunteer', 'admin'), claimDonation);
router.get('/my-pickups', authorize('ngo', 'volunteer', 'admin'), getMyPickups);
router.patch('/:id/pickup', authorize('ngo', 'volunteer', 'admin'), markPickedUp);
router.patch('/:id/collector-location', authorize('ngo', 'volunteer', 'admin'), updateCollectorLocation);
router.post('/:id/confirm-delivery', authorize('ngo', 'volunteer', 'admin'), confirmDelivery);

// Shared tracking route (Donor, Collector, Admin)
router.get('/:id/tracking', getDonationTracking);

export default router;
