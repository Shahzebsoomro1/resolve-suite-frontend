import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Organization } from '../models/models.js';
import { otpService } from '../services/otpService.js';
import { emailService } from '../services/emailService.js';

// SuperAdmin registration
export const registerSuperAdmin = async (req, res) => {
  const { firstName, lastName, email, password, organizationId } = req.body;

  try {
    // Check if the organization exists
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(400).json({ msg: 'Invalid organization ID' });
    }

    // Check if SuperAdmin already exists for this organization
    const existingSuperAdmin = await User.findOne({ email, organizationId, role: 'SuperAdmin' });
    if (existingSuperAdmin) {
      return res.status(400).json({ msg: 'SuperAdmin already exists for this organization' });
    }

    // Generate Registration Number for SuperAdmin
    const orgInitials = organization.name.substring(0, 3).toUpperCase();
    const superAdminCount = await User.countDocuments({ organizationId, role: 'SuperAdmin' });
    const registrationId = `${orgInitials}_SUPER_${superAdminCount + 1}`;

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create the SuperAdmin user
    const superAdmin = new User({
      firstName,
      lastName,
      email,
      passwordHash,
      role: 'SuperAdmin',
      organizationId,
      registrationId,
    });

    // Save the SuperAdmin user
    await superAdmin.save();

    // Update the organization to include the SuperAdmin in the `super_admins` array
    organization.super_admins.push(superAdmin._id);
    await organization.save(); // Save the updated organization

    // Create JWT token
    const payload = {
      userId: superAdmin._id,
      organizationId: organizationId,
      role: 'SuperAdmin',
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Respond with the token and registration number
    res.status(201).json({ token, msg: 'SuperAdmin registered successfully', registrationId });
  } catch (err) {
    console.error('Error registering SuperAdmin:', err.message);
    res.status(500).send('Server Error');
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const payload = { 
      userId: user._id, 
      role: user.role,
      organizationId: user.organizationId
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Return more user data
    res.json({
      token,
      role: user.role,
      userId: user._id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      departmentId: user.departmentId || null,
      organizationId: user.organizationId
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

export const logoutUser = async (req, res) => {
  try {
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Error during logout' });
  }
};

export const signupUser = async (req, res) => {
  const { registrationId, email, password, firstName, lastName } = req.body;

  try {
    // Check if user with this registration ID exists and is not active
    const existingUser = await User.findOne({ registrationId, isActive: false });
    if (!existingUser) {
      return res.status(400).json({ msg: 'Invalid registration ID' });
    }

    // Check if the email matches the pre-approved email
    if (existingUser.email !== email) {
      return res.status(400).json({ msg: 'Email does not match the pre-approved email for this registration ID' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Update the user with the new information
    existingUser.firstName = firstName;
    existingUser.lastName = lastName;
    existingUser.passwordHash = passwordHash;
    existingUser.isActive = true;

    await existingUser.save();

    // Create and send the token
    const payload = {
      userId: existingUser._id,
      role: existingUser.role,
      organizationId: existingUser.organizationId
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ token, msg: 'User registered successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email })
      .populate('organizationId', 'name');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Generate and store OTP
    const otp = otpService.generateOTP();
    otpService.storeOTP(email, otp);

    // Send email with OTP
    await emailService.sendPasswordResetEmail(email, user, otp);

    res.json({ msg: 'OTP sent to your email' });

  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ 
      msg: 'Failed to send password reset email',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
};

export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const isValid = otpService.verifyOTP(email, otp);

    if (!isValid) {
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }

    res.json({ msg: 'OTP verified successfully' });
  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const resetPassword = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);
    await user.save();

    res.json({ msg: 'Password reset successful' });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};