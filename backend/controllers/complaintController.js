// controllers/complaintController.js
import { validationResult } from 'express-validator';
import { Complaint, ComplaintLog, User, Department, Workflow, WorkflowInstance } from '../models/models.js';
import { emailService } from '../services/emailService.js';
import { workflowService } from '../services/workflowService.js';
import { notificationService } from '../services/notificationService.js'; // Add this import

// Create new complaint
export const createComplaint = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      title,
      description,
      complaintTypeId,
      departmentId,
      priority,
    } = req.body;

    // Process file attachments if any
    const attachments = [];
    if (req.files && req.files.length > 0) {
      // Get server base URL from request
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      for (const file of req.files) {
        attachments.push({
          filename: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          url: `${baseUrl}/uploads/${file.filename}`
        });
      }
    }

    // Verify department exists and belongs to organization
    const department = await Department.findOne({
      _id: departmentId,
      organizationId: req.user.organizationId
    });

    if (!department) {
      return res.status(400).json({ msg: 'Invalid department' });
    }

    const complaint = new Complaint({
      title,
      description,
      complaintTypeId,
      departmentId,
      priority,
      attachments, // Add processed attachments
      complainantId: req.user._id,
      organizationId: req.user.organizationId,
      status: 'Open',
      currentStage: 'Initial Review'
    });

    const savedComplaint = await complaint.save();

    // Create initial complaint log
    await ComplaintLog.create({
      complaintId: savedComplaint._id,
      userId: req.user._id,
      action: 'CREATED',
      comment: 'Complaint created',
      previousStage: null,
      newStage: 'Initial Review'
    });

    // Initialize workflow for this complaint
    try {
      const workflowInstance = await workflowService.initializeWorkflow(savedComplaint);
      
      if (workflowInstance) {
        console.log(`Workflow initialized for complaint ${savedComplaint._id}`);
        
        // Update the complaint with initial stage name if available
        const workflow = await Workflow.findById(workflowInstance.workflowId);
        if (workflow) {
          const initialStage = workflow.stages.find(s => s.id === workflowInstance.currentStageId);
          if (initialStage) {
            savedComplaint.currentStage = initialStage.name;
            await savedComplaint.save();
          }
        }
      } else {
        console.log(`No workflow found for complaint ${savedComplaint._id}`);
      }
    } catch (workflowErr) {
      console.error('Error initializing workflow:', workflowErr);
      // Continue without failing the complaint creation
    }

    // Notify department users
    const departmentUsers = await User.find({
      departmentId,
      role: 'DepartmentUser',
      isActive: true
    });

    // Create notifications for department users
    if (departmentUsers.length > 0) {
      const userIds = departmentUsers.map(user => user._id);
      await notificationService.createNotificationsForUsers(
        userIds,
        'NEW_COMPLAINT',
        `New complaint: ${title}`,
        {
          type: 'COMPLAINT',
          id: savedComplaint._id
        }
      );
    }

    // Send email notifications to department users
    for (const user of departmentUsers) {
      try {
        await emailService.sendNewComplaintNotification(
          user.email,
          {
            userName: `${user.firstName} ${user.lastName}`,
            complaintTitle: title,
            complaintId: savedComplaint._id,
            priority
          }
        );
      } catch (error) {
        console.error('Failed to send email notification:', error);
      }
    }

    res.status(201).json(savedComplaint);
  } catch (err) {
    console.error('Error creating complaint:', err);
    res.status(500).json({ msg: 'Server error while creating complaint' });
  }
};

// Get complaints with filtering
export const getComplaints = async (req, res) => {
  try {
    const { status, priority, department, startDate, endDate } = req.query;
    const filter = { organizationId: req.user.organizationId };

    // Add filters based on user role
    if (req.user.role === 'Student') {
      filter.complainantId = req.user._id;
    } else if (req.user.role === 'DepartmentUser') {
      filter.departmentId = req.user.departmentId;
    }

    // Add query filters
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (department) filter.departmentId = department;

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const complaints = await Complaint.find(filter)
      .populate('complainantId', 'firstName lastName email')
      .populate('departmentId', 'name')
      .populate('assignedTo', 'firstName lastName')
      .populate('complaintTypeId', 'name')
      .sort({ updatedAt: -1 });

    res.json(complaints);
  } catch (err) {
    console.error('Error fetching complaints:', err);
    res.status(500).json({ msg: 'Server error while fetching complaints' });
  }
};

// Get complaint by ID
export const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    })
    .populate('complainantId', 'firstName lastName email')
    .populate('departmentId', 'name')
    .populate('assignedTo', 'firstName lastName')
    .populate('complaintTypeId', 'name');

    if (!complaint) {
      return res.status(404).json({ msg: 'Complaint not found' });
    }

    // Get complaint logs for all users
    const logs = await ComplaintLog.find({ complaintId: complaint._id })
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Get workflow information if available
    let workflowData = null;
    try {
      const workflowInstance = await WorkflowInstance.findOne({ complaintId: complaint._id })
        .populate({
          path: 'workflowId',
          populate: [
            { path: 'departmentId', select: 'name' },
            { path: 'complaintTypeId', select: 'name' }
          ]
        });

      if (workflowInstance) {
        workflowData = {
          instance: workflowInstance,
          currentStage: workflowInstance.workflowId.stages.find(
            s => s.id === workflowInstance.currentStageId
          ),
          allStages: workflowInstance.workflowId.stages.sort((a, b) => a.order - b.order),
          expectedCompletionDate: workflowInstance.expectedCompletionDate
        };
      }
    } catch (workflowErr) {
      console.error('Error fetching workflow for complaint:', workflowErr);
      // Continue without workflow data
    }

    // Add logs to complaint object
    const complaintWithData = {
      ...complaint.toObject(),
      logs,
      workflow: workflowData
    };

    res.json(complaintWithData);
  } catch (err) {
    console.error('Error fetching complaint:', err);
    res.status(500).json({ msg: 'Server error while fetching complaint' });
  }
};

// Update complaint status
export const updateComplaintStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { status, comment } = req.body;
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    }).populate('complainantId', 'email firstName lastName');

    if (!complaint) {
      return res.status(404).json({ msg: 'Complaint not found' });
    }

    // Verify user has permission to update status
    if (req.user.role === 'Student') {
      return res.status(403).json({ msg: 'Not authorized to update complaint status' });
    }

    // For DepartmentUser, verify they belong to the complaint's department
    if (
      req.user.role === 'DepartmentUser' && 
      req.user.departmentId.toString() !== complaint.departmentId.toString()
    ) {
      return res.status(403).json({ msg: 'Not authorized to update this complaint' });
    }

    // Check if there's a workflow instance for this complaint
    const workflowInstance = await WorkflowInstance.findOne({ complaintId: complaint._id })
      .populate('workflowId');

    if (workflowInstance) {
      // Get workflow and current stage
      const workflow = workflowInstance.workflowId;
      const currentStage = workflow.stages.find(s => s.id === workflowInstance.currentStageId);
      
      if (currentStage) {
        // Find a stage that corresponds to this status change
        const targetStages = workflow.stages.filter(stage => {
          const stageActions = stage.actions || [];
          return stageActions.some(action => 
            action.type === 'STATUS_UPDATE' && 
            action.config && 
            action.config.status === status
          );
        });

        if (targetStages.length > 0) {
          // Use the first matching stage
          const targetStage = targetStages[0];
          
          // Update the current stage in workflow instance history
          if (workflowInstance.currentStageId) {
            const currentHistoryEntry = workflowInstance.history.find(
              h => h.stageId === workflowInstance.currentStageId && !h.exitedAt
            );
            
            if (currentHistoryEntry) {
              currentHistoryEntry.exitedAt = new Date();
              
              // Add comment as action
              currentHistoryEntry.actions.push({
                type: 'COMMENT',
                performedBy: req.user._id,
                result: { comment },
                notes: `Status update comment: ${comment}`
              });
            }
          }

          // Add new stage to history
          workflowInstance.history.push({
            stageId: targetStage.id,
            enteredAt: new Date(),
            actions: []
          });

          // Update current stage
          workflowInstance.currentStageId = targetStage.id;
          
          // Check if this is the final stage
          const isLastStage = workflow.stages.every(s => 
            s.order <= targetStage.order || s.id === targetStage.id
          );
          
          if (isLastStage && (status === 'Resolved' || status === 'Closed')) {
            workflowInstance.isCompleted = true;
            workflowInstance.completedAt = new Date();
            workflowInstance.status = 'COMPLETED';
          }

          await workflowInstance.save();

          // Process stage actions
          await workflowService.processStageActions(workflowInstance, targetStage, complaint);
        }
      }
    }

    // Create complaint log
    await ComplaintLog.create({
      complaintId: complaint._id,
      userId: req.user._id,
      action: 'STATUS_UPDATED',
      comment,
      previousStage: complaint.status,
      newStage: status
    });

    // Update status and timestamps
    complaint.status = status;
    if (status === 'Resolved') complaint.resolvedAt = Date.now();
    if (status === 'Closed') complaint.closedAt = Date.now();

    await complaint.save();

    // Send feedback request email when complaint is resolved
    if (status === 'Resolved') {
      try {
        const complainantUser = await User.findById(complaint.complainantId);
        if (complainantUser && complainantUser.email) {
          await emailService.sendFeedbackRequest(
            complainantUser.email,
            {
              userName: `${complainantUser.firstName} ${complainantUser.lastName}`,
              complaintTitle: complaint.title,
              complaintId: complaint._id,
              resolutionComment: comment
            }
          );
        }
      } catch (emailError) {
        console.error('Failed to send feedback request email:', emailError);
        // Continue without failing the status update
      }
    }

    // Create notification for complainant
    await notificationService.createNotification({
      userId: complaint.complainantId,
      type: 'STATUS_UPDATE',
      message: `Complaint status updated to: ${status}`,
      relatedTo: {
        type: 'COMPLAINT',
        id: complaint._id
      }
    });

    // Notify complainant of status change
    try {
      await emailService.sendComplaintStatusUpdate(
        complaint.complainantId.email,
        {
          userName: `${complaint.complainantId.firstName} ${complaint.complainantId.lastName}`,
          complaintTitle: complaint.title,
          complaintId: complaint._id,
          newStatus: status,
          comment
        }
      );
    } catch (error) {
      console.error('Failed to send status update email:', error);
    }

    res.json(complaint);
  } catch (err) {
    console.error('Error updating complaint status:', err);
    res.status(500).json({ msg: 'Server error while updating complaint status' });
  }
};

// Add comment to complaint
export const getComplaintComments = async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!complaint) {
      return res.status(404).json({ msg: 'Complaint not found' });
    }

    const logs = await ComplaintLog.find({ 
      complaintId: complaint._id,
      action: { $in: ['COMMENT_ADDED', 'STATUS_UPDATED', 'ESCALATED', 'WORKFLOW_UPDATED'] }
    })
    .populate({
      path: 'userId',
      select: 'firstName lastName role departmentId',
      populate: {
        path: 'departmentId',
        select: 'name'
      }
    })
    .sort({ createdAt: -1 });

    res.json(logs);
  } catch (err) {
    console.error('Error fetching complaint comments:', err);
    res.status(500).json({ msg: 'Server error while fetching comments' });
  }
};

export const addCommentToComplaint = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { comment } = req.body;
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!complaint) {
      return res.status(404).json({ msg: 'Complaint not found' });
    }

    // Create complaint log for the comment
    const log = await ComplaintLog.create({
      complaintId: complaint._id,
      userId: req.user._id,
      action: 'COMMENT_ADDED',
      comment
    });

    await log.populate({
      path: 'userId',
      select: 'firstName lastName role departmentId',
      populate: {
        path: 'departmentId',
        select: 'name'
      }
    });

    // Create notification for relevant users
    if (req.user._id.toString() !== complaint.complainantId.toString()) {
      // If comment is from staff, notify the complainant
      await notificationService.createNotification({
        userId: complaint.complainantId,
        type: 'NEW_COMMENT',
        message: `New comment on your complaint: ${complaint.title}`,
        relatedTo: {
          type: 'COMPLAINT',
          id: complaint._id
        }
      });
    } else if (complaint.assignedTo) {
      // If comment is from complainant, notify the assigned user
      await notificationService.createNotification({
        userId: complaint.assignedTo,
        type: 'NEW_COMMENT',
        message: `New comment on complaint: ${complaint.title}`,
        relatedTo: {
          type: 'COMPLAINT',
          id: complaint._id
        }
      });
    }

    // Return the created comment with user details
    res.json(log);
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ msg: 'Server error while adding comment' });
  }
};

// Escalate complaint
export const escalateComplaint = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { reason } = req.body;
    const complaintId = req.params.id;

    // Get complaint with populated fields
    const complaint = await Complaint.findOne({
      _id: complaintId,
      organizationId: req.user.organizationId
    })
    .populate('complainantId', 'email firstName lastName')
    .populate('departmentId')
    .populate('assignedTo');

    if (!complaint) {
      return res.status(404).json({ msg: 'Complaint not found' });
    }

    // Validate escalation permissions
    if (req.user.role === 'Student') {
      return res.status(403).json({ msg: 'Not authorized to escalate complaints' });
    }

    // Cannot escalate closed complaints
    if (complaint.status === 'Closed') {
      return res.status(400).json({ msg: 'Cannot escalate closed complaints' });
    }

    // Create escalation log
    const log = await ComplaintLog.create({
      complaintId: complaint._id,
      userId: req.user._id,
      action: 'ESCALATED',
      comment: reason,
      previousStage: complaint.status,
      newStage: 'Escalated'
    });

    // Update complaint
    complaint.priority = 'Urgent';
    complaint.status = 'In Progress';
    complaint.escalatedAt = Date.now();
    complaint.escalatedBy = req.user._id;
    complaint.escalationReason = reason;

    await complaint.save();
    await log.populate('userId', 'firstName lastName');

    // Update workflow instance if exists
    const workflowInstance = await WorkflowInstance.findOne({ complaintId: complaint._id });
    if (workflowInstance) {
      workflowInstance.status = 'ESCALATED';
      await workflowInstance.save();
    }

    // Notify relevant parties
    try {
      // Notify department head
      const departmentUsers = await User.find({
        departmentId: complaint.departmentId._id,
        role: 'DepartmentUser',
        isActive: true
      });

      // Create notification for all department users
      if (departmentUsers.length > 0) {
        const userIds = departmentUsers.map(user => user._id);
        await notificationService.createNotificationsForUsers(
          userIds,
          'COMPLAINT_ESCALATED',
          `Complaint escalated: ${complaint.title}`,
          {
            type: 'COMPLAINT',
            id: complaint._id
          }
        );
      }

      // Send notifications in parallel
      await Promise.all([
        // Notify complainant
        emailService.sendComplaintStatusUpdate(
          complaint.complainantId.email,
          {
            userName: `${complaint.complainantId.firstName} ${complaint.complainantId.lastName}`,
            complaintTitle: complaint.title,
            complaintId: complaint._id,
            newStatus: 'Escalated',
            comment: reason
          }
        ),
        // Notify department users
        ...departmentUsers.map(user =>
          emailService.sendComplaintEscalationNotification(
            user.email,
            {
              userName: `${user.firstName} ${user.lastName}`,
              complaintTitle: complaint.title,
              complaintId: complaint._id,
              reason
            }
          )
        )
      ]);
    } catch (error) {
      console.error('Failed to send escalation notifications:', error);
      // Continue without failing the request
    }

    // Return updated complaint with new log
    const updatedComplaint = await Complaint.findById(complaintId)
      .populate('complainantId', 'firstName lastName email')
      .populate('departmentId', 'name')
      .populate('assignedTo', 'firstName lastName')
      .populate('complaintTypeId', 'name');

    const logs = await ComplaintLog.find({ complaintId })
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      ...updatedComplaint.toObject(),
      logs
    });

  } catch (err) {
    console.error('Error escalating complaint:', err);
    res.status(500).json({ msg: 'Server error while escalating complaint' });
  }
};

// Assign complaint to department user
export const assignComplaint = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { userId } = req.body;
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!complaint) {
      return res.status(404).json({ msg: 'Complaint not found' });
    }

    // Verify assigned user exists and belongs to the correct department
    const assignedUser = await User.findOne({
      _id: userId,
      departmentId: complaint.departmentId,
      role: 'DepartmentUser',
      isActive: true
    });

    if (!assignedUser) {
      return res.status(400).json({ msg: 'Invalid user assignment' });
    }

    // Create complaint log
    await ComplaintLog.create({
      complaintId: complaint._id,
      userId: req.user._id,
      action: 'ASSIGNED',
      comment: `Assigned to ${assignedUser.firstName} ${assignedUser.lastName}`,
      previousStage: complaint.currentStage,
      newStage: complaint.currentStage
    });

    complaint.assignedTo = userId;
    await complaint.save();

    // Create notification for assigned user
    await notificationService.createNotification({
      userId,
      type: 'ASSIGNED_COMPLAINT',
      message: `You have been assigned to complaint: ${complaint.title}`,
      relatedTo: {
        type: 'COMPLAINT',
        id: complaint._id
      }
    });

    // Send email notification to assigned user
    try {
      await emailService.sendComplaintAssignmentNotification(
        assignedUser.email,
        {
          userName: `${assignedUser.firstName} ${assignedUser.lastName}`,
          complaintTitle: complaint.title,
          complaintId: complaint._id,
          priority: complaint.priority
        }
      );
    } catch (error) {
      console.error('Failed to send assignment notification:', error);
    }

    res.json(complaint);
  } catch (err) {
    console.error('Error assigning complaint:', err);
    res.status(500).json({ msg: 'Server error while assigning complaint' });
  }
};