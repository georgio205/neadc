import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { XMarkIcon, MapPinIcon } from '@heroicons/react/24/outline';

// Geocoding function using OpenStreetMap Nominatim API
const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    );
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

const incidentSchema = z.object({
  type: z.enum(['medical', 'fire', 'police', 'traffic', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  notes: z.string().optional(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().min(1, 'Address is required')
  })
});

type IncidentFormData = z.infer<typeof incidentSchema>;

interface IncidentFormProps {
  onSubmit: (data: IncidentFormData) => void;
  onCancel: () => void;
  initialData?: Partial<IncidentFormData>;
  isEditing?: boolean;
}

const IncidentForm: React.FC<IncidentFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<IncidentFormData>({
    resolver: zodResolver(incidentSchema),
    defaultValues: initialData || {
      type: 'medical',
      priority: 'medium',
      description: '',
      notes: '',
      location: { lat: 38.9072, lng: -77.0369, address: '' }
    }
  });

  const watchedType = watch('type');
  const watchedPriority = watch('priority');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'medical': return '🏥';
      case 'fire': return '🔥';
      case 'police': return '🚨';
      case 'traffic': return '🚦';
      default: return '⚠️';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleAddressGeocode = async (address: string) => {
    if (!address.trim()) return null;
    
    setIsGeocoding(true);
    try {
      const coords = await geocodeAddress(address);
      if (coords) {
        setValue('location.lat', coords.lat);
        setValue('location.lng', coords.lng);
        return coords;
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
    } finally {
      setIsGeocoding(false);
    }
    return null;
  };

  const onSubmitForm = async (data: IncidentFormData) => {
    setIsSubmitting(true);
    try {
      // If we have an address but no coordinates, try to geocode
      if (data.location.address && (!data.location.lat || !data.location.lng)) {
        const coords = await handleAddressGeocode(data.location.address);
        if (coords) {
          data.location.lat = coords.lat;
          data.location.lng = coords.lng;
        }
      }
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Incident' : 'Create New Incident'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmitForm)} className="p-6 space-y-6">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Incident Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['medical', 'fire', 'police', 'traffic', 'other'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setValue('type', type as any)}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    watchedType === type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{getTypeIcon(type)}</div>
                  <div className="text-sm font-medium capitalize">{type}</div>
                </button>
              ))}
            </div>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Priority Level
            </label>
            <div className="grid grid-cols-4 gap-3">
              {['low', 'medium', 'high', 'critical'].map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setValue('priority', priority as any)}
                  className={`p-3 border-2 rounded-lg text-center transition-all ${
                    watchedPriority === priority
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(priority)}`}>
                    {priority.toUpperCase()}
                  </div>
                </button>
              ))}
            </div>
            {errors.priority && (
              <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe the incident..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              {...register('notes')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any additional information..."
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location Address *
            </label>
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  {...register('location.address')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter full address (e.g., 1600 Pennsylvania Ave NW, Washington, DC)"
                />
                {errors.location?.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.location.address.message}</p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  <span>Address will be automatically converted to coordinates</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddressGeocode(watch('location.address'))}
                  disabled={isGeocoding || !watch('location.address')}
                  className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeocoding ? 'Converting...' : 'Convert to Coordinates'}
                </button>
              </div>
              {/* Hidden coordinate fields for form validation */}
              <input type="hidden" {...register('location.lat', { valueAsNumber: true })} />
              <input type="hidden" {...register('location.lng', { valueAsNumber: true })} />
            </div>
            {errors.location?.lat || errors.location?.lng ? (
              <p className="mt-1 text-sm text-red-600">Invalid location coordinates</p>
            ) : null}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : isEditing ? 'Update Incident' : 'Create Incident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IncidentForm;