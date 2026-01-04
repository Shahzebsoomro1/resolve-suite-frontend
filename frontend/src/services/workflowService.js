import API from './api';

/**
 * WorkflowService - Manages all workflow-related operations
 * This service centralizes workflow logic for better maintainability
 */
class WorkflowService {
  /**
   * Fetch workflow data for a specific complaint
   * @param {string} complaintId - The ID of the complaint
   * @returns {Promise<Object>} - Workflow data with stages and current status
   */
  async getWorkflowForComplaint(complaintId) {
    try {
      const response = await API.get(`/workflows/complaint/${complaintId}`);
      
      // Format the workflow data for easier consumption by components
      return this.formatWorkflowData(response.data);
    } catch (error) {
      console.error('Error fetching workflow for complaint:', error);
      if (error.response?.status === 404) {
        // Return null if no workflow is found (normal case for some complaints)
        return null;
      }
      throw new Error('Failed to load workflow data');
    }
  }

  /**
   * Format raw workflow data into a structured format for UI components
   * @param {Object} workflowInstance - Raw workflow instance data from API
   * @returns {Object} - Formatted workflow data
   */
  formatWorkflowData(workflowInstance) {
    if (!workflowInstance || !workflowInstance.workflowId) {
      return null;
    }

    const workflow = workflowInstance.workflowId;
    const currentStageId = workflowInstance.currentStageId;
    const currentStage = workflow.stages.find(s => s.id === currentStageId) || null;
    
    // Sort stages by order for consistent display
    const allStages = [...workflow.stages].sort((a, b) => a.order - b.order);
    
    return {
      instance: workflowInstance,
      workflow,
      currentStage,
      allStages,
      expectedCompletionDate: workflowInstance.expectedCompletionDate
    };
  }

  /**
   * Update workflow stage for a complaint
   * @param {string} complaintId - The ID of the complaint
   * @param {string} stageId - The ID of the target stage
   * @param {string} comment - Comment explaining the stage change
   * @returns {Promise<Object>} - Updated workflow instance
   */
  async updateWorkflowStage(complaintId, stageId, comment) {
    try {
      const response = await API.put(`/workflows/complaint/${complaintId}/stage`, {
        stageId,
        comment
      });
      
      // Return the formatted workflow data
      return this.formatWorkflowData(response.data);
    } catch (error) {
      console.error('Error updating workflow stage:', error);
      throw new Error(error.response?.data?.msg || 'Failed to update workflow stage');
    }
  }

  /**
   * Get available transitions for current stage
   * @param {Object} workflowData - Formatted workflow data
   * @returns {Array} - List of possible transitions
   */
  getAvailableTransitions(workflowData) {
    if (!workflowData || !workflowData.currentStage) {
      return [];
    }

    const { currentStage, allStages } = workflowData;
    
    // If the workflow has defined transitions, use those
    if (currentStage.transitions && currentStage.transitions.length > 0) {
      return currentStage.transitions.map(transition => {
        const targetStage = allStages.find(s => s.id === transition.targetStageId);
        return {
          id: transition.targetStageId,
          name: transition.name || (targetStage ? targetStage.name : 'Unknown Stage'),
          description: transition.description || '',
          targetStage
        };
      });
    }
    
    // If no transitions are defined, allow movement to any other stage
    // This is a fallback for flexibility
    return allStages
      .filter(stage => stage.id !== currentStage.id)
      .map(stage => ({
        id: stage.id,
        name: stage.name,
        description: stage.description || '',
        targetStage: stage
      }));
  }
  
  /**
   * Check if a workflow stage update would result in a status change
   * @param {Object} workflow - The workflow object
   * @param {string} currentStageId - Current stage ID
   * @param {string} targetStageId - Target stage ID
   * @returns {Object|null} - Status change info if applicable
   */
  getStatusChangeForStageTransition(workflow, currentStageId, targetStageId) {
    if (!workflow || !workflow.stages) return null;
    
    const currentStage = workflow.stages.find(s => s.id === currentStageId);
    const targetStage = workflow.stages.find(s => s.id === targetStageId);
    
    if (!currentStage || !targetStage) return null;
    
    // Check if there are any status update actions in the target stage
    const statusAction = targetStage.actions?.find(a => a.type === 'STATUS_UPDATE');
    
    if (statusAction && statusAction.config && statusAction.config.status) {
      return {
        fromStatus: null, // We don't know the current complaint status here
        toStatus: statusAction.config.status,
        automatic: true,
        reason: statusAction.config.updateReason || 'Status change due to workflow progression'
      };
    }
    
    // Check if this is a movement to final stage
    const isLastStage = workflow.stages.every(s => 
      s.order <= targetStage.order || s.id === targetStage.id
    );
    
    if (isLastStage && targetStage.transitions.length === 0) {
      return {
        fromStatus: null,
        toStatus: 'Closed',
        automatic: true,
        reason: 'Complaint has completed all workflow stages'
      };
    }
    
    return null;
  }
}

export const workflowService = new WorkflowService();
export default workflowService;