import express from 'express';
import { registerSuperAdmin, loginUser, logoutUser, signupUser } from '../controllers/authController.js'; // Import the controller
import { forgotPassword, verifyOTP, resetPassword } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';
const router = express.Router();

// POST /api/auth/register-superadmin
router.post('/register-superadmin', registerSuperAdmin);
// POST /api/auth/login
router.post('/login', loginUser);
router.post('/logout', auth, logoutUser);
router.post('/signup', signupUser);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
export default router;
