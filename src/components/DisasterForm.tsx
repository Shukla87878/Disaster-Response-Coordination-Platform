import React, { useState } from 'react';
import { Plus, MapPin, AlertTriangle } from 'lucide-react';

interface DisasterFormProps {
  onSubmit: (data: any) => void;
  onClose: () => void;
}

export function DisasterForm({ onSubmit, onClose }: DisasterFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    location_name: '',
    description: '',
    tags: [] as string[]
  });

  const [newTag, setNewTag] = useState('');

  const commonTags = ['flood', 'earthquake', 'fire', 'hurricane', 'tornado', 'emergency', 'urgent'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
    setNewTag('');
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-2" />
              Report New Disaster
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Disaster Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="e.g., NYC Flooding Emergency"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Location
              </label>
              <input
                type="text"
                value={formData.location_name}
                onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="e.g., Manhattan, NYC or leave blank to extract from description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Describe the disaster situation, including location details if not specified above..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(newTag))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Add custom tag..."
                />
                <button
                  type="button"
                  onClick={() => addTag(newTag)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {commonTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    disabled={formData.tags.includes(tag)}
                    className={`px-3 py-1 rounded-full text-sm border ${
                      formData.tags.includes(tag)
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 font-medium"
              >
                Report Disaster
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}