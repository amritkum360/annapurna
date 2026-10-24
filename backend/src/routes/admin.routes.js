import express from 'express';
import {
  getNgos,
  verifyNgo,
  getPlatformAnalytics,
  getUserProfile
} from '../controllers/admin.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Strict security: ALL admin routes require authentication and the 'admin' role
router.use(protect);
router.use(authorize('admin'));

// NGO verification queue & actions
router.get('/ngos', getNgos);
router.patch('/ngos/:id/verify', verifyNgo);

// Platform impact analytics
router.get('/analytics/overview', getPlatformAnalytics);

// User Profile Inspection
router.get('/users/:id', getUserProfile);

export default router;
