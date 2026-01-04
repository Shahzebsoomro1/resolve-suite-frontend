// components/Workflow/WorkflowBuilder.js
import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Plus,
  Edit,
  Trash2,
  X,
  Check,
  Clock,
  MessageSquare,
  Users,
  Save,
  Workflow,
  AlertTriangle,
  BookTemplateIcon
} from 'lucide-react';
import WorkflowTemplateSelector from './WorkflowTemplateSelector';

// Stage configuration panel component
const StageConfigPanel = ({ stage, onUpdate, onClose, departments, actions = [] }) => {
  const [formData, setFormData] = useState({
    name: stage?.name || '',
    description: stage?.description || '',
    durationInHours: stage?.durationInHours || 24,
    actions: stage?.actions || [],
    transitions: stage?.transitions || []
  });

  const [showAddAction, setShowAddAction] = useState(false);
  const [showAddTransition, setShowAddTransition] = useState(false);
  const [newAction, setNewAction] = useState({
    type: 'NOTIFICATION',
    config: {}
  });
  const [newTransition, setNewTransition] = useState({
    targetStageId: '',
    condition: {
      type: 'ALWAYS',
      value: null
    },
    name: '',
    description: ''
  });

  // Get action configuration UI based on action type
  const getActionConfigFields = (action, onChange) => {
    switch (action.type) {
      case 'NOTIFICATION':
        return (
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={action.config?.notifyComplainant || false}
                onChange={(e) => onChange({
                  ...action.config,
                  notifyComplainant: e.target.checked
                })}
                className="rounded text-[#254E58] focus:ring-[#254E58]"
              />
              <span>Notify Complainant</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={action.config?.notifyDepartment || false}
                onChange={(e) => onChange({
                  ...action.config,
                  notifyDepartment: e.target.checked
                })}
                className="rounded text-[#254E58] focus:ring-[#254E58]"
              />
              <span>Notify Department</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={action.config?.notifyAssignee || false}
                onChange={(e) => onChange({
                  ...action.config,
                  notifyAssignee: e.target.checked
                })}
                className="rounded text-[#254E58] focus:ring-[#254E58]"
              />
              <span>Notify Assignee (if assigned)</span>
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700">Custom Message</label>
              <textarea
                value={action.config?.customMessage || ''}
                onChange={(e) => onChange({
                  ...action.config,
                  customMessage: e.target.value
                })}
                rows="2"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#254E58] focus:border-[#254E58]"
                placeholder="Optional message to include in notifications"
              />
            </div>
          </div>
        );
      case 'STATUS_UPDATE':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">New Status</label>
              <select
                value={action.config?.status || ''}
                onChange={(e) => onChange({
                  ...action.config,
                  status: e.target.value
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#254E58] focus:border-[#254E58]"
              >
                <option value="">Select a status</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Update Reason</label>
              <input
                type="text"
                value={action.config?.updateReason || ''}
                onChange={(e) => onChange({
                  ...action.config,
                  updateReason: e.target.value
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#254E58] focus:border-[#254E58]"
                placeholder="Reason for status update"
              />
            </div>
          </div>
        );
      case 'ASSIGNMENT':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Assignment Type</label>
              <select
                value={action.config?.assignmentType || 'AUTO'}
                onChange={(e) => onChange({
                  ...action.config,
                  assignmentType: e.target.value
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#254E58] focus:border-[#254E58]"
              >
                <option value="AUTO">Automatic (Balance Load)</option>
                <option value="SPECIFIC">Specific User</option>
              </select>
            </div>
            {action.config?.assignmentType === 'SPECIFIC' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">User ID (to be replaced with user selector)</label>
                <input
                  type="text"
                  value={action.config?.specificUserId || ''}
                  onChange={(e) => onChange({
                    ...action.config,
                    specificUserId: e.target.value
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#254E58] focus:border-[#254E58]"
                  placeholder="User ID"
                />
              </div>
            )}
            {action.config?.assignmentType === 'AUTO' && (
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={action.config?.findAvailableUser || false}
                  onChange={(e) => onChange({
                    ...action.config,
                    findAvailableUser: e.target.checked
                  })}
                  className="rounded text-[#254E58] focus:ring-[#254E58]"
                />
                <span>Find user with least active complaints</span>
              </label>
            )}
          </div>
        );
      case 'ESCALATION':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Escalation Reason</label>
              <input
                type="text"
                value={action.config?.escalationReason || ''}
                onChange={(e) => onChange({
                  ...action.config,
                  escalationReason: e.target.value
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#254E58] focus:border-[#254E58]"
                placeholder="Reason for escalation"
              />
            </div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={action.config?.increasePriority || false}
                onChange={(e) => onChange({
                  ...action.config,
                  increasePriority: e.target.checked
                })}
                className="rounded text-[#254E58] focus:ring-[#254E58]"
              />
              <span>Increase priority (if not already Urgent)</span>
            </label>
          </div>
        );
      default:
        return <div>No configuration needed</div>;
    }
  };

  // Get condition configuration UI based on condition type
  const getConditionConfigFields = (condition, onChange) => {
    switch (condition.type) {
      case 'TIME_BASED':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">Hours before triggering</label>
            <input
              type="number"
              value={condition.value || 24}
              onChange={(e) => onChange({
                ...condition,
                value: parseInt(e.target.value) || 24
              })}
              min="1"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#254E58] focus:border-[#254E58]"
            />
          </div>
        );
      case 'USER_ROLE':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">Required Role</label>
            <select
              value={condition.value || ''}
              onChange={(e) => onChange({
                ...condition,
                value: e.target.value
              })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#254E58] focus:border-[#254E58]"
            >
              <option value="">Select a role</option>
              <option value="SuperAdmin">Super Admin</option>
              <option value="DepartmentUser">Department User</option>
              <option value="Student">Student</option>
              <option value="Faculty">Faculty</option>
            </select>
          </div>
        );
      case 'CUSTOM':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">Custom Condition (JSON)</label>
            <textarea
              value={condition.value ? JSON.stringify(condition.value) : ''}
              onChange={(e) => {
                try {
                  const value = e.target.value ? JSON.parse(e.target.value) : null;
                  onChange({
                    ...condition,
                    value
                  });
                } catch (err) {
                  // If not valid JSON, don't update
                }
              }}
              rows="3"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#254E58] focus:border-[#254E58]"
              placeholder='{"field": "value"}'
            />
          </div>
        );
      case 'ALWAYS':
      default:
        return <div className="text-sm text-gray-500 italic">Always transition (no conditions)</div>;
    }
  };

  const handleAddAction = () => {
    const updatedActions = [...formData.actions, newAction];
    setFormData({
      ...formData,
      actions: updatedActions
    });
    setShowAddAction(false);
    setNewAction({
      type: 'NOTIFICATION',
      config: {}
    });
  };

  const handleUpdateAction = (index, config) => {
    const updatedActions = [...formData.actions];
    updatedActions[index] = {
      ...updatedActions[index],
      config
    };
    setFormData({
      ...formData,
      actions: updatedActions
    });
  };

  const handleRemoveAction = (index) => {
    const updatedActions = [...formData.actions];
    updatedActions.splice(index, 1);
    setFormData({
      ...formData,
      actions: updatedActions
    });
  };

  const handleAddTransition = () => {
    const updatedTransitions = [...formData.transitions, newTransition];
    setFormData({
      ...formData,
      transitions: updatedTransitions
    });
    setShowAddTransition(false);
    setNewTransition({
      targetStageId: '',
      condition: {
        type: 'ALWAYS',
        value: null
      },
      name: '',
      description: ''
    });
  };

  const handleUpdateTransition = (index, field, value) => {
    const updatedTransitions = [...formData.transitions];
    if (field === 'condition') {
      updatedTransitions[index] = {
        ...updatedTransitions[index],
        condition: value
      };
    } else {
      updatedTransitions[index] = {
        ...updatedTransitions[index],
        [field]: value
      };
    }
    setFormData({
      ...formData,
      transitions: updatedTransitions
    });
  };

  const handleRemoveTransition = (index) => {
    const updatedTransitions = [...formData.transitions];
    updatedTransitions.splice(index, 1);
    setFormData({
      ...formData,
      transitions: updatedTransitions
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({
      ...stage,
      ...formData
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <div className="relative transform overflow-hidden rounded-lg bg-white shadow-xl w-full max-w-2xl">
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Configure Stage
                </h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Basic Stage Info */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stage Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#254E58] focus:border-[#254E58]"
                    placeholder="Enter stage name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="2"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#254E58] focus:border-[#254E58]"
                    placeholder="Describe this stage (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Expected Duration (hours)</label>
                  <input
                    type="number"
                    value={formData.durationInHours}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      durationInHours: parseInt(e.target.value) || 24
                    })}
                    min="1"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#254E58] focus:border-[#254E58]"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    This will be used for SLA calculations and expected resolution time
                  </p>
                </div>

                {/* Actions Section */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium text-gray-700 mb-2">Stage Actions</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    Actions are performed automatically when a complaint enters this stage
                  </p>

                  {formData.actions.length > 0 ? (
                    <ul className="space-y-3 mb-4">
                      {formData.actions.map((action, index) => (
                        <li key={index} className="border rounded-lg bg-white p-3">
                          <div className="flex justify-between mb-2">
                            <div className="flex items-center">
                              {action.type === 'NOTIFICATION' && <MessageSquare className="mr-2 h-4 w-4 text-blue-500" />}
                              {action.type === 'STATUS_UPDATE' && <Check className="mr-2 h-4 w-4 text-green-500" />}
                              {action.type === 'ASSIGNMENT' && <Users className="mr-2 h-4 w-4 text-purple-500" />}
                              {action.type === 'ESCALATION' && <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />}
                              <span className="font-medium">{action.type}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveAction(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="ml-6">
                            {getActionConfigFields(action, (config) => handleUpdateAction(index, config))}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic mb-4">
                      No actions defined for this stage
                    </p>
                  )}

                  {showAddAction ? (
                    <div className="border rounded-lg bg-white p-3 mb-4">
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center">
                          <label className="block text-sm font-medium text-gray-700 mr-2">Action Type:</label>
                          <select
                            value={newAction.type}
                            onChange={(e) => setNewAction({
                              ...newAction,
                              type: e.target.value,
                              config: {} // Reset config when type changes
                            })}
                            className="border border-gray-300 rounded-md shadow-sm focus:ring-[#254E58] focus:border-[#254E58]"
                          >
                            <option value="NOTIFICATION">Notification</option>
                            <option value="STATUS_UPDATE">Status Update</option>
                            <option value="ASSIGNMENT">Assignment</option>
                            <option value="ESCALATION">Escalation</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddAction(false)}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-3">
                        {getActionConfigFields(newAction, (config) => setNewAction({
                          ...newAction,
                          config
                        }))}
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={handleAddAction}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#254E58] hover:bg-[#112D32] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#254E58]"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Action
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddAction(true)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#254E58] hover:bg-[#112D32] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#254E58]"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Action
                    </button>
                  )}
                </div>

                {/* Transitions Section */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium text-gray-700 mb-2">Stage Transitions</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    Define possible transitions from this stage to other stages
                  </p>

                  {formData.transitions.length > 0 ? (
                    <ul className="space-y-3 mb-4">
                      {formData.transitions.map((transition, index) => (
                        <li key={index} className="border rounded-lg bg-white p-3">
                          <div className="flex justify-between mb-2">
                            <div className="font-medium">
                              {transition.name || `Transition to ${transition.targetStageId}`}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveTransition(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Target Stage</label>
                              <select
                                value={transition.targetStageId}
                                onChange={(e) => handleUpdateTransition(index, 'targetStageId', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#254E58] focus:border-[#254E58]"
                              >
                                <option value="">Select a target stage</option>
                                {/* This will be populated with available stages */}
                                {actions.map(stage => (
                                  <option key={stage.id} value={stage.id}>
                                    {stage.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Transition Name</label>
                              <input
                                type="text"
                                value={transition.name || ''}
                                onChange={(e) => handleUpdateTransition(index, 'name', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#254E58] focus:border-[#254E58]"
                                placeholder="Optional name for this transition"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Condition Type</label>
                              <select
                                value={transition.condition.type}
                                onChange={(e) => handleUpdateTransition(index, 'condition', {
                                  ...transition.condition,
                                  type: e.target.value,
                                  value: null // Reset value when type changes
                                })}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#254E58] focus:border-[#254E58]"
                              >
                                <option value="ALWAYS">Always</option>
                                <option value="TIME_BASED">Time-Based</option>
                                <option value="USER_ROLE">User Role</option>
                                <option value="CUSTOM">Custom</option>
                              </select>
                            </div>
                            <div>
                              {getConditionConfigFields(transition.condition, (condition) => 
                                handleUpdateTransition(index, 'condition', condition)
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic mb-4">
                      No transitions defined for this stage
                    </p>
                  )}

                  {showAddTransition ? (
                    <div className="border rounded-lg bg-white p-3 mb-4">
                      <div className="flex justify-between mb-2">
                        <div className="font-medium">Add Transition</div>
                        <button
                          type="button"
                          onClick={() => setShowAddTransition(false)}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Target Stage</label>
                          <select
                            value={newTransition.targetStageId}
                            onChange={(e) => setNewTransition({
                              ...newTransition,
                              targetStageId: e.target.value
                            })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#254E58] focus:border-[#254E58]"
                          >
                            <option value="">Select a target stage</option>
                            {/* This will be populated with available stages */}
                            {actions.map(stage => (
                              <option key={stage.id} value={stage.id}>
                                {stage.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Transition Name</label>
                          <input
                            type="text"
                            value={newTransition.name}
                            onChange={(e) => setNewTransition({
                              ...newTransition,
                              name: e.target.value
                            })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#254E58] focus:border-[#254E58]"
                            placeholder="Optional name for this transition"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Condition Type</label>
                          <select
                            value={newTransition.condition.type}
                            onChange={(e) => setNewTransition({
                              ...newTransition,
                              condition: {
                                type: e.target.value,
                                value: null
                              }
                            })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#254E58] focus:border-[#254E58]"
                          >
                            <option value="ALWAYS">Always</option>
                            <option value="TIME_BASED">Time-Based</option>
                            <option value="USER_ROLE">User Role</option>
                            <option value="CUSTOM">Custom</option>
                          </select>
                        </div>
                        <div>
                          {getConditionConfigFields(newTransition.condition, (condition) => setNewTransition({
                            ...newTransition,
                            condition
                          }))}
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={handleAddTransition}
                          disabled={!newTransition.targetStageId}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#254E58] hover:bg-[#112D32] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#254E58] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Transition
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddTransition(true)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#254E58] hover:bg-[#112D32] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#254E58]"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Transition
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Main WorkflowBuilder component
const WorkflowBuilder = ({ 
  workflow = null, 
  onSave, 
  onCancel,
  complaintTypes = [],
  departments = [] 
}) => {
  // Initialize with empty workflow or provided one
  const [workflowData, setWorkflowData] = useState({
    name: workflow?.name || '',
    description: workflow?.description || '',
    complaintTypeId: workflow?.complaintTypeId || '',
    departmentId: workflow?.departmentId || '',
    isActive: workflow?.isActive !== undefined ? workflow.isActive : true,
    stages: workflow?.stages || []
  });

  const [selectedStage, setSelectedStage] = useState(null);
  const [selectedStageIndex, setSelectedStageIndex] = useState(null);
  const [showAddStage, setShowAddStage] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [error, setError] = useState('');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const stageRefs = useRef({});

  // Handle template selection
  const handleTemplateSelect = (template) => {
    // Map the template to the workflow data format
    const templateStages = template.stages.map(stage => ({
      ...stage,
      // Ensure transition targets are updated correctly
      transitions: stage.transitions.map(transition => {
        // Find the target stage in the template
        const targetStage = template.stages.find(s => s.id === transition.targetStageId);
        return {
          ...transition,
          // If the target stage exists, keep its ID; otherwise create a placeholder
          targetStageId: targetStage ? targetStage.id : transition.targetStageId
        };
      })
    }));

    setWorkflowData({
      ...workflowData,
      name: template.name,
      description: template.description,
      stages: templateStages
    });
    
    setShowTemplateSelector(false);
  };

  useEffect(() => {
    // Initialize with workflow data if provided
    if (workflow) {
      setWorkflowData({
        name: workflow.name || '',
        description: workflow.description || '',
        complaintTypeId: workflow.complaintTypeId?._id || workflow.complaintTypeId || '',
        departmentId: workflow.departmentId?._id || workflow.departmentId || '',
        isActive: workflow.isActive !== undefined ? workflow.isActive : true,
        stages: workflow.stages || []
      });
    }
  }, [workflow]);

  // Add a new stage
  const handleAddStage = () => {
    if (!newStageName.trim()) {
      setError('Stage name is required');
      return;
    }

    const newStage = {
      id: uuidv4(), // Generate unique ID
      name: newStageName,
      description: '',
      order: workflowData.stages.length + 1,
      durationInHours: 24,
      actions: [],
      transitions: []
    };

    setWorkflowData({
      ...workflowData,
      stages: [...workflowData.stages, newStage]
    });

    setShowAddStage(false);
    setNewStageName('');
    setError('');
  };

  // Update an existing stage
  const handleUpdateStage = (updatedStage) => {
    const updatedStages = [...workflowData.stages];
    updatedStages[selectedStageIndex] = updatedStage;
    
    setWorkflowData({
      ...workflowData,
      stages: updatedStages
    });
    
    setSelectedStage(null);
    setSelectedStageIndex(null);
  };

  // Delete a stage
  const handleDeleteStage = (index) => {
    const updatedStages = [...workflowData.stages];
    updatedStages.splice(index, 1);
    
    // Update order of remaining stages
    updatedStages.forEach((stage, idx) => {
      stage.order = idx + 1;
    });
    
    setWorkflowData({
      ...workflowData,
      stages: updatedStages
    });
  };

  // Handle drag start
  const handleDragStart = (e, stageId) => {
    e.dataTransfer.setData('stageId', stageId);
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Handle drop to reorder stages
  const handleDrop = (e, targetStageId) => {
    e.preventDefault();
    const draggedStageId = e.dataTransfer.getData('stageId');
    
    if (draggedStageId === targetStageId) return;
    
    const draggedStageIndex = workflowData.stages.findIndex(s => s.id === draggedStageId);
    const targetStageIndex = workflowData.stages.findIndex(s => s.id === targetStageId);
    
    if (draggedStageIndex === -1 || targetStageIndex === -1) return;
    
    // Create a copy and reorder
    const updatedStages = [...workflowData.stages];
    const [draggedStage] = updatedStages.splice(draggedStageIndex, 1);
    updatedStages.splice(targetStageIndex, 0, draggedStage);
    
    // Update order properties
    updatedStages.forEach((stage, idx) => {
      stage.order = idx + 1;
    });
    
    setWorkflowData({
      ...workflowData,
      stages: updatedStages
    });
  };

  // Form validation
  const validateForm = () => {
    if (!workflowData.name) {
      setError('Workflow name is required');
      return false;
    }
    
    if (!workflowData.complaintTypeId) {
      setError('Please select a complaint type');
      return false;
    }
    
    if (!workflowData.departmentId) {
      setError('Please select a department');
      return false;
    }
    
    if (workflowData.stages.length < 1) {
      setError('Workflow must have at least one stage');
      return false;
    }
    
    return true;
  };

  // Submit the workflow
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Clone and clean up data before submitting
    const workflowToSave = {
      ...workflowData,
      stages: workflowData.stages.map(stage => ({
        ...stage,
        actions: stage.actions || [],
        transitions: stage.transitions || []
      }))
    };
    
    onSave(workflowToSave);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Workflow Info */}
          <div className="space-y-4">
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={() => setShowTemplateSelector(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#254E58]"
              >
                <BookTemplateIcon className="h-4 w-4 mr-2" />
                Use Template
              </button>
            </div>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Workflow Name
              </label>
              <input
                type="text"
                id="name"
                value={workflowData.name}
                onChange={(e) => setWorkflowData({ ...workflowData, name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#254E58] focus:border-[#254E58]"
                placeholder="Enter workflow name"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={workflowData.description}
                onChange={(e) => setWorkflowData({ ...workflowData, description: e.target.value })}
                rows="2"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#254E58] focus:border-[#254E58]"
                placeholder="Describe this workflow (optional)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="complaintTypeId" className="block text-sm font-medium text-gray-700">
                  Complaint Type
                </label>
                <select
                  id="complaintTypeId"
                  value={workflowData.complaintTypeId}
                  onChange={(e) => setWorkflowData({ ...workflowData, complaintTypeId: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#254E58] focus:border-[#254E58]"
                  required
                >
                  <option value="">Select a complaint type</option>
                  {complaintTypes.map(type => (
                    <option key={type._id} value={type._id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <select
                  id="departmentId"
                  value={workflowData.departmentId}
                  onChange={(e) => setWorkflowData({ ...workflowData, departmentId: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#254E58] focus:border-[#254E58]"
                  required
                >
                  <option value="">Select a department</option>
                  {departments.map(dept => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="isActive"
                type="checkbox"
                checked={workflowData.isActive}
                onChange={(e) => setWorkflowData({ ...workflowData, isActive: e.target.checked })}
                className="h-4 w-4 text-[#254E58] focus:ring-[#254E58] border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                Active
              </label>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
              <AlertTriangle size={20} className="inline mr-2" />
              {error}
            </div>
          )}

          {/* Stages Section */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-900">Workflow Stages</h3>
              <button
                type="button"
                onClick={() => setShowAddStage(true)}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#254E58] hover:bg-[#112D32] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#254E58]"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Stage
              </button>
            </div>

            {/* Add stage form */}
            {showAddStage && (
              <div className="mb-4 p-3 border rounded-lg bg-white">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-700">Add New Stage</h4>
                  <button
                    type="button"
                    onClick={() => { setShowAddStage(false); setError(''); }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#254E58] focus:border-[#254E58]"
                    placeholder="Enter stage name"
                  />
                  <button
                    type="button"
                    onClick={handleAddStage}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#254E58] hover:bg-[#112D32] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#254E58]"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Stages list */}
            {workflowData.stages.length > 0 ? (
              <div className="space-y-3">
                {workflowData.stages
                  .sort((a, b) => a.order - b.order)
                  .map((stage, index) => (
                    <div
                      key={stage.id}
                      ref={el => stageRefs.current[stage.id] = el}
                      draggable
                      onDragStart={(e) => handleDragStart(e, stage.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, stage.id)}
                      className="flex items-center border rounded-lg bg-white p-3 cursor-move hover:shadow-md transition-shadow"
                    >
                      <div className="flex-grow">
                        <div className="flex items-center">
                          <span className="bg-[#254E58] text-white w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2">
                            {stage.order}
                          </span>
                          <span className="font-medium">{stage.name}</span>
                          {stage.durationInHours && (
                            <span className="ml-2 text-xs text-gray-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {stage.durationInHours}h
                            </span>
                          )}
                        </div>
                        {stage.description && (
                          <p className="text-sm text-gray-500 ml-8">{stage.description}</p>
                        )}
                      </div>
                      <div className="flex">
                        <button
                          type="button"
                          onClick={() => { setSelectedStage(stage); setSelectedStageIndex(index); }}
                          className="ml-2 text-gray-400 hover:text-gray-500"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStage(index)}
                          className="ml-2 text-red-400 hover:text-red-500"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-white rounded-lg border border-dashed border-gray-300">
                <Workflow className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No stages defined</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding a new stage
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#254E58]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#254E58] hover:bg-[#112D32] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#254E58]"
            >
              <Save className="h-4 w-4 mr-2" />
              {workflow ? 'Update Workflow' : 'Create Workflow'}
            </button>
          </div>
        </form>
      </div>

      {/* Stage configuration modal */}
      {selectedStage && (
        <StageConfigPanel
          stage={selectedStage}
          onUpdate={handleUpdateStage}
          onClose={() => { setSelectedStage(null); setSelectedStageIndex(null); }}
          departments={departments}
          actions={workflowData.stages.filter(s => s.id !== selectedStage.id)}
        />
      )}

      {showTemplateSelector && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <WorkflowTemplateSelector
            onSelectTemplate={handleTemplateSelect}
            onCancel={() => setShowTemplateSelector(false)}
          />
        </div>
      )}
    </div>
  );
};

export default WorkflowBuilder;