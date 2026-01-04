import { validationResult } from 'express-validator';
import { Complaint, ComplaintType } from '../models/models.js';

// Create new complaint type
export const createComplaintType = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, defaultDepartmentId } = req.body;

    // Check if complaint type with same name exists in the organization
    const existingType = await ComplaintType.findOne({
      organizationId: req.user.organizationId,
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingType) {
      return res.status(400).json({
        msg: 'Complaint type with this name already exists in your organization'
      });
    }

    const complaintType = new ComplaintType({
      name,
      description,
      defaultDepartmentId,
      organizationId: req.user.organizationId
    });

    const savedType = await complaintType.save();
    res.status(201).json(savedType);
  } catch (err) {
    console.error('Error creating complaint type:', err);
    res.status(500).json({ msg: 'Server error while creating complaint type' });
  }
};

// Get all complaint types
export const getComplaintTypes = async (req, res) => {
  try {
    const complaintTypes = await ComplaintType.find({
      organizationId: req.user.organizationId
    })
      .populate('defaultDepartmentId', 'name')
      .sort({ name: 1 });

    res.json(complaintTypes);
  } catch (err) {
    console.error('Error fetching complaint types:', err);
    res.status(500).json({ msg: 'Server error while fetching complaint types' });
  }
};

// Get complaint type by ID
export const getComplaintTypeById = async (req, res) => {
  try {
    const complaintType = await ComplaintType.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    }).populate('defaultDepartmentId', 'name');

    if (!complaintType) {
      return res.status(404).json({ msg: 'Complaint type not found' });
    }

    res.json(complaintType);
  } catch (err) {
    console.error('Error fetching complaint type:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Complaint type not found' });
    }
    res.status(500).json({ msg: 'Server error while fetching complaint type' });
  }
};

// Update complaint type
export const updateComplaintType = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, defaultDepartmentId } = req.body;

    // Find complaint type
    let complaintType = await ComplaintType.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!complaintType) {
      return res.status(404).json({ msg: 'Complaint type not found' });
    }

    // If name is being updated, check for duplicates
    if (name && name !== complaintType.name) {
      const existingType = await ComplaintType.findOne({
        organizationId: req.user.organizationId,
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });

      if (existingType) {
        return res.status(400).json({
          msg: 'Complaint type with this name already exists in your organization'
        });
      }
    }

    // Update fields
    if (name) complaintType.name = name;
    if (description) complaintType.description = description;
    if (defaultDepartmentId) complaintType.defaultDepartmentId = defaultDepartmentId;

    complaintType = await complaintType.save();
    res.json(complaintType);
  } catch (err) {
    console.error('Error updating complaint type:', err);
    res.status(500).json({ msg: 'Server error while updating complaint type' });
  }
};

// Delete complaint type
export const deleteComplaintType = async (req, res) => {
  try {
    const complaintType = await ComplaintType.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!complaintType) {
      return res.status(404).json({ msg: 'Complaint type not found' });
    }

    // Check if there are any complaints using this type
    const complaintsCount = await Complaint.countDocuments({
      complaintTypeId: complaintType._id
    });

    if (complaintsCount > 0) {
      return res.status(400).json({
        msg: 'Cannot delete complaint type that has associated complaints'
      });
    }

    await complaintType.deleteOne();
    res.json({ msg: 'Complaint type deleted successfully' });
  } catch (err) {
    console.error('Error deleting complaint type:', err);
    res.status(500).json({ msg: 'Server error while deleting complaint type' });
  }
};