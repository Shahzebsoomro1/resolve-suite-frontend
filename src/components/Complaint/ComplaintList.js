import React from 'react';
import { format } from 'date-fns';
import { 
  AlertCircle, 
  Clock, 
  MessageCircle, 
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  User,
  Building2
} from 'lucide-react';

const priorityColors = {
  Low: 'bg-blue-100 text-blue-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  High: 'bg-orange-100 text-orange-800',
  Urgent: 'bg-red-100 text-red-800'
};

const statusColors = {
  Open: 'bg-blue-100 text-blue-800',
  'In Progress': 'bg-yellow-100 text-yellow-800',
  Resolved: 'bg-green-100 text-green-800',
  Closed: 'bg-gray-100 text-gray-800',
  Escalated: 'bg-red-100 text-red-800'
};

const StatusBadge = ({ status }) => {
  const getStatusIcon = () => {
    switch(status) {
      case 'Resolved':
        return <CheckCircle2 className="mr-1" size={12} />;
      case 'Closed':
        return <XCircle className="mr-1" size={12} />;
      case 'In Progress':
        return <Clock className="mr-1" size={12} />;
      case 'Escalated':
        return <AlertCircle className="mr-1" size={12} />;
      default:
        return <Clock className="mr-1" size={12} />;
    }
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[status]}`}>
      {getStatusIcon()}
      {status}
    </span>
  );
};

const PriorityBadge = ({ priority }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityColors[priority]}`}>
    {priority}
  </span>
);

const ComplaintList = ({ 
  complaints = [], 
  isLoading, 
  error, 
  onViewComplaint,
    currentUser,
  currentFilters = {}  
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-lg p-6 h-24" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center text-red-700">
        <AlertCircle className="mr-2" size={20} />
        <span>{error}</span>
      </div>
    );
  }

  if (!complaints?.length) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <div className="text-gray-500">
          {currentFilters.priority ? (
            <>No complaints found with {currentFilters.priority} priority</>
          ) : (
            <>No complaints found</>
          )}
        </div>
      </div>
    );
  }

  const formatDate = (date) => {
    try {
      return format(new Date(date), 'MMM d, yyyy h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  // Function to determine if complaint needs attention
  const needsAttention = (complaint) => {
    return complaint.priority === 'Urgent' || 
           complaint.status === 'Escalated' || 
           (complaint.status === 'Open' && 
            new Date() - new Date(complaint.createdAt) > 24 * 60 * 60 * 1000); // 24 hours
  };

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {complaints.map((complaint, index) => {
          const requiresAttention = needsAttention(complaint);
          
          return (
            <li 
              key={`${complaint._id}-${index}`}
              className={`hover:bg-gray-50 transition-colors duration-150 ${
                requiresAttention ? 'bg-red-50 hover:bg-red-100' : ''
              }`}
            >
              <div 
                className="px-4 py-4 sm:px-6 cursor-pointer"
                onClick={() => onViewComplaint(complaint._id)}
              >
                <div className="flex items-center justify-between">
                  <div className="truncate">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-medium text-[#254E58] truncate">
                        {complaint.title}
                      </h3>
                      <StatusBadge status={complaint.status} />
                      <PriorityBadge priority={complaint.priority} />
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span className="truncate">
                        {complaint.description}
                      </span>
                    </div>
                  </div>
                  
                  <div className="ml-4 flex flex-shrink-0 items-center space-x-4">
                    {complaint.logs?.length > 0 && (
                      <div className="flex items-center text-gray-500 text-sm">
                        <MessageCircle size={16} className="mr-1" />
                        {complaint.logs.filter(log => log.action === 'COMMENT_ADDED').length}
                      </div>
                    )}
                    <ArrowUpRight size={20} className="text-gray-400" />
                  </div>
                </div>

                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    {/* Department Info */}
                    <p className="flex items-center text-sm text-gray-500">
                      <Building2 className="mr-1.5 h-5 w-5 flex-shrink-0" />
                      {complaint.departmentId?.name}
                    </p>

                    {/* Assigned To Info - Only show if user is SuperAdmin or DepartmentUser */}
                    {(currentUser?.role === 'SuperAdmin' || currentUser?.role === 'DepartmentUser') && 
                      complaint.assignedTo && (
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        <User className="mr-1.5 h-5 w-5 flex-shrink-0" />
                        Assigned to: {complaint.assignedTo.firstName} {complaint.assignedTo.lastName}
                      </p>
                    )}
                  </div>

                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>
                      Opened: {formatDate(complaint.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ComplaintList;