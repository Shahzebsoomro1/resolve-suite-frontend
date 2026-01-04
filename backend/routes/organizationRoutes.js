import express from 'express';
import { check } from 'express-validator';
import { registerOrganization, getOrganizations, getOrganizationById, checkOrganizationName } from '../controllers/organizationController.js';

const router = express.Router();

router.post(
  '/register',
  [
    check('organizationName', 'Organization Name is required').not().isEmpty(),
    check('organizationType', 'Organization Type is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('phone', 'Phone number is required').not().isEmpty(),
    check('street', 'Street address is required').not().isEmpty(),
    check('city', 'City is required').not().isEmpty(),
    check('province', 'Province is required').not().isEmpty(),
    check('country', 'Country is required').not().isEmpty(),
    check('zipCode', 'Zip Code is required').not().isEmpty(),
  ],
  registerOrganization
);

// get all organizations
router.get('/', getOrganizations);

//get organization by ID
router.get('/:id', getOrganizationById);

// check if organization name exists
router.get('/check-name/:name', checkOrganizationName);
export default router;