// controllers/feedbackController.js
import { validationResult } from 'express-validator';
import { Feedback, Complaint, User } from '../models/models.js';
import { notificationService } from '../services/notificationService.js';
import { emailService } from '../services/emailService.js';

// Submit feedback for a resolved complaint
export const submitFeedback = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { complaintId, rating, comment } = req.body;

    // Verify complaint exists and belongs to the organization
    const complaint = await Complaint.findOne({
      _id: complaintId,
      organizationId: req.user.organizationId
    })
    .populate('assignedTo', 'firstName lastName email')
    .populate('departmentId', 'name');

    if (!complaint) {
      return res.status(404).json({ msg: 'Complaint not found' });
    }

    // Check if user is the complainant
    if (complaint.complainantId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Only the complainant can provide feedback' });
    }

    // Check if complaint is resolved or closed
    if (!['Resolved', 'Closed'].includes(complaint.status)) {
      return res.status(400).json({ msg: 'Feedback can only be submitted for resolved complaints' });
    }

    // Check if feedback already exists
    const existingFeedback = await Feedback.findOne({ 
      complaintId, 
      userId: req.user._id 
    });

    if (existingFeedback) {
      return res.status(400).json({ msg: 'Feedback already submitted for this complaint' });
    }

    // Create feedback
    const feedback = new Feedback({
      complaintId,
      userId: req.user._id,
      rating,
      comment
    });

    await feedback.save();

    // Update complaint to closed status if it was only resolved
    if (complaint.status === 'Resolved') {
      complaint.status = 'Closed';
      complaint.closedAt = new Date();
      await complaint.save();
    }

    // Create notification for assigned user and department
    if (complaint.assignedTo) {
      await notificationService.createNotification({
        userId: complaint.assignedTo._id,
        type: 'FEEDBACK_RECEIVED',
        message: `New feedback received for complaint: ${complaint.title} (${rating}/5 stars)`,
        relatedTo: {
          type: 'COMPLAINT',
          id: complaint._id
        }
      });

      // Send email notification to assigned user
      try {
        await emailService.sendFeedbackNotification(
          complaint.assignedTo.email,
          {
            userName: `${complaint.assignedTo.firstName} ${complaint.assignedTo.lastName}`,
            complaintTitle: complaint.title,
            complaintId: complaint._id,
            rating,
            feedbackComment: comment,
            complainantName: `${req.user.firstName} ${req.user.lastName}`
          }
        );
      } catch (emailError) {
        console.error('Failed to send feedback notification email:', emailError);
      }
    }

    res.status(201).json({
      msg: 'Feedback submitted successfully',
      feedback: {
        ...feedback.toObject(),
        complaint: {
          title: complaint.title,
          status: complaint.status
        }
      }
    });
  } catch (err) {
    console.error('Error submitting feedback:', err);
    res.status(500).json({ msg: 'Server error while submitting feedback' });
  }
};

// Get feedback for a specific complaint
export const getFeedbackByComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;

    // Verify complaint exists and user has access
    const complaint = await Complaint.findOne({
      _id: complaintId,
      organizationId: req.user.organizationId
    });

    if (!complaint) {
      return res.status(404).json({ msg: 'Complaint not found' });
    }

    // Check access permissions
    const hasAccess = 
      complaint.complainantId.toString() === req.user._id.toString() || // Complainant
      complaint.assignedTo?.toString() === req.user._id.toString() || // Assigned user
      req.user.role === 'SuperAdmin' || // Super admin
      (req.user.role === 'DepartmentUser' && complaint.departmentId.toString() === req.user.departmentId?.toString()); // Department user

    if (!hasAccess) {
      return res.status(403).json({ msg: 'Not authorized to view this feedback' });
    }

    const feedback = await Feedback.findOne({ complaintId })
      .populate('userId', 'firstName lastName')
      .populate('complaintId', 'title status');

    if (!feedback) {
      return res.status(404).json({ msg: 'No feedback found for this complaint' });
    }

    res.json(feedback);
  } catch (err) {
    console.error('Error fetching feedback:', err);
    res.status(500).json({ msg: 'Server error while fetching feedback' });
  }
};

// Get all feedback for the organization (Admin only)
export const getAllFeedback = async (req, res) => {
  try {
    const { page = 1, limit = 10, rating, department } = req.query;

    // Build filter
    const filter = {};
    
    // Add rating filter if provided
    if (rating) {
      filter.rating = rating;
    }

    // Base query to get feedback with populated complaint data
    let feedbackQuery = Feedback.find(filter)
      .populate({
        path: 'complaintId',
        match: { organizationId: req.user.organizationId },
        populate: [
          { path: 'departmentId', select: 'name' },
          { path: 'complaintTypeId', select: 'name' }
        ]
      })
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Add department filter if provided
    if (department) {
      feedbackQuery = feedbackQuery.populate({
        path: 'complaintId',
        match: { 
          organizationId: req.user.organizationId,
          departmentId: department
        }
      });
    }

    const feedback = await feedbackQuery
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Filter out feedback where complaint is null (doesn't belong to organization)
    const validFeedback = feedback.filter(f => f.complaintId !== null);

    // Get total count for pagination
    const totalFeedback = await Feedback.countDocuments({
      ...filter,
      complaintId: { 
        $in: await Complaint.find({ organizationId: req.user.organizationId }).distinct('_id')
      }
    });

    res.json({
      feedback: validFeedback,
      totalPages: Math.ceil(totalFeedback / limit),
      currentPage: page,
      totalFeedback
    });
  } catch (err) {
    console.error('Error fetching all feedback:', err);
    res.status(500).json({ msg: 'Server error while fetching feedback' });
  }
};

// Get feedback statistics for dashboard
export const getFeedbackStats = async (req, res) => {
  try {
    // Get all complaints for the organization
    const organizationComplaints = await Complaint.find({ 
      organizationId: req.user.organizationId 
    }).distinct('_id');

    // Get feedback statistics
    const stats = await Feedback.aggregate([
      {
        $match: {
          complaintId: { $in: organizationComplaints }
        }
      },
      {
        $group: {
          _id: null,
          totalFeedback: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalFeedback: 0,
      averageRating: 0,
      ratingDistribution: []
    };

    // Calculate rating distribution
    const distribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: result.ratingDistribution.filter(r => r === rating).length
    }));

    res.json({
      totalFeedback: result.totalFeedback,
      averageRating: Math.round(result.averageRating * 10) / 10, // Round to 1 decimal
      ratingDistribution: distribution
    });
  } catch (err) {
    console.error('Error fetching feedback statistics:', err);
    res.status(500).json({ msg: 'Server error while fetching feedback statistics' });
  }
};

// Check if user can provide feedback for a complaint
export const canProvideFeedback = async (req, res) => {
  try {
    const { complaintId } = req.params;

    const complaint = await Complaint.findOne({
      _id: complaintId,
      organizationId: req.user.organizationId,
      complainantId: req.user._id
    });

    if (!complaint) {
      return res.json({ canProvideFeedback: false, reason: 'Complaint not found or not authorized' });
    }

    if (!['Resolved', 'Closed'].includes(complaint.status)) {
      return res.json({ canProvideFeedback: false, reason: 'Complaint is not yet resolved' });
    }

    const existingFeedback = await Feedback.findOne({ 
      complaintId, 
      userId: req.user._id 
    });

    if (existingFeedback) {
      return res.json({ canProvideFeedback: false, reason: 'Feedback already submitted' });
    }

    res.json({ canProvideFeedback: true });
  } catch (err) {
    console.error('Error checking feedback eligibility:', err);
    res.status(500).json({ msg: 'Server error while checking feedback eligibility' });
  }
};

// Get feedback statistics for a specific department
export const getFeedbackStatsByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    
    // Verify user has access to this department
    if (req.user.role === 'DepartmentUser' && req.user.departmentId?.toString() !== departmentId) {
      return res.status(403).json({ msg: 'Not authorized to view this department feedback' });
    }

    // Get all complaints for the department
    const departmentComplaints = await Complaint.find({ 
      organizationId: req.user.organizationId,
      departmentId: departmentId
    }).distinct('_id');

    // Get feedback statistics for this department
    const stats = await Feedback.aggregate([
      {
        $match: {
          complaintId: { $in: departmentComplaints }
        }
      },
      {
        $group: {
          _id: null,
          totalFeedback: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalFeedback: 0,
      averageRating: 0,
      ratingDistribution: []
    };

    // Calculate rating distribution
    const distribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: result.ratingDistribution.filter(r => r === rating).length
    }));

    res.json({
      totalFeedback: result.totalFeedback,
      averageRating: Math.round(result.averageRating * 10) / 10, // Round to 1 decimal
      ratingDistribution: distribution
    });
  } catch (err) {
    console.error('Error fetching department feedback statistics:', err);
    res.status(500).json({ msg: 'Server error while fetching department feedback statistics' });
  }
};

// Get all feedback for a specific department
export const getFeedbackByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { page = 1, limit = 10, rating } = req.query;

    // Verify user has access to this department
    if (req.user.role === 'DepartmentUser' && req.user.departmentId?.toString() !== departmentId) {
      return res.status(403).json({ msg: 'Not authorized to view this department feedback' });
    }

    // Build filter
    const filter = {};
    if (rating) {
      filter.rating = rating;
    }

    // Get feedback for complaints in this department
    const feedback = await Feedback.find(filter)
      .populate({
        path: 'complaintId',
        match: { 
          organizationId: req.user.organizationId,
          departmentId: departmentId
        },
        populate: [
          { path: 'complaintTypeId', select: 'name' }
        ]
      })
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Filter out feedback where complaint is null
    const validFeedback = feedback.filter(f => f.complaintId !== null);

    // Get total count for pagination
    const departmentComplaints = await Complaint.find({ 
      organizationId: req.user.organizationId,
      departmentId: departmentId
    }).distinct('_id');

    const totalFeedback = await Feedback.countDocuments({
      ...filter,
      complaintId: { $in: departmentComplaints }
    });

    res.json({
      feedback: validFeedback,
      totalPages: Math.ceil(totalFeedback / limit),
      currentPage: page,
      totalFeedback
    });
  } catch (err) {
    console.error('Error fetching department feedback:', err);
    res.status(500).json({ msg: 'Server error while fetching department feedback' });
  }
};