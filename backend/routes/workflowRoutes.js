// routes/workflowRoutes.js
import express from 'express';
import { check } from 'express-validator';
import { auth, isSuperAdmin } from '../middleware/auth.js';
import {
  createWorkflow,
  getAllWorkflows,
  getWorkflowById,
  updateWorkflow,
  deleteWorkflow,
  getWorkflowsByDepartment,
  getWorkflowsByComplaintType,
  getWorkflowForComplaint,
  updateWorkflowStage,
  createWorkflowFromTemplate,
  importWorkflowTemplates,
  getWorkflowTemplates,
  getWorkflowTemplatesByCategory,
  getWorkflowTemplateById
} from '../controllers/workflowController.js';

const router = express.Router();

// Create new workflow - POST /api/workflows
router.post(
  '/',
  auth,
  isSuperAdmin,
  [
    check('name', 'Workflow name is required').notEmpty(),
    check('stages', 'At least one stage is required').isArray({ min: 1 }),
    check('stages.*.id', 'Stage ID is required').notEmpty(),
    check('stages.*.name', 'Stage name is required').notEmpty(),
    check('stages.*.order', 'Stage order is required').isNumeric()
  ],
  createWorkflow
);

// Create workflow from template
router.post(
  '/from-template',
  auth,
  isSuperAdmin,
  [
    check('templateId', 'Template ID is required').notEmpty(),
    check('complaintTypeId', 'Complaint type is required').notEmpty(),
    check('departmentId', 'Department is required').notEmpty()
  ],
  createWorkflowFromTemplate
);

router.post(
  '/import-templates',
  auth,
  isSuperAdmin,
  importWorkflowTemplates
);

// Get all workflows - GET /api/workflows
router.get('/', auth, getAllWorkflows);

// Get workflow by ID - GET /api/workflows/:id
router.get('/:id', auth, getWorkflowById);

// Get workflows by department - GET /api/workflows/department/:id
router.get('/department/:id', auth, getWorkflowsByDepartment);

// Get workflows by complaint type - GET /api/workflows/complaint-type/:id
router.get('/complaint-type/:id', auth, getWorkflowsByComplaintType);

// Get workflow for a specific complaint - GET /api/workflows/complaint/:id
router.get('/complaint/:id', auth, getWorkflowForComplaint);

// Update workflow stage for a complaint - PUT /api/workflows/complaint/:id/stage
router.put(
  '/complaint/:id/stage',
  auth,
  [
    check('stageId', 'Target stage ID is required').notEmpty(),
    check('comment', 'Comment is required').optional()
  ],
  updateWorkflowStage
);

// Update workflow - PUT /api/workflows/:id
router.put(
  '/:id',
  auth,
  isSuperAdmin,
  [
    check('name', 'Workflow name is required').optional().notEmpty(),
    check('stages', 'At least one stage is required').optional().isArray({ min: 1 })
  ],
  updateWorkflow
);

// Delete workflow - DELETE /api/workflows/:id
router.delete('/:id', auth, isSuperAdmin, deleteWorkflow);

// Template routes
router.get('/templates', auth, getWorkflowTemplates);
router.get('/templates/category/:category', auth, getWorkflowTemplatesByCategory);
router.get('/templates/:id', auth, getWorkflowTemplateById);

export default router;