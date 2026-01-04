// routes/complaintRoutes.js
import express from 'express';
import { check } from 'express-validator';
import { auth } from '../middleware/auth.js';
import {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  addCommentToComplaint,
  getComplaintComments,
  escalateComplaint,
  assignComplaint,
} from '../controllers/complaintController.js';
import upload from '../services/uploadService.js';
const router = express.Router();

// Create complaint
router.post(
  '/',
  auth,
  upload.array('attachments', 5), // Allow up to 5 files
  [
    check('title', 'Title is required').notEmpty(),
    check('description', 'Description is required').notEmpty(),
    check('complaintTypeId', 'Complaint type is required').notEmpty(),
    check('departmentId', 'Department is required').notEmpty(),
    check('priority', 'Priority is required').isIn(['Low', 'Medium', 'High', 'Urgent'])
  ],
  createComplaint
);

// Get all complaints with filters
router.get('/', auth, getComplaints);

// Get specific complaint
router.get('/:id', auth, getComplaintById);

// Update complaint status
router.put(
  '/:id/status',
  auth,
  [
    check('status').isIn(['Open', 'In Progress', 'Resolved', 'Closed']),
    check('comment', 'Comment is required when updating status').notEmpty()
  ],
  updateComplaintStatus
);

// Comment-related routes
router.get(
  '/:id/comments',
  auth,
  getComplaintComments
);

router.post(
  '/:id/comments',
  auth,
  [
    check('comment', 'Comment is required').notEmpty().trim(),
    check('comment').isLength({ max: 1000 }).withMessage('Comment must not exceed 1000 characters')
  ],
  addCommentToComplaint
);

// Escalate complaint
router.post(
  '/:id/escalate',
  auth,
  [
    check('reason', 'Escalation reason is required').notEmpty()
  ],
  escalateComplaint
);

// Assign complaint to department user
router.put(
  '/:id/assign',
  auth,
  [
    check('userId', 'User ID is required').notEmpty()
  ],
  assignComplaint
);

export default router;