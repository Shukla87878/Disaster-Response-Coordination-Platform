import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, RefreshCw, Settings, Search } from 'lucide-react';
import { DisasterForm } from './components/DisasterForm';
import { DisasterCard } from './components/DisasterCard';
import { DisasterDetails } from './components/DisasterDetails';
import { StatusIndicator } from './components/StatusIndicator';
import { io, Socket } from 'socket.io-client';

interface Disaster {
  id: string;
  title: string;
  description: string;
  location_name?: string;
  tags: string[];
  owner_id: string;
  created_at: string;
  reports?: any[];
}

function App() {
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDisaster, setSelectedDisaster] = useState<Disaster | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedClients, setConnectedClients] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('');

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('subscribe_updates');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('disaster_updated', (data) => {
      if (data.action === 'create') {
        setDisasters(prev => [data.disaster, ...prev]);
      } else if (data.action === 'update') {
        setDisasters(prev => prev.map(d => d.id === data.disaster.id ? data.disaster : d));
      } else if (data.action === 'delete') {
        setDisasters(prev => prev.filter(d => d.id !== data.disaster_id));
      }
    });

    newSocket.on('system_status', (data) => {
      setConnectedClients(data.connected_clients);
    });

    newSocket.on('priority_alert_received', (data) => {
      // Show priority alert notification
      showPriorityAlert(data);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    loadDisasters();
  }, []);

  const loadDisasters = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/disasters');
      if (response.ok) {
        const data = await response.json();
        setDisasters(data.disasters || []);
      }
    } catch (error) {
      console.error('Error loading disasters:', error);
    } finally {
      setLoading(false);
    }
  };

  const showPriorityAlert = (alertData: any) => {
    // Simple browser notification for priority alerts
    if (Notification.permission === 'granted') {
      new Notification('Emergency Alert', {
        body: alertData.message,
        icon: '/favicon.ico'
      });
    }
  };

  const handleCreateDisaster = async (formData: any) => {
    try {
      const response = await fetch('/api/disasters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': 'netrunnerX' // Mock user
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowForm(false);
        // Disaster will be added via WebSocket update
      }
    } catch (error) {
      console.error('Error creating disaster:', error);
    }
  };

  const filteredDisasters = disasters.filter(disaster => {
    const matchesSearch = !searchTerm || 
      disaster.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      disaster.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      disaster.location_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = !filterTag || disaster.tags.includes(filterTag);
    
    return matchesSearch && matchesTag;
  });

  const allTags = Array.from(new Set(disasters.flatMap(d => d.tags)));

  // Request notification permission on load
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <StatusIndicator 
        isConnected={isConnected} 
        connectedClients={connectedClients}
      />

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Disaster Response Platform
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={loadDisasters}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button
                onClick={() => setShowForm(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Report Disaster
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search disasters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
          
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="">All Categories</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : filteredDisasters.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchTerm || filterTag ? 'No disasters match your filters' : 'No disasters reported'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterTag 
                ? 'Try adjusting your search criteria' 
                : 'Click "Report Disaster" to create the first disaster report'}
            </p>
            {!searchTerm && !filterTag && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
              >
                Report First Disaster
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredDisasters.map((disaster) => (
              <DisasterCard
                key={disaster.id}
                disaster={disaster}
                onClick={setSelectedDisaster}
              />
            ))}
          </div>
        )}
      </main>

      {/* Stats Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-red-600">{disasters.length}</div>
              <div className="text-sm text-gray-600">Active Disasters</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">
                {disasters.filter(d => d.tags.includes('urgent')).length}
              </div>
              <div className="text-sm text-gray-600">Urgent Reports</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{connectedClients}</div>
              <div className="text-sm text-gray-600">Connected Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {disasters.reduce((sum, d) => sum + (d.reports?.[0]?.count || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Total Reports</div>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showForm && (
        <DisasterForm
          onSubmit={handleCreateDisaster}
          onClose={() => setShowForm(false)}
        />
      )}

      {selectedDisaster && (
        <DisasterDetails
          disaster={selectedDisaster}
          onClose={() => setSelectedDisaster(null)}
        />
      )}
    </div>
  );
}

export default App;