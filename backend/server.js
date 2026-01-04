import express from 'express';
import dotenv from 'dotenv';
// FIX: Point to backend folder
import connectDB from './backend/config/db.js'; 
import organizationRoutes from './backend/routes/organizationRoutes.js';
import authRoutes from './backend/routes/authRoutes.js';
import userRoutes from './backend/routes/userRoutes.js';
import departmentRoutes from './backend/routes/departmentRoutes.js';
import complaintRoutes from './backend/routes/complaintRoutes.js';
import complaintTypeRoutes from './backend/routes/complaintTypeRoutes.js';
import workflowRoutes from './backend/routes/workflowRoutes.js';
import notificationRoutes from './backend/routes/notificationRoutes.js';
import feedbackRoutes from './backend/routes/feedbackRoutes.js';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(express.json());

// Update CORS to allow Vercel frontend
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*', 
  credentials: true,
};

app.use(cors(corsOptions));

// FIX: Point static uploads to backend folder
app.use('/uploads', express.static(path.join(__dirname, 'backend/uploads')));

// Connect to Database
connectDB();

// API Routes
app.use('/api/organizations', organizationRoutes); 
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/complaints/types', complaintTypeRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feedback', feedbackRoutes);

// --- VERCEL CONFIGURATION ---
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
}

export default app;