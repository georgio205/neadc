import React, { useState, useEffect } from 'react';
import { Users, MapPin, Activity, Radio } from 'lucide-react';
import type { EmergencyUnit } from '../types';
import { unitsAPI } from '../services/api';

const Units: React.FC = () => {
  const [units, setUnits] = useState<EmergencyUnit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      setLoading(true);
      const data = await unitsAPI.getAll();
      setUnits(data.units);
    } catch (error) {
      console.error('Error loading units:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUnitIcon = (type: string) => {
    switch (type) {
      case 'police': return '🚔';
      case 'fire': return '🚒';
      case 'ems': return '🚑';
      default: return '🚗';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-500';
      case 'responding': return 'text-yellow-500';
      case 'busy': return 'text-red-500';
      case 'out_of_service': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'police': return 'bg-blue-100 text-blue-800';
      case 'fire': return 'bg-red-100 text-red-800';
      case 'ems': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading units...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Emergency Units</h1>
          <p className="text-gray-400">Monitor and manage emergency response units</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="rtcc-card">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Units</p>
              <p className="text-2xl font-bold text-white">{units.length}</p>
            </div>
          </div>
        </div>

        <div className="rtcc-card">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Available</p>
              <p className="text-2xl font-bold text-white">
                {units.filter(u => u.status === 'available').length}
              </p>
            </div>
          </div>
        </div>

        <div className="rtcc-card">
          <div className="flex items-center">
            <Radio className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Responding</p>
              <p className="text-2xl font-bold text-white">
                {units.filter(u => u.status === 'responding').length}
              </p>
            </div>
          </div>
        </div>

        <div className="rtcc-card">
          <div className="flex items-center">
            <MapPin className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Busy</p>
              <p className="text-2xl font-bold text-white">
                {units.filter(u => u.status === 'busy').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {units.map((unit) => (
          <div key={unit.id} className="rtcc-card hover:bg-gray-700 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{getUnitIcon(unit.type)}</span>
                <div>
                  <h3 className="text-lg font-semibold text-white">{unit.id}</h3>
                  <p className="text-sm text-gray-400">{unit.description}</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(unit.type)}`}>
                {unit.type}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Status:</span>
                <span className={`text-sm font-semibold ${getStatusColor(unit.status)}`}>
                  {unit.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Location:</span>
                <span className="text-sm text-gray-300">
                  {unit.location.lat.toFixed(4)}, {unit.location.lng.toFixed(4)}
                </span>
              </div>

              <div className="flex space-x-2 pt-2">
                <button className="flex-1 px-3 py-1 text-xs bg-dc-blue text-white rounded hover:bg-blue-700 transition-colors">
                  Update Status
                </button>
                <button className="flex-1 px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Units Table */}
      <div className="rtcc-panel">
        <h3 className="text-lg font-semibold text-white mb-4">Unit Status Overview</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Last Update
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-700">
              {units.map((unit) => (
                <tr key={unit.id} className="hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-lg mr-3">{getUnitIcon(unit.type)}</span>
                      <div>
                        <div className="text-sm font-medium text-white">{unit.id}</div>
                        <div className="text-sm text-gray-400">{unit.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(unit.type)}`}>
                      {unit.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-semibold ${getStatusColor(unit.status)}`}>
                      {unit.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {unit.location.lat.toFixed(4)}, {unit.location.lng.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date().toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-dc-blue hover:text-blue-400 mr-3">
                      Update
                    </button>
                    <button className="text-green-500 hover:text-green-400 mr-3">
                      Dispatch
                    </button>
                    <button className="text-red-500 hover:text-red-400">
                      Offline
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Units;