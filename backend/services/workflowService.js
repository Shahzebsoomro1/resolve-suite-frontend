// services/workflowService.js
import { Workflow, WorkflowInstance, Complaint, User } from '../models/models.js';
import { emailService } from './emailService.js';

class WorkflowService {
  constructor() {
    // Initialize with empty state
  }

  /**
   * Initialize a workflow instance for a new complaint
   * @param {Object} complaint - The complaint document
   * @returns {Promise<Object>} The created workflow instance
   */
  async initializeWorkflow(complaint) {
    try {
      // Find appropriate workflow based on complaint type and department
      const workflow = await Workflow.findOne({
        organizationId: complaint.organizationId,
        complaintTypeId: complaint.complaintTypeId,
        isActive: true
      });

      if (!workflow) {
        console.warn(`No active workflow found for complaint type ${complaint.complaintTypeId}`);
        return null;
      }

      // Get the first stage
      const firstStage = workflow.stages.reduce((prev, current) => {
        return (prev.order < current.order) ? prev : current;
      });

      if (!firstStage) {
        console.error('Workflow has no stages defined:', workflow._id);
        return null;
      }

      // Calculate expected completion date
      const totalDurationHours = workflow.stages.reduce((total, stage) => {
        return total + (stage.durationInHours || 24);
      }, 0);

      const expectedCompletionDate = new Date();
      expectedCompletionDate.setTime(expectedCompletionDate.getTime() + (totalDurationHours * 60 * 60 * 1000));

      // Create workflow instance
      const workflowInstance = new WorkflowInstance({
        complaintId: complaint._id,
        workflowId: workflow._id,
        currentStageId: firstStage.id,
        startedAt: new Date(),
        expectedCompletionDate,
        history: [{
          stageId: firstStage.id,
          enteredAt: new Date(),
          actions: []
        }]
      });

      await workflowInstance.save();
      
      // Process initial stage actions if any
      await this.processStageActions(workflowInstance, firstStage, complaint);

      return workflowInstance;
    } catch (err) {
      console.error('Error initializing workflow:', err);
      throw err;
    }
  }

  /**
   * Process actions defined for a workflow stage
   * @param {Object} workflowInstance - The workflow instance
   * @param {Object} stage - The current stage
   * @param {Object} complaint - The complaint
   */
  async processStageActions(workflowInstance, stage, complaint) {
    try {
      if (!stage.actions || stage.actions.length === 0) return;

      // Get the current history entry
      const currentHistoryEntry = workflowInstance.history.find(
        h => h.stageId === stage.id && !h.exitedAt
      );

      if (!currentHistoryEntry) return;

      // Process each action
      for (const action of stage.actions) {
        let actionResult = null;

        switch (action.type) {
          case 'NOTIFICATION':
            actionResult = await this.handleNotificationAction(action, complaint);
            break;
          case 'STATUS_UPDATE':
            actionResult = await this.handleStatusUpdateAction(action, complaint);
            break;
          case 'ASSIGNMENT':
            actionResult = await this.handleAssignmentAction(action, complaint);
            break;
          case 'ESCALATION':
            actionResult = await this.handleEscalationAction(action, complaint, workflowInstance);
            break;
        }

        // Log the action in history
        if (actionResult) {
          currentHistoryEntry.actions.push({
            type: action.type,
            performedAt: new Date(),
            result: actionResult,
            notes: `Automatic action performed by workflow`
          });
        }
      }

      // Save the updated workflow instance
      await workflowInstance.save();
    } catch (err) {
      console.error('Error processing stage actions:', err);
    }
  }

  /**
   * Handle notification actions
   * @param {Object} action - The action configuration
   * @param {Object} complaint - The complaint
   */
  async handleNotificationAction(action, complaint) {
    try {
      const { notifyComplainant, notifyDepartment, notifyAssignee, customMessage } = action.config || {};
      const notifications = [];

      // Notify complainant if configured
      if (notifyComplainant) {
        const complainant = await User.findById(complaint.complainantId);
        if (complainant && complainant.email) {
          await emailService.sendComplaintStatusUpdate(
            complainant.email,
            {
              userName: `${complainant.firstName} ${complainant.lastName}`,
              complaintTitle: complaint.title,
              complaintId: complaint._id,
              newStatus: complaint.status,
              comment: customMessage || 'Your complaint has been updated.'
            }
          );
          notifications.push(`Notified complainant ${complainant.email}`);
        }
      }

      // Notify department if configured
      if (notifyDepartment) {
        const departmentUsers = await User.find({
          departmentId: complaint.departmentId,
          isActive: true
        });

        for (const user of departmentUsers) {
          await emailService.sendNewComplaintNotification(
            user.email,
            {
              userName: `${user.firstName} ${user.lastName}`,
              complaintTitle: complaint.title,
              complaintId: complaint._id,
              priority: complaint.priority
            }
          );
          notifications.push(`Notified department user ${user.email}`);
        }
      }

      // Notify assignee if configured and complaint is assigned
      if (notifyAssignee && complaint.assignedTo) {
        const assignee = await User.findById(complaint.assignedTo);
        if (assignee && assignee.email) {
          await emailService.sendComplaintAssignmentNotification(
            assignee.email,
            {
              userName: `${assignee.firstName} ${assignee.lastName}`,
              complaintTitle: complaint.title,
              complaintId: complaint._id,
              priority: complaint.priority
            }
          );
          notifications.push(`Notified assignee ${assignee.email}`);
        }
      }

      return { notifications };
    } catch (err) {
      console.error('Error handling notification action:', err);
      return { error: err.message };
    }
  }

  /**
   * Handle status update actions
   * @param {Object} action - The action configuration
   * @param {Object} complaint - The complaint
   */
  async handleStatusUpdateAction(action, complaint) {
    try {
      const { status, updateReason } = action.config || {};
      
      if (!status) return null;

      // Update complaint status
      complaint.status = status;
      
      // Set timestamps based on status
      if (status === 'Resolved') {
        complaint.resolvedAt = new Date();
      } else if (status === 'Closed') {
        complaint.closedAt = new Date();
      }

      await complaint.save();

      return { 
        previousStatus: complaint.status,
        newStatus: status,
        reason: updateReason || 'Automatic status update by workflow'
      };
    } catch (err) {
      console.error('Error handling status update action:', err);
      return { error: err.message };
    }
  }

  /**
   * Handle assignment actions
   * @param {Object} action - The action configuration
   * @param {Object} complaint - The complaint
   */
  async handleAssignmentAction(action, complaint) {
    try {
      const { assignmentType, specificUserId, findAvailableUser } = action.config || {};
      
      let assignedUserId = null;

      if (assignmentType === 'SPECIFIC' && specificUserId) {
        // Assign to a specific user
        const user = await User.findOne({
          _id: specificUserId,
          departmentId: complaint.departmentId,
          isActive: true
        });

        if (user) {
          assignedUserId = user._id;
        }
      } else if (assignmentType === 'AUTO' && findAvailableUser) {
        // Find the department user with the least active complaints
        const departmentUsers = await User.find({
          departmentId: complaint.departmentId,
          isActive: true
        });

        if (departmentUsers.length > 0) {
          // Get active complaints for each user
          const userCounts = await Promise.all(
            departmentUsers.map(async (user) => {
              const count = await Complaint.countDocuments({
                assignedTo: user._id,
                status: { $in: ['Open', 'In Progress'] }
              });
              return { userId: user._id, count };
            })
          );

          // Find user with minimum complaints
          const minUser = userCounts.reduce((min, current) => {
            return current.count < min.count ? current : min;
          }, { count: Infinity });

          if (minUser.userId) {
            assignedUserId = minUser.userId;
          }
        }
      }

      if (assignedUserId) {
        complaint.assignedTo = assignedUserId;
        await complaint.save();

        // Notify the assigned user
        const assignee = await User.findById(assignedUserId);
        if (assignee && assignee.email) {
          await emailService.sendComplaintAssignmentNotification(
            assignee.email,
            {
              userName: `${assignee.firstName} ${assignee.lastName}`,
              complaintTitle: complaint.title,
              complaintId: complaint._id,
              priority: complaint.priority
            }
          );
        }

        return { assignedUserId };
      }

      return null;
    } catch (err) {
      console.error('Error handling assignment action:', err);
      return { error: err.message };
    }
  }

  /**
   * Handle escalation actions
   * @param {Object} action - The action configuration
   * @param {Object} complaint - The complaint
   * @param {Object} workflowInstance - The workflow instance
   */
  async handleEscalationAction(action, complaint, workflowInstance) {
    try {
      const { escalationReason, increasePriority } = action.config || {};
      
      // Mark workflow as escalated
      workflowInstance.status = 'ESCALATED';
      
      // Increase priority if configured
      if (increasePriority && complaint.priority !== 'Urgent') {
        const priorities = ['Low', 'Medium', 'High', 'Urgent'];
        const currentIndex = priorities.indexOf(complaint.priority);
        
        if (currentIndex !== -1 && currentIndex < priorities.length - 1) {
          complaint.priority = priorities[currentIndex + 1];
        }
      }

      // Add escalation fields to complaint
      complaint.escalatedAt = new Date();
      complaint.escalationReason = escalationReason || 'Automatic escalation by workflow';
      
      await complaint.save();

      // Notify department users about escalation
      const departmentUsers = await User.find({
        departmentId: complaint.departmentId,
        role: 'DepartmentUser',
        isActive: true
      });

      for (const user of departmentUsers) {
        // Only send to users with email
        if (user.email) {
          try {
            await emailService.sendComplaintStatusUpdate(
              user.email,
              {
                userName: `${user.firstName} ${user.lastName}`,
                complaintTitle: complaint.title,
                complaintId: complaint._id,
                newStatus: 'Escalated',
                comment: complaint.escalationReason
              }
            );
          } catch (emailErr) {
            console.error('Failed to send escalation email:', emailErr);
          }
        }
      }

      return { 
        escalationReason: complaint.escalationReason,
        newPriority: complaint.priority
      };
    } catch (err) {
      console.error('Error handling escalation action:', err);
      return { error: err.message };
    }
  }

  /**
   * Check for time-based transitions and auto-progress workflow if needed
   * This should be called by a scheduled job/cron
   */
  async checkTimedTransitions() {
    try {
      // Find all active workflow instances
      const activeInstances = await WorkflowInstance.find({
        isCompleted: false,
        status: 'ACTIVE'
      }).populate('workflowId complaintId');

      for (const instance of activeInstances) {
        const workflow = instance.workflowId;
        const complaint = instance.complaintId;
        
        if (!workflow || !complaint) continue;

        const currentStage = workflow.stages.find(s => s.id === instance.currentStageId);
        if (!currentStage) continue;

        // Find current stage history entry
        const currentEntry = instance.history.find(
          h => h.stageId === instance.currentStageId && !h.exitedAt
        );

        if (!currentEntry) continue;

        // Check if we've exceeded the stage duration
        const enteredAt = new Date(currentEntry.enteredAt);
        const stageTimeHours = currentStage.durationInHours || 24;
        const deadlineTime = new Date(enteredAt.getTime() + (stageTimeHours * 60 * 60 * 1000));
        
        if (new Date() > deadlineTime) {
          // Find time-based transitions
          const timeTransitions = currentStage.transitions.filter(
            t => t.condition?.type === 'TIME_BASED'
          );

          if (timeTransitions.length > 0) {
            // Get the first applicable transition
            const transition = timeTransitions[0];
            const targetStage = workflow.stages.find(s => s.id === transition.targetStageId);
            
            if (targetStage) {
              // Update stage exit time
              currentEntry.exitedAt = new Date();
              
              // Add new stage entry
              instance.history.push({
                stageId: targetStage.id,
                enteredAt: new Date(),
                actions: []
              });
              
              // Update current stage
              instance.currentStageId = targetStage.id;
              
              // Save changes
              await instance.save();
              
              // Process actions for the new stage
              await this.processStageActions(instance, targetStage, complaint);
              
              console.log(`Auto-progressed workflow ${workflow._id} for complaint ${complaint._id} from ${currentStage.name} to ${targetStage.name}`);
            }
          } else {
            // If no time-based transition but exceeded SLA, consider escalation
            if (!complaint.escalatedAt) {
              // Add automatic escalation
              instance.status = 'ESCALATED';
              
              // Update complaint
              complaint.escalatedAt = new Date();
              complaint.escalationReason = `SLA exceeded for stage ${currentStage.name}`;
              
              if (complaint.priority !== 'Urgent') {
                const priorities = ['Low', 'Medium', 'High', 'Urgent'];
                const currentIndex = priorities.indexOf(complaint.priority);
                
                if (currentIndex !== -1 && currentIndex < priorities.length - 1) {
                  complaint.priority = priorities[currentIndex + 1];
                }
              }
              
              await complaint.save();
              await instance.save();
              
              console.log(`Auto-escalated workflow ${workflow._id} for complaint ${complaint._id} due to exceeded SLA`);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error checking timed transitions:', err);
    }
  }
}

export const workflowService = new WorkflowService();