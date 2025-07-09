import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { AlertTriangle, Users, Bus, Activity } from 'lucide-react';
import type { Incident, EmergencyUnit, TrafficIncident } from '../types';
import { incidentsAPI, unitsAPI, trafficAPI, WebSocketService } from '../services/api';

const Dashboard: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [units, setUnits] = useState<EmergencyUnit[]>([]);
  const [trafficIncidents, setTrafficIncidents] = useState<TrafficIncident[]>([]);
  const [stats, setStats] = useState({
    activeIncidents: 0,
    availableUnits: 0,
    respondingUnits: 0,
    trafficIssues: 0
  });

  useEffect(() => {
    // Load initial data
    const loadData = async () => {
      try {
        const [incidentsData, unitsData, trafficData] = await Promise.all([
          incidentsAPI.getAll(),
          unitsAPI.getAll(),
          trafficAPI.getAll()
        ]);
        
        setIncidents(incidentsData.incidents);
        setUnits(unitsData.units);
        setTrafficIncidents(trafficData.incidents);
        
        updateStats(incidentsData.incidents, unitsData.units, trafficData.incidents);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadData();

    // WebSocket connection for real-time updates
    const wsService = new WebSocketService();
    wsService.connect((data) => {
      if (data.type === 'init') {
        setIncidents(data.incidents || []);
        setUnits(data.units || []);
        setTrafficIncidents(data.traffic || []);
        updateStats(data.incidents || [], data.units || [], data.traffic || []);
      } else if (data.type === 'incident_created') {
        setIncidents(prev => [...prev, data.incident]);
        updateStats([...incidents, data.incident], units, trafficIncidents);
      } else if (data.type === 'unit_updated') {
        setUnits(prev => prev.map(unit => 
          unit.id === data.unit.id ? data.unit : unit
        ));
        updateStats(incidents, units.map(unit => 
          unit.id === data.unit.id ? data.unit : unit
        ), trafficIncidents);
      }
    });

    return () => {
      wsService.disconnect();
    };
  }, []);

  const updateStats = (incidents: Incident[], units: EmergencyUnit[], traffic: TrafficIncident[]) => {
    setStats({
      activeIncidents: incidents.filter(i => i.status === 'active').length,
      availableUnits: units.filter(u => u.status === 'available').length,
      respondingUnits: units.filter(u => u.status === 'responding').length,
      trafficIssues: traffic.length
    });
  };

  const getUnitIcon = (type: string) => {
    switch (type) {
      case 'police': return '🚔';
      case 'fire': return '🚒';
      case 'ems': return '🚑';
      default: return '🚗';
    }
  };

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'medical': return '🏥';
      case 'fire': return '🔥';
      case 'police': return '🚨';
      case 'traffic': return '🚦';
      default: return '⚠️';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rtcc-card">
          <div className="flex items-center">
            <div className="p-2 bg-red-500 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Active Incidents</p>
              <p className="text-2xl font-bold text-white">{stats.activeIncidents}</p>
            </div>
          </div>
        </div>

        <div className="rtcc-card">
          <div className="flex items-center">
            <div className="p-2 bg-green-500 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Available Units</p>
              <p className="text-2xl font-bold text-white">{stats.availableUnits}</p>
            </div>
          </div>
        </div>

        <div className="rtcc-card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-500 rounded-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Responding Units</p>
              <p className="text-2xl font-bold text-white">{stats.respondingUnits}</p>
            </div>
          </div>
        </div>

        <div className="rtcc-card">
          <div className="flex items-center">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Bus className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Traffic Issues</p>
              <p className="text-2xl font-bold text-white">{stats.trafficIssues}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map and Live Data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 rtcc-panel">
          <h3 className="text-lg font-semibold text-white mb-4">DC Metro Area</h3>
          <div className="h-96 rounded-lg overflow-hidden">
            <MapContainer
              center={[38.9072, -77.0369]}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* Incident Markers */}
              {incidents.map((incident) => (
                <Marker
                  key={incident.id}
                  position={[incident.location.lat, incident.location.lng]}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">{incident.id}</p>
                      <p className="text-gray-600">{incident.description}</p>
                      <p className={`priority-${incident.priority}`}>
                        Priority: {incident.priority.toUpperCase()}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Unit Markers */}
              {units.map((unit) => (
                <Marker
                  key={unit.id}
                  position={[unit.location.lat, unit.location.lng]}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">{unit.id}</p>
                      <p className="text-gray-600">{unit.description}</p>
                      <p className={`status-${unit.status}`}>
                        Status: {unit.status}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Live Data Feed */}
        <div className="rtcc-panel">
          <h3 className="text-lg font-semibold text-white mb-4">Live Activity</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {incidents.slice(0, 5).map((incident) => (
              <div
                key={incident.id}
                className={`rtcc-card incident-${incident.type}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{incident.id}</p>
                    <p className="text-xs text-gray-400">{incident.description}</p>
                    <p className={`text-xs priority-${incident.priority}`}>
                      {incident.priority.toUpperCase()} Priority
                    </p>
                  </div>
                  <span className="text-lg">{getIncidentIcon(incident.type)}</span>
                </div>
              </div>
            ))}
            
            {units.slice(0, 3).map((unit) => (
              <div key={unit.id} className="rtcc-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{unit.id}</p>
                    <p className="text-xs text-gray-400">{unit.description}</p>
                    <p className={`text-xs status-${unit.status}`}>
                      {unit.status}
                    </p>
                  </div>
                  <span className="text-lg">{getUnitIcon(unit.type)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Incidents Table */}
      <div className="rtcc-panel">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Incidents</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-700">
              {incidents.slice(0, 10).map((incident) => (
                <tr key={incident.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {incident.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                      {incident.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`priority-${incident.priority}`}>
                      {incident.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {incident.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {incident.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(incident.created_at).toLocaleTimeString()}
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

export default Dashboard;