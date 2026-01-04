import express from 'express';
import { check } from 'express-validator';
import { auth, isSuperAdmin} from '../middleware/auth.js';
import {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  assignUsersToDepartment,
  getDepartmentUsers,
  removeUserFromDepartment
} from '../controllers/departmentController.js';

const router = express.Router();

// Create department - POST /api/departments
router.post(
  '/',
  auth,
  isSuperAdmin,
  [
    check('name', 'Department name is required').notEmpty(),
    check('description', 'Description is required').notEmpty()
  ],
  createDepartment
);

// Get all departments for organization - GET /api/departments
router.get('/', auth, getAllDepartments);

// Get specific department - GET /api/departments/:id
router.get('/:id', auth, isSuperAdmin, getDepartmentById);

// Update department - PUT /api/departments/:id
router.put(
  '/:id',
  auth,
  isSuperAdmin,
  [
    check('name', 'Department name is required').optional().notEmpty(),
    check('description', 'Description is required').optional().notEmpty(),
    check('isActive', 'Status must be boolean').optional().isBoolean()
  ],
  updateDepartment
);

// Remove user from department - DELETE /api/departments/:id/users/:userId
router.delete('/:id/users/:userId', auth, isSuperAdmin, removeUserFromDepartment);

// Delete department - DELETE /api/departments/:id
router.delete('/:id', auth, isSuperAdmin, deleteDepartment);

// Assign users to department - POST /api/departments/:id/users
router.post(
  '/:id/users',
  auth,
  isSuperAdmin,
  [
    check('userIds', 'User IDs are required').isArray().notEmpty()
  ],
  assignUsersToDepartment
);

// Get department users - GET /api/departments/:id/users
router.get('/:id/users', auth, isSuperAdmin, getDepartmentUsers);

export default router;