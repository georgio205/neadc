import axios from 'axios';
import type { Incident, EmergencyUnit, TrafficIncident, WMATAMetro, WMATABus } from '../types';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Incidents API
export const incidentsAPI = {
  getAll: async (): Promise<Incident[]> => {
    const response = await api.get('/api/incidents');
    return response.data;
  },

  create: async (incident: Partial<Incident>): Promise<Incident> => {
    const response = await api.post('/api/incidents', incident);
    return response.data;
  },

  update: async (id: string, updates: Partial<Incident>): Promise<Incident> => {
    const response = await api.put(`/api/incidents/${id}`, updates);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/incidents/${id}`);
  },
};

// Units API
export const unitsAPI = {
  getAll: async (): Promise<{ units: EmergencyUnit[] }> => {
    const response = await api.get('/api/units');
    return response.data;
  },

  updateStatus: async (unitId: string, status: { status: string; location?: { lat: number; lng: number } }): Promise<EmergencyUnit> => {
    const response = await api.put(`/api/units/${unitId}/status`, status);
    return response.data;
  },
};

// WMATA API
export const wmataAPI = {
  getMetroStatus: async (): Promise<WMATAMetro> => {
    const response = await api.get('/api/wmata/metro');
    return response.data;
  },

  getBusLocations: async (): Promise<{ buses: WMATABus[] }> => {
    const response = await api.get('/api/wmata/bus');
    return response.data;
  },
};

// Traffic API
export const trafficAPI = {
  getAll: async (): Promise<{ incidents: TrafficIncident[] }> => {
    const response = await api.get('/api/traffic');
    return response.data;
  },

  create: async (incident: Partial<TrafficIncident>): Promise<TrafficIncident> => {
    const response = await api.post('/api/traffic', incident);
    return response.data;
  },
};

// WebSocket connection
export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(onMessage: (data: any) => void, onError?: (error: Event) => void) {
    try {
      this.ws = new WebSocket('ws://localhost:8000/ws/rtcc');
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (onError) onError(error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect(onMessage, onError);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }

  private attemptReconnect(onMessage: (data: any) => void, onError?: (error: Event) => void) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect(onMessage, onError);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}

export default api;