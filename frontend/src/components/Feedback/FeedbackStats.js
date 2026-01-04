// components/Admin/FeedbackStats.js
import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, TrendingUp, BarChart3 } from 'lucide-react';
import { getFeedbackStats } from '../../services/api';

const FeedbackStats = () => {
  const [stats, setStats] = useState({
    totalFeedback: 0,
    averageRating: 0,
    ratingDistribution: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const data = await getFeedbackStats();
      setStats(data);
    } catch (err) {
      setError('Failed to load feedback statistics');
      console.error('Error loading feedback stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={`${
              star <= Math.round(rating)
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium">{rating}</span>
      </div>
    );
  };

  const getBarWidth = (count) => {
    const maxCount = Math.max(...stats.ratingDistribution.map(r => r.count));
    return maxCount > 0 ? (count / maxCount) * 100 : 0;
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'bg-green-500';
    if (rating >= 3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center text-red-600">
          <MessageSquare className="mx-auto mb-2" size={48} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <MessageSquare className="mr-2 text-[#254E58]" size={24} />
            Feedback Overview
          </h3>
          <button
            onClick={loadStats}
            className="text-sm text-[#254E58] hover:text-[#1a3940] transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {stats.totalFeedback === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="mx-auto mb-4 text-gray-300" size={48} />
            <p className="text-lg font-medium">No feedback received yet</p>
            <p className="text-sm">Feedback will appear here once complaints are resolved.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Feedback */}
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <MessageSquare className="text-blue-600" size={24} />
                </div>
                <div className="text-2xl font-bold text-blue-600">{stats.totalFeedback}</div>
                <div className="text-sm text-gray-600">Total Feedback</div>
              </div>

              {/* Average Rating */}
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Star className="text-yellow-600 fill-current" size={24} />
                </div>
                <div className="text-2xl font-bold text-yellow-600">{stats.averageRating}</div>
                <div className="text-sm text-gray-600">Average Rating</div>
              </div>

              {/* Rating Quality */}
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="text-green-600" size={24} />
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.ratingDistribution.filter(r => r.rating >= 4).reduce((sum, r) => sum + r.count, 0)}
                </div>
                <div className="text-sm text-gray-600">Positive (4-5★)</div>
              </div>
            </div>

            {/* Average Rating Display */}
            <div className="flex items-center justify-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Overall Rating:</span>
              {renderStars(stats.averageRating)}
            </div>

            {/* Rating Distribution */}
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                <BarChart3 className="mr-2" size={20} />
                Rating Distribution
              </h4>
              <div className="space-y-3">
                {stats.ratingDistribution
                  .sort((a, b) => b.rating - a.rating)
                  .map((item) => (
                    <div key={item.rating} className="flex items-center space-x-4">
                      <div className="flex items-center w-16">
                        <span className="text-sm font-medium mr-1">{item.rating}</span>
                        <Star size={14} className="text-yellow-400 fill-current" />
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                        <div
                          className={`h-4 rounded-full transition-all duration-300 ${getRatingColor(item.rating)}`}
                          style={{ width: `${getBarWidth(item.count)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-600 w-8 text-right">
                        {item.count}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackStats;