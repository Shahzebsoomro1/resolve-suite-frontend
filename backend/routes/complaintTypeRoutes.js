// routes/complaintTypeRoutes.js
import express from 'express';
import { check } from 'express-validator';
import { auth, isSuperAdmin } from '../middleware/auth.js';
import {
  createComplaintType,
  getComplaintTypes,
  getComplaintTypeById,
  updateComplaintType,
  deleteComplaintType
} from '../controllers/complaintTypeController.js';

const router = express.Router();

// Create complaint type - POST /api/complaint-types
router.post(
  '/',
  auth,
  isSuperAdmin,
  [
    check('name', 'Name is required').notEmpty(),
    check('description', 'Description is required').notEmpty(),
    check('defaultDepartmentId', 'Default department is required').optional()
  ],
  createComplaintType
);

// Get all complaint types - GET /api/complaint/types
router.get('/', auth, getComplaintTypes);

// Get specific complaint type - GET /api/complaint/types/:id
router.get('/:id', auth, getComplaintTypeById);

// Update complaint type - PUT /api/complaint/types/:id
router.put(
  '/:id',
  auth,
  isSuperAdmin,
  [
    check('name', 'Name is required').optional().notEmpty(),
    check('description', 'Description is required').optional().notEmpty(),
    check('defaultDepartmentId', 'Default department is required').optional()
  ],
  updateComplaintType
);

// Delete complaint type - DELETE /api/complaint/types/:id
router.delete('/:id', auth, isSuperAdmin, deleteComplaintType);

export default router;