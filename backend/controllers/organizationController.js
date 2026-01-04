import { validationResult } from 'express-validator';
import { Organization } from '../models/models.js';

export const registerOrganization = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    organizationName,
    organizationType,
    street,
    city,
    province,
    country,
    zipCode,
    email,
    phone,
  } = req.body;

  try {
    // Check if organization with same name exists (case-insensitive)
    let existingOrgName = await Organization.findOne({
      name: { 
        $regex: new RegExp(`^${organizationName}$`, 'i') 
      }
    });
    
    if (existingOrgName) {
      return res
        .status(400)
        .json({ msg: 'An organization with this name already exists.' });
    }

    // Check if organization with same email exists
    let existingOrgEmail = await Organization.findOne({ contactEmail: email });
    if (existingOrgEmail) {
      return res
        .status(400)
        .json({ msg: 'An organization with this email already exists.' });
    }

    // Create a new organization
    const newOrganization = new Organization({
      name: organizationName.trim(), // Remove whitespace
      type: organizationType,
      address: {
        street,
        city,
        province,
        country,
        zipCode,
      },
      contactEmail: email,
      contactPhone: phone,
    });

    // Save the organization in the database
    const savedOrganization = await newOrganization.save();

    res.status(201).json({
      msg: 'Organization successfully registered',
      organizationId: savedOrganization._id,
    });
  } catch (err) {
    // Check for duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({ 
        msg: 'This organization name or email is already registered.' 
      });
    }
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

export const getOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find().select('_id name');
    res.json(organizations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

export const getOrganizationById = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({ msg: 'Organization not found' });
    }
    res.json(organization);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Organization not found' });
    }
    res.status(500).send('Server error');
  }
};

export const checkOrganizationName = async (req, res) => {
  try {
    const name = req.params.name;
    
    // Check if organization with same name exists (case-insensitive)
    const existingOrg = await Organization.findOne({
      name: { 
        $regex: new RegExp(`^${name}$`, 'i') 
      }
    });
    
    res.json({ 
      isAvailable: !existingOrg,
      message: existingOrg ? 'Organization name is already taken' : 'Organization name is available'
    });
  } catch (err) {
    console.error('Error checking organization name:', err);
    res.status(500).json({ 
      error: 'Error checking organization name'
    });
  }
};