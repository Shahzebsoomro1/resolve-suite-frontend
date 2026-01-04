import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Clock,
  CheckCircle,
  ChevronRight,
  AlertTriangle,
  Calendar,
  MoreHorizontal,
  Info,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Helper function to format dates
const formatDate = (date) => {
  if (!date) return 'Not set';
  try {
    return format(new Date(date), 'MMM d, yyyy h:mm a');
  } catch (error) {
    return 'Invalid date';
  }
};

// Calculate elapsed time in a readable format
const getElapsedTime = (startDate, endDate) => {
  if (!startDate) return 'N/A';
  
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  
  const diffMs = end - start;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffDays > 0) {
    return `${diffDays}d ${diffHours}h`;
  } else if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`;
  } else {
    return `${diffMinutes}m`;
  }
};

// Get percentage of time elapsed compared to expected duration
const getTimeProgressPercentage = (startTime, duration) => {
  if (!startTime || !duration) return 0;
  
  const start = new Date(startTime);
  const now = new Date();
  const elapsedMs = now - start;
  const durationMs = duration * 60 * 60 * 1000; // Convert hours to ms
  
  const percentage = (elapsedMs / durationMs) * 100;
  return Math.min(Math.max(percentage, 0), 100); // Clamp between 0-100
};

const WorkflowViewer = ({ 
  workflowData,
  complaint,
  isFullView = false,
  onStageClick = null
}) => {
  const [expanded, setExpanded] = useState(isFullView);
  
  useEffect(() => {
    setExpanded(isFullView);
  }, [isFullView]);
  
  if (!workflowData || !workflowData.instance) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-gray-500">No workflow information available</p>
      </div>
    );
  }

  const { instance, currentStage, allStages, expectedCompletionDate } = workflowData;
  const workflowName = instance.workflowId?.name || 'Workflow';
  const stages = [...allStages].sort((a, b) => a.order - b.order);
  const currentStageIndex = stages.findIndex(s => s.id === instance.currentStageId);
  
  // Calculate progress percentage
  const progressPercentage = currentStageIndex >= 0 
    ? Math.round(((currentStageIndex + 1) / stages.length) * 100)
    : 0;
  
  // Determine if workflow is on track or delayed
  const isDelayed = instance.status === 'ESCALATED' || (
    expectedCompletionDate && new Date() > new Date(expectedCompletionDate)
  );

  // Compact view for summarized workflow status
  const CompactView = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-900">{workflowName}</h3>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-gray-400 hover:text-gray-600 p-1"
          aria-label={expanded ? "Collapse workflow details" : "Expand workflow details"}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      
      <div className="space-y-2">
        {/* Status and progress bar */}
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center">
            <span className="mr-2">Progress:</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <div className="flex items-center">
            {isDelayed ? (
              <div className="flex items-center text-red-600">
                <AlertTriangle size={14} className="mr-1" />
                <span>Delayed</span>
              </div>
            ) : (
              <div className="flex items-center text-green-600">
                <Clock size={14} className="mr-1" />
                <span>On Track</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${isDelayed ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        
        {/* Current stage info */}
        <div className="flex justify-between items-center text-xs text-gray-500">
          <div>
            Current: <span className="font-medium text-gray-900">{currentStage?.name || 'Unknown'}</span>
          </div>
          {expectedCompletionDate && (
            <div className="flex items-center">
              <Calendar size={14} className="mr-1" />
              Expected completion: {formatDate(expectedCompletionDate)}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Detailed view showing the entire workflow timeline
  const DetailedView = () => (
    <div className="space-y-4 mt-3">
      {/* Stage timeline */}
      <div className="relative pt-1">
        {stages.map((stage, index) => {
          const isPast = index < currentStageIndex;
          const isCurrent = index === currentStageIndex;
          const isFuture = index > currentStageIndex;
          
          // Find stage in history
          const stageHistory = instance.history?.find(h => h.stageId === stage.id);
          const stageStarted = stageHistory?.enteredAt;
          const stageEnded = stageHistory?.exitedAt;
          
          // Calculate time progress for current stage
          let timeProgress = 0;
          if (isCurrent && stageStarted && stage.durationInHours) {
            timeProgress = getTimeProgressPercentage(stageStarted, stage.durationInHours);
          }
          
          // Generate a clickable class if onStageClick is provided and stage is valid to click
          const isClickable = onStageClick && (isPast || isCurrent);
          const clickableClass = isClickable ? 'cursor-pointer hover:bg-gray-50' : '';
          
          return (
            <div 
              key={stage.id} 
              className={`flex mb-4 p-2 rounded-lg ${clickableClass}`}
              onClick={() => isClickable && onStageClick(stage)}
            >
              {/* Stage indicator */}
              <div className="flex flex-col items-center mr-4">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center 
                  ${isPast 
                    ? 'bg-green-500 text-white' 
                    : isCurrent 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-400'
                  }
                `}>
                  {isPast ? (
                    <CheckCircle size={16} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                {index < stages.length - 1 && (
                  <div className={`
                    w-0.5 h-8 
                    ${isPast ? 'bg-green-500' : 'bg-gray-200'}
                  `}></div>
                )}
              </div>
              
              {/* Stage details */}
              <div className="flex-1">
                <div className="flex items-center">
                  <h4 className={`
                    font-medium
                    ${isPast 
                      ? 'text-green-600' 
                      : isCurrent 
                        ? 'text-blue-600' 
                        : 'text-gray-400'
                    }
                  `}>
                    {stage.name}
                  </h4>
                  {isCurrent && instance.status === 'ESCALATED' && (
                    <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                      Escalated
                    </span>
                  )}
                </div>
                
                {(isPast || isCurrent) && (
                  <div className="text-xs text-gray-500 mt-1">
                    <div className="flex items-center">
                      <Clock size={12} className="mr-1" />
                      Started: {formatDate(stageStarted)}
                    </div>
                    {isPast && (
                      <div className="flex items-center mt-1">
                        <CheckCircle size={12} className="mr-1 text-green-500" />
                        Completed: {formatDate(stageEnded)}
                        <span className="ml-2">
                          (Duration: {getElapsedTime(stageStarted, stageEnded)})
                        </span>
                      </div>
                    )}
                    {isCurrent && (
                      <>
                        <div className="flex items-center mt-1">
                          <Clock size={12} className="mr-1" />
                          Elapsed: {getElapsedTime(stageStarted)}
                        </div>
                        {stage.durationInHours && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Time progress:</span>
                              <span className={timeProgress > 100 ? 'text-red-500 font-medium' : ''}>
                                {Math.min(Math.round(timeProgress), 100)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full ${
                                  timeProgress > 90 ? 'bg-red-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min(timeProgress, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
                
                {isFuture && (
                  <div className="text-xs text-gray-400 mt-1">
                    Expected duration: {stage.durationInHours || 24}h
                  </div>
                )}
                
                {/* Actions if any */}
                {stage.actions && stage.actions.length > 0 && (
                  <div className="mt-2 text-xs">
                    <div className="flex items-center text-gray-500">
                      <Info size={12} className="mr-1" />
                      <span>
                        {stage.actions.length} automatic {stage.actions.length === 1 ? 'action' : 'actions'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Overall workflow details */}
      <div className="bg-gray-50 rounded-lg p-4 mt-4 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-2">Workflow Details</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <span className="text-gray-500">Started:</span>
            <span className="ml-1 font-medium">{formatDate(instance.startedAt)}</span>
          </div>
          <div>
            <span className="text-gray-500">Status:</span>
            <span className={`ml-1 font-medium ${
              instance.status === 'COMPLETED' 
                ? 'text-green-600' 
                : instance.status === 'ESCALATED' 
                  ? 'text-red-600' 
                  : 'text-blue-600'
            }`}>
              {instance.status}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Expected Completion:</span>
            <span className="ml-1 font-medium">{formatDate(expectedCompletionDate)}</span>
          </div>
          {instance.completedAt && (
            <div>
              <span className="text-gray-500">Completed:</span>
              <span className="ml-1 font-medium">{formatDate(instance.completedAt)}</span>
            </div>
          )}
          <div className="col-span-2">
            <span className="text-gray-500">Total Duration:</span>
            <span className="ml-1 font-medium">
              {instance.completedAt 
                ? getElapsedTime(instance.startedAt, instance.completedAt)
                : getElapsedTime(instance.startedAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="workflow-viewer">
      <CompactView />
      {expanded && <DetailedView />}
    </div>
  );
};

export default WorkflowViewer;