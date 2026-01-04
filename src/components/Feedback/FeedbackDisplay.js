import React from 'react';
import { Star, MessageSquare, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const FeedbackDisplay = ({ feedback, showComplaintInfo = false }) => {
  if (!feedback) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <MessageSquare className="mx-auto text-gray-400 mb-2" size={32} />
        <p className="text-gray-600">No feedback provided yet</p>
      </div>
    );
  }

  const renderStars = (rating) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={`${
              star <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium text-gray-700">
          {rating}/5
        </span>
      </div>
    );
  };

  const getRatingText = (rating) => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Unknown';
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="text-[#254E58]" size={20} />
          <h3 className="font-medium text-gray-800">Complainant Feedback</h3>
        </div>
        <div className="text-xs text-gray-500">
          {format(new Date(feedback.createdAt), 'MMM dd, yyyy')}
        </div>
      </div>

      {/* Complaint Info (if requested) */}
      {showComplaintInfo && feedback.complaintId && (
        <div className="bg-gray-50 rounded-md p-3">
          <h4 className="font-medium text-gray-800 text-sm mb-1">
            {feedback.complaintId.title}
          </h4>
          <p className="text-xs text-gray-600">
            Status: {feedback.complaintId.status}
          </p>
        </div>
      )}

      {/* Rating */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Rating:</span>
          <div className="flex items-center space-x-2">
            {renderStars(feedback.rating)}
            <span className={`text-sm font-medium ${getRatingColor(feedback.rating)}`}>
              {getRatingText(feedback.rating)}
            </span>
          </div>
        </div>
      </div>

      {/* Comment */}
      {feedback.comment && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700">Comment:</span>
          <div className="bg-gray-50 rounded-md p-3 border-l-4 border-[#254E58]">
            <p className="text-sm text-gray-700 italic">"{feedback.comment}"</p>
          </div>
        </div>
      )}

      {/* Feedback Provider */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
        <div className="flex items-center space-x-1">
          <User size={12} />
          <span>
            {feedback.userId 
              ? `${feedback.userId.firstName} ${feedback.userId.lastName}`
              : 'Anonymous'
            }
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <Calendar size={12} />
          <span>{format(new Date(feedback.createdAt), 'h:mm a')}</span>
        </div>
      </div>
    </div>
  );
};

export default FeedbackDisplay;