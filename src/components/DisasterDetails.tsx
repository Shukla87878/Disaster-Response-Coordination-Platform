import React, { useState, useEffect } from 'react';
import { MapPin, Clock, User, Tag, AlertTriangle, MessageSquare, Shield, Globe, X } from 'lucide-react';
import { ReportForm } from './ReportForm';

interface DisasterDetailsProps {
  disaster: any;
  onClose: () => void;
}

export function DisasterDetails({ disaster, onClose }: DisasterDetailsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [socialMedia, setSocialMedia] = useState<any>(null);
  const [resources, setResources] = useState<any>(null);
  const [updates, setUpdates] = useState<any>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAdditionalData();
  }, [disaster.id]);

  const loadAdditionalData = async () => {
    setLoading(true);
    try {
      // Load social media reports
      const socialResponse = await fetch(`/api/social-media/disasters/${disaster.id}/social-media?keywords=${disaster.tags?.join(',') || ''}`);
      if (socialResponse.ok) {
        setSocialMedia(await socialResponse.json());
      }

      // Load resources
      const resourcesResponse = await fetch(`/api/resources/disasters/${disaster.id}/resources`);
      if (resourcesResponse.ok) {
        setResources(await resourcesResponse.json());
      }

      // Load official updates
      const updatesResponse = await fetch(`/api/updates/disasters/${disaster.id}/official-updates?type=${disaster.tags?.[0] || 'general'}`);
      if (updatesResponse.ok) {
        setUpdates(await updatesResponse.json());
      }
    } catch (error) {
      console.error('Error loading additional data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getUrgencyColor = (tags: string[]) => {
    if (tags?.includes('urgent') || tags?.includes('emergency')) {
      return 'text-red-600';
    } else if (tags?.includes('warning')) {
      return 'text-amber-600';
    }
    return 'text-blue-600';
  };

  const handleReportSubmit = async (reportData: any) => {
    try {
      const response = await fetch(`/api/disasters/${disaster.id}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': 'citizen1' // Mock user
        },
        body: JSON.stringify(reportData)
      });

      if (response.ok) {
        setShowReportForm(false);
        loadAdditionalData(); // Refresh data
      }
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center mb-2">
                <AlertTriangle className={`w-8 h-8 mr-3 ${getUrgencyColor(disaster.tags || [])}`} />
                {disaster.title}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                {disaster.location_name && (
                  <span className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {disaster.location_name}
                  </span>
                )}
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatDate(disaster.created_at)}
                </span>
                <span className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {disaster.owner_id}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-3xl"
            >
              <X className="w-8 h-8" />
            </button>
          </div>

          {/* Tags */}
          {disaster.tags && disaster.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {disaster.tags.map((tag: string) => (
                <span
                  key={tag}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
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
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: AlertTriangle },
              { id: 'social', label: 'Social Media', icon: MessageSquare },
              { id: 'resources', label: 'Resources', icon: Shield },
              { id: 'updates', label: 'Official Updates', icon: Globe }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed">{disaster.description}</p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowReportForm(true)}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
                >
                  Submit Report
                </button>
                <button
                  onClick={loadAdditionalData}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Refresh Data
                </button>
              </div>

              {disaster.reports && disaster.reports.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Recent Reports</h3>
                  <div className="space-y-3">
                    {disaster.reports.slice(0, 3).map((report: any) => (
                      <div key={report.id} className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700">{report.content}</p>
                        <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                          <span>By {report.user_id}</span>
                          <span>{formatDate(report.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'social' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Social Media Reports</h3>
              {socialMedia ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    Found {socialMedia.total} reports from {socialMedia.source}
                  </div>
                  {socialMedia.reports.map((report: any) => (
                    <div key={report.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium text-gray-900">@{report.user}</span>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            report.urgency === 'high' 
                              ? 'bg-red-100 text-red-800'
                              : report.urgency === 'medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {report.urgency}
                          </span>
                          {report.verified && (
                            <span className="text-blue-600 text-xs">✓ Verified</span>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2">{report.content}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{report.location_mentioned}</span>
                        <span>{formatDate(report.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Loading social media reports...</p>
              )}
            </div>
          )}

          {activeTab === 'resources' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Available Resources</h3>
              {resources ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    Found {resources.total} resources
                  </div>
                  {resources.resources.map((resource: any) => (
                    <div key={resource.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{resource.name}</h4>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {resource.type}
                        </span>
                      </div>
                      {resource.description && (
                        <p className="text-gray-700 mb-2">{resource.description}</p>
                      )}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {resource.location_name || 'Location not specified'}
                        </span>
                        {resource.capacity && (
                          <span>Capacity: {resource.capacity}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Loading resources...</p>
              )}
            </div>
          )}

          {activeTab === 'updates' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Official Updates</h3>
              {updates ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    {updates.total} updates from: {updates.sources?.join(', ')}
                  </div>
                  {updates.updates.map((update: any) => (
                    <div key={update.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{update.title}</h4>
                          <span className="text-sm text-blue-600">{update.source}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          update.priority === 'high' 
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {update.priority}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{update.content}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{formatDate(update.timestamp)}</span>
                        <a 
                          href={update.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View Source →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Loading official updates...</p>
              )}
            </div>
          )}
        </div>
      </div>

      {showReportForm && (
        <ReportForm
          disasterId={disaster.id}
          onSubmit={handleReportSubmit}
          onClose={() => setShowReportForm(false)}
        />
      )}
    </div>
  );
}