import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { 
  Send, 
  User, 
  Loader, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  ArrowUpCircle,
  MessageCircle,
  X 
} from 'lucide-react';
import { fetchComplaintComments, addCommentToComplaint } from '../../services/api';

const ComplaintComments = ({ 
  complaint,
  currentUser,
  initialComments = [],
  refreshTrigger = 0,
  onAddComment,
  isDisabled = false
}) => {
  // State management
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');
  const [state, setState] = useState({
    isSubmitting: false,
    isLoading: false,
    error: null,
    hasInitializedComments: false
  });
  
  const commentsEndRef = useRef(null);
  const prevComplaintIdRef = useRef(null);
  const prevRefreshTriggerRef = useRef(refreshTrigger);

  // Scroll to bottom when new comments are added
  const scrollToBottom = useCallback(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Track when complaint changes
  useEffect(() => {
    if (complaint?._id !== prevComplaintIdRef.current) {
      setState(prev => ({ 
        ...prev, 
        hasInitializedComments: false,
        isLoading: true 
      }));
      
      // Set comments from initialComments immediately for a better UX
      if (initialComments?.length > 0) {
        const sortedComments = [...initialComments].sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );
        setComments(sortedComments);
      } else {
        setComments([]);
      }
      
      // Always fetch the latest comments when complaint changes
      if (complaint?._id) {
        fetchComments();
      }
      
      prevComplaintIdRef.current = complaint?._id;
    }
  }, [complaint?._id, initialComments]);

  // Initialize from initial comments if available
  useEffect(() => {
    if (initialComments?.length > 0 && !state.hasInitializedComments) {
      const sortedComments = [...initialComments].sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      setComments(sortedComments);
      setState(prev => ({ ...prev, hasInitializedComments: true }));
    }
  }, [initialComments, state.hasInitializedComments]);

  // Handle refreshTrigger changes
  useEffect(() => {
    if (complaint?._id && refreshTrigger !== prevRefreshTriggerRef.current) {
      fetchComments();
      prevRefreshTriggerRef.current = refreshTrigger;
    }
  }, [complaint?._id, refreshTrigger]);

  // Scroll to bottom after comments load or update
  useEffect(() => {
    scrollToBottom();
  }, [comments.length, scrollToBottom]);

  const fetchComments = useCallback(async () => {
    if (!complaint?._id) return;
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const fetchedComments = await fetchComplaintComments(complaint._id);
      
      // Sort comments by createdAt in ascending order for chronological display
      const sortedComments = [...fetchedComments].sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      setComments(sortedComments);
      setState(prev => ({ 
        ...prev, 
        hasInitializedComments: true,
        isLoading: false
      }));
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load comments. Please try again.',
        isLoading: false
      }));
      console.error('Error loading comments:', err);
    }
  }, [complaint?._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !complaint?._id || state.isSubmitting || isDisabled) return;
  
    try {
      setState(prev => ({ ...prev, isSubmitting: true, error: null }));
      
      // Add the new comment to the local state for immediate feedback (optimistic UI)
      const tempComment = {
        _id: `temp-${Date.now()}`,
        userId: {
          _id: currentUser?._id,
          firstName: currentUser?.firstName || '',
          lastName: currentUser?.lastName || '',
          role: currentUser?.role,
          departmentId: currentUser?.departmentId || null
        },
        complaintId: complaint._id,
        action: 'COMMENT_ADDED',
        comment: newComment.trim(),
        createdAt: new Date().toISOString()
      };
      
      setComments(prev => [...prev, tempComment]);
      const commentToSubmit = newComment.trim();
      setNewComment(''); // Clear input field immediately
      
      if (onAddComment) {
        // Use the parent component's handler - ensure we send a simple string
        await onAddComment(complaint._id, { comment: commentToSubmit });
      } else {
        // Use the direct API call
        await addCommentToComplaint(complaint._id, { comment: commentToSubmit });
      }
      
      // Refresh comments from the server after successful submission
      setTimeout(() => {
        fetchComments();
      }, 300);
      
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err.message || 'Failed to add comment. Please try again.'
      }));
      console.error('Comment submission error:', err);
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleClearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const formatDate = (date) => {
    try {
      return format(new Date(date), 'MMM d, yyyy h:mm a');
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  };

  // Get comment type display information
  const getCommentTypeInfo = (comment) => {
    switch(comment.action) {
      case 'STATUS_UPDATED':
        return {
          icon: Clock,
          label: 'Status Update',
          className: 'bg-blue-50 text-blue-700'
        };
      case 'ESCALATED':
        return {
          icon: ArrowUpCircle,
          label: 'Escalation',
          className: 'bg-red-50 text-red-700'
        };
      case 'CREATED':
        return {
          icon: CheckCircle2,
          label: 'Created',
          className: 'bg-green-50 text-green-700'
        };
      case 'ASSIGNED':
        return {
          icon: User,
          label: 'Assignment',
          className: 'bg-purple-50 text-purple-700'
        };
      case 'WORKFLOW_UPDATED':
        return {
          icon: Clock,
          label: 'Workflow Update',
          className: 'bg-indigo-50 text-black-700'
        };
      default:
        return {
          icon: MessageCircle,
          label: 'Comment',
          className: 'bg-gray-50 text-gray-700'
        };
    }
  };

  // Check if the complaint is closed or resolved
  const isComplaintClosed = complaint?.status === 'Closed';
  const canAddComment = !isComplaintClosed && currentUser && !isDisabled;

  // Loading state
  if (state.isLoading && !comments.length) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader className="animate-spin h-6 w-6 text-[#254E58]" />
        <span className="ml-2 text-gray-600">Loading comments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          Comments & Updates
          {state.isLoading && (
            <Loader className="ml-2 h-4 w-4 animate-spin text-gray-400" />
          )}
        </h3>
        {state.error && (
          <button 
            onClick={handleClearError}
            className="text-red-500 hover:text-red-700"
            aria-label="Clear error"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-center">
          <AlertCircle size={16} className="mr-2 flex-shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto p-1">
        {comments.length > 0 ? (
          comments.map((comment, index) => {
            const isCurrentUser = comment.userId?._id === currentUser?._id;
            const typeInfo = getCommentTypeInfo(comment);
            const Icon = typeInfo.icon;
            
            return (
              <div 
                key={comment._id || index}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`relative max-w-xl rounded-lg px-4 py-2 shadow-sm
                    ${isCurrentUser 
                      ? 'bg-[#254E58] text-white' 
                      : typeInfo.className}`}
                >
                  {/* Comment Header */}
                  <div className="flex items-center space-x-2 text-sm">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">
                      {comment.userId?.firstName || ''} {comment.userId?.lastName || ''}
                    </span>
                    <span className={`text-xs rounded-full px-2 py-0.5 ${
                      isCurrentUser 
                        ? 'bg-white/20 text-white' 
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {comment.userId?.role === 'DepartmentUser' && comment.userId?.departmentId?.name
                        ? comment.userId.departmentId.name
                        : comment.userId?.role || 'User'}
                    </span>
                    <span className={`text-xs ${isCurrentUser ? 'text-gray-300' : 'text-gray-500'}`}>
                      {formatDate(comment.createdAt)}
                    </span>
                    {comment.action !== 'COMMENT_ADDED' && (
                      <span className="text-xs font-medium">
                        {typeInfo.label}
                      </span>
                    )}
                  </div>

                  {/* Comment Content */}
                  {comment.action === 'STATUS_UPDATED' ? (
                    <div className="mt-1 text-sm">
                      <p>Changed status from <strong>{comment.previousStage}</strong> to <strong>{comment.newStage}</strong></p>
                      <p className="mt-1">{comment.comment}</p>
                    </div>
                  ) : comment.action === 'ESCALATED' ? (
                    <div className="mt-1 text-sm">
                      <p>Complaint Escalated</p>
                      <p className="mt-1">{comment.comment}</p>
                    </div>
                  ) : comment.action === 'WORKFLOW_UPDATED' ? (
                    <div className="mt-1 text-sm">
                      <p>Workflow Updated: {comment.previousStage} → {comment.newStage}</p>
                      <p className="mt-1">{comment.comment}</p>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm whitespace-pre-wrap">
                      {comment.comment}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No comments or updates yet</p>
            {canAddComment && (
              <p className="text-gray-400 text-xs mt-1">Be the first to comment on this complaint</p>
            )}
          </div>
        )}
        {/* This div is used to scroll to the bottom */}
        <div ref={commentsEndRef} />
      </div>

      {/* Comments Form */}
      {canAddComment && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex space-x-3">
            <div className="flex-grow">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows="2"
                className={`block w-full rounded-lg shadow-sm border 
                  ${state.error ? 'border-red-300' : 'border-gray-300'}
                  focus:border-[#254E58] focus:ring-[#254E58] 
                  disabled:bg-gray-50 disabled:text-gray-500
                  text-sm`}
                placeholder="Add a comment..."
                maxLength={1000}
                disabled={state.isSubmitting || isDisabled}
              />
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>{newComment.length}/1000 characters</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={state.isSubmitting || !newComment.trim() || !complaint?._id || isDisabled}
              className={`inline-flex items-center px-4 py-2 border border-transparent 
                rounded-lg shadow-sm text-sm font-medium text-white
                bg-[#254E58] hover:bg-[#112D32] 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#254E58]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors duration-200`}
            >
              {state.isSubmitting ? (
                <>
                  <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </button>
          </div>
        </form>
      )}
      {!canAddComment && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500">
          <p className="text-sm">
            {isComplaintClosed 
              ? "This complaint is closed. New comments cannot be added." 
              : "You need to be logged in to add comments."}
          </p>
        </div>
      )}
    </div>
  );
};

export default ComplaintComments;