import React, { useState, useEffect } from 'react';
import { Bus, Train, AlertTriangle, Clock, MapPin } from 'lucide-react';
import type { WMATAMetro, WMATABus } from '../types';
import { wmataAPI } from '../services/api';

const Transportation: React.FC = () => {
  const [metroData, setMetroData] = useState<WMATAMetro | null>(null);
  const [busData, setBusData] = useState<WMATABus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransportationData();
    const interval = setInterval(loadTransportationData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadTransportationData = async () => {
    try {
      setLoading(true);
      const [metro, bus] = await Promise.all([
        wmataAPI.getMetroStatus(),
        wmataAPI.getBusLocations()
      ]);
      setMetroData(metro);
      setBusData(bus.buses);
    } catch (error) {
      console.error('Error loading transportation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetroLineColor = (line: string) => {
    switch (line.toLowerCase()) {
      case 'red': return 'bg-red-500';
      case 'blue': return 'bg-blue-500';
      case 'orange': return 'bg-orange-500';
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'silver': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getBusStatusColor = (status: string) => {
    switch (status) {
      case 'in_service': return 'text-green-500';
      case 'out_of_service': return 'text-red-500';
      case 'delayed': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading transportation data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Transportation</h1>
          <p className="text-gray-400">WMATA Metro and Bus Status</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <Clock className="h-4 w-4" />
            <span>Last Updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Metro Status */}
      <div className="rtcc-panel">
        <div className="flex items-center mb-4">
          <Train className="h-6 w-6 text-blue-500 mr-2" />
          <h2 className="text-lg font-semibold text-white">Metro Status</h2>
        </div>
        
        {metroData && metroData.Incidents && metroData.Incidents.length > 0 ? (
          <div className="space-y-4">
            {metroData.Incidents.map((incident) => (
              <div key={incident.IncidentID} className="rtcc-card border-l-4 border-red-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`inline-block w-3 h-3 rounded-full ${getMetroLineColor(incident.LinesAffected)}`}></span>
                      <span className="text-sm font-medium text-white">{incident.LinesAffected} Line</span>
                      <span className="text-xs text-gray-400">#{incident.IncidentID}</span>
                    </div>
                    <p className="text-sm text-gray-300">{incident.Description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Updated: {new Date(incident.DateUpdated).toLocaleString()}
                    </p>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <p className="text-white font-medium">All Metro lines operating normally</p>
            <p className="text-gray-400 text-sm">No incidents reported</p>
          </div>
        )}
      </div>

      {/* Bus Status */}
      <div className="rtcc-panel">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Bus className="h-6 w-6 text-green-500 mr-2" />
            <h2 className="text-lg font-semibold text-white">Bus Status</h2>
          </div>
          <span className="text-sm text-gray-400">{busData.length} buses tracked</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {busData.map((bus) => (
            <div key={bus.id} className="rtcc-card hover:bg-gray-700 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-medium text-white">{bus.id}</h3>
                  <p className="text-xs text-gray-400">Route {bus.route}</p>
                </div>
                <span className={`text-xs font-semibold ${getBusStatusColor(bus.status)}`}>
                  {bus.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Location:</span>
                  <span className="text-gray-300">
                    {bus.location.lat.toFixed(4)}, {bus.location.lng.toFixed(4)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Last Update:</span>
                  <span className="text-gray-300">
                    {new Date(bus.last_update).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transportation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="rtcc-card">
          <div className="flex items-center">
            <Train className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Metro Lines</p>
              <p className="text-2xl font-bold text-white">6</p>
            </div>
          </div>
        </div>

        <div className="rtcc-card">
          <div className="flex items-center">
            <Bus className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Active Buses</p>
              <p className="text-2xl font-bold text-white">
                {busData.filter(b => b.status === 'in_service').length}
              </p>
            </div>
          </div>
        </div>

        <div className="rtcc-card">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Metro Incidents</p>
              <p className="text-2xl font-bold text-white">
                {metroData?.Incidents?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rtcc-card">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Delayed Buses</p>
              <p className="text-2xl font-bold text-white">
                {busData.filter(b => b.status === 'delayed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Metro Lines Overview */}
      <div className="rtcc-panel">
        <h3 className="text-lg font-semibold text-white mb-4">Metro Lines Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {['Red', 'Blue', 'Orange', 'Green', 'Yellow', 'Silver'].map((line) => {
            const hasIncident = metroData?.Incidents?.some(i => 
              i.LinesAffected.toLowerCase() === line.toLowerCase()
            );
            
            return (
              <div key={line} className="rtcc-card text-center">
                <div className={`w-8 h-2 mx-auto mb-2 rounded ${getMetroLineColor(line)}`}></div>
                <p className="text-sm font-medium text-white">{line}</p>
                <p className={`text-xs ${hasIncident ? 'text-red-500' : 'text-green-500'}`}>
                  {hasIncident ? 'Incident' : 'Normal'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Transportation;