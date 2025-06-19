import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Users, AlertTriangle } from 'lucide-react';

interface StatusIndicatorProps {
  isConnected: boolean;
  connectedClients?: number;
}

export function StatusIndicator({ isConnected, connectedClients }: StatusIndicatorProps) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (isConnected) {
      setLastUpdate(new Date());
    }
  }, [isConnected]);

  return (
    <div className="fixed top-4 right-4 z-40">
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg shadow-md ${
        isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isConnected ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
        {connectedClients !== undefined && (
          <div className="flex items-center space-x-1 ml-2">
            <Users className="w-3 h-3" />
            <span className="text-xs">{connectedClients}</span>
          </div>
        )}
      </div>
      
      {isConnected && (
        <div className="text-xs text-gray-500 mt-1 text-right">
          Last update: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}