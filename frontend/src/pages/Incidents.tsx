import React, { useState, useEffect } from 'react';
import { PlusIcon, ExclamationTriangleIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/outline';
import DataTable from '../components/DataTable';
import IncidentForm from '../components/IncidentForm';
import { incidentsAPI } from '../services/api';

interface Incident {
  id: number;
  incident_id: string;
  type: string;
  priority: string;
  status: string;
  location: { lat: number; lng: number; address?: string };
  description: string;
  notes?: string;
  assigned_units: string[];
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

const Incidents: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    try {
      console.log('Loading incidents...');
      setLoading(true);
      setError(null);
      const data = await incidentsAPI.getAll();
      console.log('Loaded incidents:', data);
      setIncidents(data);
    } catch (error) {
      console.error('Error loading incidents:', error);
      setError('Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncident = async (formData: any) => {
    try {
      setError(null);
      setSuccessMessage(null);
      const newIncident = await incidentsAPI.create(formData);
      setShowForm(false);
      setSuccessMessage(`Incident ${newIncident.incident_id || newIncident.id} created successfully!`);
      await loadIncidents();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (error) {
      console.error('Error creating incident:', error);
      setError('Failed to create incident. Please try again.');
    }
  };

  const handleEditIncident = async (formData: any) => {
    if (!editingIncident) return;
    
    try {
      setError(null);
      setSuccessMessage(null);
      await incidentsAPI.update(editingIncident.incident_id, formData);
      setEditingIncident(null);
      setSuccessMessage(`Incident ${editingIncident.incident_id} updated successfully!`);
      await loadIncidents();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (error) {
      console.error('Error updating incident:', error);
      setError('Failed to update incident. Please try again.');
    }
  };

  const handleDeleteIncident = async (incident: Incident) => {
    if (!confirm(`Are you sure you want to delete incident ${incident.incident_id}?`)) {
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      await incidentsAPI.delete(incident.incident_id);
      setSuccessMessage(`Incident ${incident.incident_id} deleted successfully!`);
      await loadIncidents();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (error) {
      console.error('Error deleting incident:', error);
      setError('Failed to delete incident. Please try again.');
    }
  };

  const handleResolveIncident = async (incident: Incident) => {
    try {
      setError(null);
      setSuccessMessage(null);
      await incidentsAPI.update(incident.incident_id, { status: 'resolved' });
      setSuccessMessage(`Incident ${incident.incident_id} resolved successfully!`);
      await loadIncidents();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (error) {
      console.error('Error resolving incident:', error);
      setError('Failed to resolve incident. Please try again.');
    }
  };

  const columns = [
    { key: 'incident_id', label: 'ID', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'priority', label: 'Priority', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { 
      key: 'description', 
      label: 'Description', 
      sortable: true,
      render: (value: string, row: Incident) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          {row.notes && (
            <div className="text-sm text-gray-500 mt-1">{row.notes}</div>
          )}
        </div>
      )
    },
    { 
      key: 'location', 
      label: 'Location', 
      sortable: false,
      render: (value: { lat: number; lng: number; address?: string }) => (
        <div className="text-sm text-gray-600">
          {value.address || `${value.lat.toFixed(4)}, ${value.lng.toFixed(4)}`}
        </div>
      )
    },
    { 
      key: 'created_at', 
      label: 'Created', 
      sortable: true,
      render: (value: string) => (
        <div className="text-sm text-gray-600">
          {new Date(value).toLocaleString()}
        </div>
      )
    }
  ];

  const stats = {
    total: incidents.length,
    active: incidents.filter(i => i.status === 'active').length,
    resolved: incidents.filter(i => i.status === 'resolved').length,
    highPriority: incidents.filter(i => i.priority === 'high' || i.priority === 'critical').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading incidents...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incidents</h1>
          <p className="text-gray-600">Manage and track emergency incidents</p>
        </div>
        <button 
          onClick={() => {
            setError(null);
            setSuccessMessage(null);
            setShowForm(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Incident
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <div className="mt-2 text-sm text-green-700">{successMessage}</div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Incidents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <MapPinIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-gray-900">{stats.highPriority}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Incidents Table */}
      <DataTable
        data={incidents}
        columns={columns}
        onEdit={(incident) => setEditingIncident(incident)}
        onDelete={handleDeleteIncident}
        searchable
        sortable
      />

      {/* Create/Edit Form Modal */}
      {showForm && (
        <IncidentForm
          onSubmit={handleCreateIncident}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingIncident && (
        <IncidentForm
          onSubmit={handleEditIncident}
          onCancel={() => setEditingIncident(null)}
          initialData={{
            type: editingIncident.type as any,
            priority: editingIncident.priority as any,
            description: editingIncident.description,
            notes: editingIncident.notes,
            location: editingIncident.location
          }}
          isEditing
        />
      )}
    </div>
  );
};

export default Incidents;