import express from 'express';
import { User, Organization } from '../models/models.js';
import { check, validationResult } from 'express-validator';
import { auth, isSuperAdmin } from '../middleware/auth.js';
const router = express.Router();

// POST /api/users/add - Add a pre-approved user (Super Admin only)
router.post(
  '/add',
  auth,
  isSuperAdmin,
  [
    check('email', 'Please include a valid email').isEmail(),
    check('role', 'Role is required').isIn(['Student', 'DepartmentUser', 'Faculty']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, role } = req.body;
    const organizationId = req.user.organizationId;

    try {
      // Check if user with this email already exists
      let existingUser = await User.findOne({ email, organizationId });
      if (existingUser) {
        return res.status(400).json({ msg: 'User with this email already exists in this organization.' });
      }

      // Get the organization details
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        return res.status(400).json({ msg: 'Organization not found.' });
      }

      // Generate Registration ID
      const orgInitials = organization.name.substring(0, 4).toUpperCase();
      const roleInitial = role.toUpperCase();
      const userCount = await User.countDocuments({ organizationId, role });
      const registrationId = `${orgInitials}_${roleInitial}_${userCount + 1}`;

      // Create new user
      const newUser = new User({
        organizationId,
        email,
        role,
        registrationId,
        isActive: false, // Set to false initially, will be activated when user completes registration
      });

      // Save user in the database
      await newUser.save();

      res.status(201).json({ msg: 'User added successfully', registrationId: newUser.registrationId });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// GET /api/users - Get all users (Super Admin only)
router.get('/', auth, isSuperAdmin, async (req, res) => {
  try {
    const users = await User.find({ organizationId: req.user.organizationId }).select('-passwordHash');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// DELETE /api/users/:id - Delete a user (Super Admin only)
router.delete('/:id', auth, isSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Check if the user belongs to the same organization as the super admin
    if (user.organizationId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({ msg: 'Not authorized to delete this user' });
    }
    
    // Check if the user is a SuperAdmin
    if (user.role === 'SuperAdmin') {
      return res.status(400).json({ msg: 'Cannot delete a SuperAdmin user' });
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    res.json({ msg: 'User deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// userRoutes.js - Add new endpoint for department-eligible users
router.get('/department-eligible', auth, isSuperAdmin, async (req, res) => {
  try {
    const users = await User.find({ 
      organizationId: req.user.organizationId,
      role: { $in: ['DepartmentUser'] }, // Only DepartmentUser role
      departmentId: { $exists: false } // Only users not already in departments
    }).select('-passwordHash');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;
