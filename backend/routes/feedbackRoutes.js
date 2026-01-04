// routes/feedbackRoutes.js
import express from 'express';
import { check } from 'express-validator';
import { auth, isSuperAdmin } from '../middleware/auth.js';
import {
  submitFeedback,
  getFeedbackByComplaint,
  getAllFeedback,
  getFeedbackStats,
  canProvideFeedback,
  getFeedbackStatsByDepartment,
  getFeedbackByDepartment
} from '../controllers/feedbackController.js';

const router = express.Router();

// @route   POST /api/feedback
// @desc    Submit feedback for a complaint
// @access  Private (Complainant only)
router.post(
  '/',
  auth,
  [
    check('complaintId', 'Complaint ID is required').notEmpty(),
    check('rating', 'Rating is required and must be between 1 and 5')
      .isInt({ min: 1, max: 5 }),
    check('comment', 'Comment must be less than 1000 characters')
      .optional()
      .isLength({ max: 1000 })
  ],
  submitFeedback
);

// @route   GET /api/feedback/complaint/:complaintId
// @desc    Get feedback for a specific complaint
// @access  Private
router.get('/complaint/:complaintId', auth, getFeedbackByComplaint);

// @route   GET /api/feedback/can-provide/:complaintId
// @desc    Check if user can provide feedback for a complaint
// @access  Private
router.get('/can-provide/:complaintId', auth, canProvideFeedback);

// @route   GET /api/feedback/department/:departmentId/stats
// @desc    Get feedback statistics for a specific department
// @access  Private (Department Users and Super Admin)
router.get('/department/:departmentId/stats', auth, getFeedbackStatsByDepartment);

// @route   GET /api/feedback/department/:departmentId
// @desc    Get all feedback for a specific department
// @access  Private (Department Users and Super Admin)
router.get('/department/:departmentId', auth, getFeedbackByDepartment);

// @route   GET /api/feedback/stats
// @desc    Get feedback statistics for the organization
// @access  Private (Admin only)
router.get('/stats', auth, isSuperAdmin, getFeedbackStats);

// @route   GET /api/feedback
// @desc    Get all feedback for the organization
// @access  Private (Admin only)
router.get('/', auth, isSuperAdmin, getAllFeedback);

export default router;