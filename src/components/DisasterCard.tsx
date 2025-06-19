import React from 'react';
import { MapPin, Clock, User, Tag, AlertTriangle } from 'lucide-react';

interface DisasterCardProps {
  disaster: any;
  onClick: (disaster: any) => void;
}

export function DisasterCard({ disaster, onClick }: DisasterCardProps) {
  const getUrgencyColor = (tags: string[]) => {
    if (tags.includes('urgent') || tags.includes('emergency')) {
      return 'border-l-red-500 bg-red-50';
    } else if (tags.includes('warning')) {
      return 'border-l-amber-500 bg-amber-50';
    }
    return 'border-l-blue-500 bg-blue-50';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div
      className={`border-l-4 ${getUrgencyColor(disaster.tags || [])} bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow`}
      onClick={() => onClick(disaster)}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
          {disaster.title}
        </h3>
        <span className="text-sm text-gray-500">
          <Clock className="w-4 h-4 inline mr-1" />
          {formatDate(disaster.created_at)}
        </span>
      </div>

      <p className="text-gray-700 mb-4 line-clamp-3">
        {disaster.description}
      </p>

      <div className="space-y-2 mb-4">
        {disaster.location_name && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            {disaster.location_name}
          </div>
        )}
        
        <div className="flex items-center text-sm text-gray-600">
          <User className="w-4 h-4 mr-2" />
          Reported by {disaster.owner_id}
        </div>
      </div>

      {disaster.tags && disaster.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {disaster.tags.map((tag: string) => (
            <span
              key={tag}
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                tag === 'urgent' || tag === 'emergency'
                  ? 'bg-red-100 text-red-800'
                  : tag === 'warning'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>
          {disaster.reports?.[0]?.count || 0} reports
        </span>
        <span className="text-blue-600 hover:text-blue-800 font-medium">
          View Details →
        </span>
      </div>
    </div>
  );
}