import { validationResult } from 'express-validator';
import { User, Department, Organization } from '../models/models.js';
import { emailService } from '../services/emailService.js';


// Create new department
export const createDepartment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description } = req.body;
    const organizationId = req.user.organizationId;

    // Check if department with same name exists in the organization
    const existingDepartment = await Department.findOne({
      organizationId,
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingDepartment) {
      return res.status(400).json({
        msg: 'Department with this name already exists in your organization'
      });
    }

    const newDepartment = new Department({
      organizationId,
      name,
      description,
      isActive: true
    });

    const savedDepartment = await newDepartment.save();
    res.status(201).json(savedDepartment);
  } catch (err) {
    console.error('Error creating department:', err);
    res.status(500).json({ msg: 'Server error while creating department' });
  }
};

// Get all departments for an organization
export const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find({
      organizationId: req.user.organizationId
    }).sort({ name: 1 });

    // Get user count for each department
    const departmentsWithCounts = await Promise.all(
      departments.map(async (dept) => {
        const userCount = await User.countDocuments({
          departmentId: dept._id
        });
        return {
          ...dept.toObject(),
          userCount
        };
      })
    );

    res.json(departmentsWithCounts);
  } catch (err) {
    console.error('Error fetching departments:', err);
    res.status(500).json({ msg: 'Server error while fetching departments' });
  }
};

// Get specific department by ID
export const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!department) {
      return res.status(404).json({ msg: 'Department not found' });
    }

    res.json(department);
  } catch (err) {
    console.error('Error fetching department:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Department not found' });
    }
    res.status(500).json({ msg: 'Server error while fetching department' });
  }
};

// Update department
export const updateDepartment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, isActive } = req.body;
    const departmentId = req.params.id;

    // Check if department exists and belongs to the organization
    let department = await Department.findOne({
      _id: departmentId,
      organizationId: req.user.organizationId
    });

    if (!department) {
      return res.status(404).json({ msg: 'Department not found' });
    }

    // If name is being updated, check for duplicates
    if (name && name !== department.name) {
      const existingDepartment = await Department.findOne({
        organizationId: req.user.organizationId,
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: departmentId }
      });

      if (existingDepartment) {
        return res.status(400).json({
          msg: 'Department with this name already exists in your organization'
        });
      }
    }

    // Update fields
    if (name) department.name = name;
    if (description) department.description = description;
    if (typeof isActive !== 'undefined') department.isActive = isActive;

    department = await department.save();
    res.json(department);
  } catch (err) {
    console.error('Error updating department:', err);
    res.status(500).json({ msg: 'Server error while updating department' });
  }
};

// Delete department
export const deleteDepartment = async (req, res) => {
  try {
    // Check if department exists and belongs to the organization
    const department = await Department.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!department) {
      return res.status(404).json({ msg: 'Department not found' });
    }

    // Check if department has any users
    const usersCount = await User.countDocuments({
      departmentId: department._id
    });

    if (usersCount > 0) {
      return res.status(400).json({
        msg: 'Cannot delete department with assigned users. Please remove all users from this department first.'
      });
    }

    // If no users are assigned, proceed with deletion
    await Department.deleteOne({ _id: department._id });

    res.json({ msg: 'Department deleted successfully' });

  } catch (err) {
    console.error('Error deleting department:', err);
    res.status(500).json({
      msg: err.message || 'Server error while deleting department'
    });
  }
};

// Assign users to department
export const assignUsersToDepartment = async (req, res) => {
  const { id: departmentId } = req.params;
  const { userIds } = req.body;

  try {
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ msg: 'Department not found' });
    }

    const organization = await Organization.findById(department.organizationId);
    if (!organization) {
      return res.status(404).json({ msg: 'Organization not found' });
    }

    // Find all users to be assigned
    const users = await User.find({
      _id: { $in: userIds },
      isActive: true
    });

    if (users.length === 0) {
      return res.status(404).json({ msg: 'No valid active users found' });
    }

    const results = await Promise.allSettled(
      users.map(async (user) => {
        try {
          // Update user's department
          user.departmentId = departmentId;
          await user.save();

          // Try to send email but don't fail if email fails
          const emailResult = await emailService.sendDepartmentAssignmentEmail(
            user.email,
            `${user.firstName} ${user.lastName}`,
            department.name,
            organization.name
          );

          return {
            userId: user._id,
            success: true,
            emailSent: emailResult.success,
            emailError: emailResult.error
          };
        } catch (error) {
          console.error(`Error processing user ${user._id}:`, error);
          return {
            userId: user._id,
            success: false,
            error: error.message
          };
        }
      })
    );

    // Process results
    const successfulAssignments = results
      .filter(r => r.value?.success)
      .map(r => ({
        userId: r.value.userId,
        emailSent: r.value.emailSent,
        emailError: r.value.emailError
      }));

    const failedAssignments = results
      .filter(r => !r.value?.success)
      .map(r => ({
        userId: r.value.userId,
        error: r.value.error
      }));

    res.json({
      msg: 'Department assignment process completed',
      success: successfulAssignments,
      failed: failedAssignments,
      totalProcessed: results.length,
      successCount: successfulAssignments.length,
      failureCount: failedAssignments.length
    });

  } catch (err) {
    console.error('Error in assignUsersToDepartment:', err);
    res.status(500).json({ msg: 'Server error during user assignment' });
  }
};

// Get department users
export const getDepartmentUsers = async (req, res) => {
  try {
    const users = await User.find({
      departmentId: req.params.id,
      organizationId: req.user.organizationId
    })
      .select('-passwordHash')
      .sort({ firstName: 1, lastName: 1 });

    res.json(users);
  } catch (err) {
    console.error('Error fetching department users:', err);
    res.status(500).json({ msg: 'Server error while fetching department users' });
  }
};

export const removeUserFromDepartment = async (req, res) => {
  try {
    const { id: departmentId, userId } = req.params;

    // Check if department exists and belongs to the organization
    const department = await Department.findOne({
      _id: departmentId,
      organizationId: req.user.organizationId
    });

    if (!department) {
      return res.status(404).json({ msg: 'Department not found' });
    }

    // Update user's department to null
    const result = await User.updateOne(
      {
        _id: userId,
        organizationId: req.user.organizationId,
        departmentId: departmentId
      },
      { $unset: { departmentId: "" } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ msg: 'User not found in department' });
    }

    res.json({ msg: 'User removed from department successfully' });
  } catch (err) {
    console.error('Error removing user from department:', err);
    res.status(500).json({ msg: 'Server error while removing user' });
  }
};