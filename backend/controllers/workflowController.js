// controllers/workflowController.js
import { validationResult } from 'express-validator';
import { Workflow, WorkflowInstance, Complaint, Department, ComplaintType, ComplaintLog } from '../models/models.js';
import { emailService } from '../services/emailService.js';
import { notificationService } from '../services/notificationService.js';
import workflowTemplateService from '../services/workflowTemplateService.js';

// Create a new workflow
export const createWorkflow = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      name,
      description,
      complaintTypeId,
      departmentId,
      stages,
      isActive = true
    } = req.body;

    // Verify department belongs to the organization
    if (departmentId) {
      const department = await Department.findOne({
        _id: departmentId,
        organizationId: req.user.organizationId
      });

      if (!department) {
        return res.status(400).json({ msg: 'Invalid department ID' });
      }
    }

    // Verify complaint type belongs to the organization
    if (complaintTypeId) {
      const complaintType = await ComplaintType.findOne({
        _id: complaintTypeId,
        organizationId: req.user.organizationId
      });

      if (!complaintType) {
        return res.status(400).json({ msg: 'Invalid complaint type ID' });
      }
    }

    // Validate stages have unique IDs and orders
    const stageIds = stages.map(stage => stage.id);
    const stageOrders = stages.map(stage => stage.order);

    if (new Set(stageIds).size !== stageIds.length) {
      return res.status(400).json({ msg: 'Stage IDs must be unique' });
    }

    if (new Set(stageOrders).size !== stageOrders.length) {
      return res.status(400).json({ msg: 'Stage orders must be unique' });
    }

    // Create new workflow
    const workflow = new Workflow({
      organizationId: req.user.organizationId,
      name,
      description,
      complaintTypeId,
      departmentId,
      stages,
      isActive
    });

    await workflow.save();
    res.status(201).json(workflow);
  } catch (err) {
    console.error('Error creating workflow:', err);
    res.status(500).json({ msg: 'Server error while creating workflow' });
  }
};

// Get all workflows for the organization
export const getAllWorkflows = async (req, res) => {
  try {
    const workflows = await Workflow.find({ organizationId: req.user.organizationId })
      .populate('departmentId', 'name')
      .populate('complaintTypeId', 'name')
      .sort({ updatedAt: -1 });

    res.json(workflows);
  } catch (err) {
    console.error('Error fetching workflows:', err);
    res.status(500).json({ msg: 'Server error while fetching workflows' });
  }
};

// Get workflow by ID
export const getWorkflowById = async (req, res) => {
  try {
    const workflow = await Workflow.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    })
      .populate('departmentId', 'name')
      .populate('complaintTypeId', 'name');

    if (!workflow) {
      return res.status(404).json({ msg: 'Workflow not found' });
    }

    res.json(workflow);
  } catch (err) {
    console.error('Error fetching workflow:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Workflow not found' });
    }
    res.status(500).json({ msg: 'Server error while fetching workflow' });
  }
};

// Get workflows by department
export const getWorkflowsByDepartment = async (req, res) => {
  try {
    const departmentId = req.params.id;

    // Verify department belongs to the organization
    const department = await Department.findOne({
      _id: departmentId,
      organizationId: req.user.organizationId
    });

    if (!department) {
      return res.status(404).json({ msg: 'Department not found' });
    }

    const workflows = await Workflow.find({
      organizationId: req.user.organizationId,
      departmentId
    })
      .populate('complaintTypeId', 'name')
      .sort({ updatedAt: -1 });

    res.json(workflows);
  } catch (err) {
    console.error('Error fetching workflows by department:', err);
    res.status(500).json({ msg: 'Server error while fetching workflows' });
  }
};

// Get workflows by complaint type
export const getWorkflowsByComplaintType = async (req, res) => {
  try {
    const complaintTypeId = req.params.id;

    // Verify complaint type belongs to the organization
    const complaintType = await ComplaintType.findOne({
      _id: complaintTypeId,
      organizationId: req.user.organizationId
    });

    if (!complaintType) {
      return res.status(404).json({ msg: 'Complaint type not found' });
    }

    const workflows = await Workflow.find({
      organizationId: req.user.organizationId,
      complaintTypeId
    })
      .populate('departmentId', 'name')
      .sort({ updatedAt: -1 });

    res.json(workflows);
  } catch (err) {
    console.error('Error fetching workflows by complaint type:', err);
    res.status(500).json({ msg: 'Server error while fetching workflows' });
  }
};

// Get workflow for a specific complaint
export const getWorkflowForComplaint = async (req, res) => {
  try {
    const complaintId = req.params.id;

    // Verify complaint belongs to the organization
    const complaint = await Complaint.findOne({
      _id: complaintId,
      organizationId: req.user.organizationId
    });

    if (!complaint) {
      return res.status(404).json({ msg: 'Complaint not found' });
    }

    // Find workflow instance for this complaint
    const workflowInstance = await WorkflowInstance.findOne({ complaintId })
      .populate({
        path: 'workflowId',
        populate: [
          { path: 'departmentId', select: 'name' },
          { path: 'complaintTypeId', select: 'name' }
        ]
      });

    if (!workflowInstance) {
      return res.status(404).json({ msg: 'No workflow found for this complaint' });
    }

    // Calculate expected completion date based on current stage
    const currentTime = new Date();
    const workflow = workflowInstance.workflowId;
    const currentStage = workflow.stages.find(s => s.id === workflowInstance.currentStageId);

    if (currentStage) {
      // Get remaining stages including current one
      const remainingStages = workflow.stages.filter(s => s.order >= currentStage.order);

      // Calculate remaining time in hours
      const remainingTimeInHours = remainingStages.reduce((total, stage) => {
        return total + (stage.durationInHours || 24);
      }, 0);

      // Update expected completion date if it has changed
      const expectedDate = new Date(currentTime.getTime() + (remainingTimeInHours * 60 * 60 * 1000));

      if (!workflowInstance.expectedCompletionDate ||
        expectedDate.getTime() !== workflowInstance.expectedCompletionDate.getTime()) {
        workflowInstance.expectedCompletionDate = expectedDate;
        await workflowInstance.save();
      }
    }

    res.json(workflowInstance);
  } catch (err) {
    console.error('Error fetching workflow for complaint:', err);
    res.status(500).json({ msg: 'Server error while fetching workflow' });
  }
};

// Update workflow stage for a complaint
export const updateWorkflowStage = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { stageId, comment } = req.body;
    const complaintId = req.params.id;

    // Verify complaint belongs to the organization
    const complaint = await Complaint.findOne({
      _id: complaintId,
      organizationId: req.user.organizationId
    }).populate('complainantId', 'email firstName lastName');

    if (!complaint) {
      return res.status(404).json({ msg: 'Complaint not found' });
    }

    // Check if user has permission to update this complaint
    if (req.user.role === 'Student') {
      return res.status(403).json({ msg: 'Not authorized to update workflow stage' });
    }

    // For DepartmentUser, verify they belong to the complaint's department
    if (
      req.user.role === 'DepartmentUser' &&
      req.user.departmentId.toString() !== complaint.departmentId.toString()
    ) {
      return res.status(403).json({ msg: 'Not authorized to update this complaint' });
    }

    // Find workflow instance for this complaint
    const workflowInstance = await WorkflowInstance.findOne({ complaintId })
      .populate('workflowId');

    if (!workflowInstance) {
      return res.status(404).json({ msg: 'No workflow found for this complaint' });
    }

    const workflow = workflowInstance.workflowId;

    // Verify the stage exists in this workflow
    const newStage = workflow.stages.find(s => s.id === stageId);
    if (!newStage) {
      return res.status(400).json({ msg: 'Invalid stage ID for this workflow' });
    }

    const currentStage = workflow.stages.find(s => s.id === workflowInstance.currentStageId);

    // Verify this is a valid transition
    let validTransition = false;
    if (currentStage) {
      // Check if there's a defined transition to this stage
      validTransition = currentStage.transitions.some(t => t.targetStageId === stageId);

      // If there are no transitions defined, allow any stage change
      if (currentStage.transitions.length === 0) {
        validTransition = true;
      }
    } else {
      // If no current stage (should not happen), allow any stage
      validTransition = true;
    }

    if (!validTransition) {
      return res.status(400).json({
        msg: `Invalid transition from stage ${currentStage.name} to ${newStage.name}`
      });
    }

    // Update the current stage in history
    if (workflowInstance.currentStageId) {
      const currentStageHistory = workflowInstance.history.find(
        h => h.stageId === workflowInstance.currentStageId && !h.exitedAt
      );

      if (currentStageHistory) {
        currentStageHistory.exitedAt = new Date();

        // Add action for comment if provided
        if (comment) {
          currentStageHistory.actions.push({
            type: 'COMMENT',
            performedBy: req.user._id,
            result: { comment },
            notes: `Stage transition comment: ${comment}`
          });
        }
      }
    }

    // Add new stage to history
    workflowInstance.history.push({
      stageId: newStage.id,
      enteredAt: new Date(),
      actions: []
    });

    // Update current stage
    workflowInstance.currentStageId = newStage.id;

    // Check if this is the final stage
    const isLastStage = workflow.stages.every(s => s.order <= newStage.order || s.id === newStage.id);

    if (isLastStage && newStage.transitions.length === 0) {
      workflowInstance.isCompleted = true;
      workflowInstance.completedAt = new Date();
      workflowInstance.status = 'COMPLETED';

      // Update complaint status to closed
      complaint.status = 'Closed';
      complaint.closedAt = new Date();
      await complaint.save();

      // Send completion notification to complainant
      try {
        await emailService.sendComplaintStatusUpdate(
          complaint.complainantId.email,
          {
            userName: `${complaint.complainantId.firstName} ${complaint.complainantId.lastName}`,
            complaintTitle: complaint.title,
            complaintId: complaint._id,
            newStatus: 'Closed',
            comment: 'Your complaint has completed all workflow stages and is now closed.'
          }
        );
      } catch (emailError) {
        console.error('Failed to send workflow completion email:', emailError);
      }
    }

    await workflowInstance.save();

    // Create a complaint log entry for this stage change
    await ComplaintLog.create({
      complaintId: complaint._id,
      userId: req.user._id,
      action: 'WORKFLOW_UPDATED',
      comment: comment || `Moved to ${newStage.name} stage`,
      previousStage: currentStage ? currentStage.name : null,
      newStage: newStage.name
    });

    // Create notification for the complainant
    await notificationService.createNotification({
      userId: complaint.complainantId,
      type: 'WORKFLOW_UPDATED',
      message: `Workflow stage updated to: ${newStage.name}`,
      relatedTo: {
        type: 'COMPLAINT',
        id: complaint._id
      }
    });

    res.json(workflowInstance);
  } catch (err) {
    console.error('Error updating workflow stage:', err);
    res.status(500).json({ msg: 'Server error while updating workflow stage' });
  }
};

// Update workflow
export const updateWorkflow = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      name,
      description,
      complaintTypeId,
      departmentId,
      stages,
      isActive
    } = req.body;

    // Find the workflow and verify ownership
    let workflow = await Workflow.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!workflow) {
      return res.status(404).json({ msg: 'Workflow not found' });
    }

    // Validate department if provided
    if (departmentId) {
      const department = await Department.findOne({
        _id: departmentId,
        organizationId: req.user.organizationId
      });

      if (!department) {
        return res.status(400).json({ msg: 'Invalid department ID' });
      }
    }

    // Validate complaint type if provided
    if (complaintTypeId) {
      const complaintType = await ComplaintType.findOne({
        _id: complaintTypeId,
        organizationId: req.user.organizationId
      });

      if (!complaintType) {
        return res.status(400).json({ msg: 'Invalid complaint type ID' });
      }
    }

    // Validate stages if provided
    if (stages) {
      const stageIds = stages.map(stage => stage.id);
      const stageOrders = stages.map(stage => stage.order);

      if (new Set(stageIds).size !== stageIds.length) {
        return res.status(400).json({ msg: 'Stage IDs must be unique' });
      }

      if (new Set(stageOrders).size !== stageOrders.length) {
        return res.status(400).json({ msg: 'Stage orders must be unique' });
      }
    }

    // Update fields
    if (name) workflow.name = name;
    if (description !== undefined) workflow.description = description;
    if (complaintTypeId) workflow.complaintTypeId = complaintTypeId;
    if (departmentId) workflow.departmentId = departmentId;
    if (stages) workflow.stages = stages;
    if (isActive !== undefined) workflow.isActive = isActive;

    workflow.updatedAt = Date.now();
    workflow = await workflow.save();

    res.json(workflow);
  } catch (err) {
    console.error('Error updating workflow:', err);
    res.status(500).json({ msg: 'Server error while updating workflow' });
  }
};

// Delete workflow
export const deleteWorkflow = async (req, res) => {
  try {
    // Find workflow and verify ownership
    const workflow = await Workflow.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!workflow) {
      return res.status(404).json({ msg: 'Workflow not found' });
    }

    // Check if there are any active workflow instances using this workflow
    const activeInstances = await WorkflowInstance.countDocuments({
      workflowId: workflow._id,
      isCompleted: false
    });

    if (activeInstances > 0) {
      return res.status(400).json({
        msg: 'Cannot delete workflow that has active complaints. Complete or reassign them first.'
      });
    }

    await workflow.deleteOne();
    res.json({ msg: 'Workflow deleted successfully' });
  } catch (err) {
    console.error('Error deleting workflow:', err);
    res.status(500).json({ msg: 'Server error while deleting workflow' });
  }
};

export const getWorkflowTemplates = async (req, res) => {
  try {
    const templates = workflowTemplateService.getAllTemplates();
    res.json(templates);
  } catch (err) {
    console.error('Error fetching workflow templates:', err);
    res.status(500).json({ msg: 'Server error while fetching workflow templates' });
  }
};

export const getWorkflowTemplatesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const templates = workflowTemplateService.getTemplatesByCategory(category);
    res.json(templates);
  } catch (err) {
    console.error('Error fetching workflow templates by category:', err);
    res.status(500).json({ msg: 'Server error while fetching workflow templates' });
  }
};

export const getWorkflowTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const template = workflowTemplateService.getTemplateById(id);

    if (!template) {
      return res.status(404).json({ msg: 'Template not found' });
    }

    res.json(template);
  } catch (err) {
    console.error('Error fetching workflow template:', err);
    res.status(500).json({ msg: 'Server error while fetching workflow template' });
  }
};

export const createWorkflowFromTemplate = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { templateId, complaintTypeId, departmentId, name, description } = req.body;

    // Get the template
    const template = workflowTemplateService.getTemplateById(templateId);

    if (!template) {
      return res.status(404).json({ msg: 'Template not found' });
    }

    // Verify department belongs to the organization
    if (departmentId) {
      const department = await Department.findOne({
        _id: departmentId,
        organizationId: req.user.organizationId
      });

      if (!department) {
        return res.status(400).json({ msg: 'Invalid department ID' });
      }
    }

    // Verify complaint type belongs to the organization
    if (complaintTypeId) {
      const complaintType = await ComplaintType.findOne({
        _id: complaintTypeId,
        organizationId: req.user.organizationId
      });

      if (!complaintType) {
        return res.status(400).json({ msg: 'Invalid complaint type ID' });
      }
    }

    // Create new workflow from template
    const workflow = new Workflow({
      organizationId: req.user.organizationId,
      name: name || template.name,
      description: description || template.description,
      complaintTypeId,
      departmentId,
      stages: template.stages,
      isActive: true
    });

    await workflow.save();
    res.status(201).json(workflow);
  } catch (err) {
    console.error('Error creating workflow from template:', err);
    res.status(500).json({ msg: 'Server error while creating workflow from template' });
  }
};

export const importWorkflowTemplates = async (req, res) => {
  try {
    const { organizationId, complaintTypeId, departmentId } = req.body;
    
    if (!organizationId || !complaintTypeId || !departmentId) {
      return res.status(400).json({ msg: 'Required parameters missing' });
    }
    
    // Get all templates
    const templates = workflowTemplateService.getAllTemplates();
    
    // Save them as workflows
    const createdWorkflows = [];
    
    for (const template of templates) {
      const workflow = new Workflow({
        organizationId,
        name: template.name,
        description: template.description,
        complaintTypeId,
        departmentId,
        stages: template.stages,
        isActive: true
      });
      
      await workflow.save();
      createdWorkflows.push(workflow);
    }
    
    res.status(201).json({
      msg: `Successfully imported ${createdWorkflows.length} workflow templates`,
      workflows: createdWorkflows
    });
  } catch (err) {
    console.error('Error importing workflow templates:', err);
    res.status(500).json({ msg: 'Server error while importing workflow templates' });
  }
};