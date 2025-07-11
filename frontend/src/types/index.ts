export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface EmergencyUnit {
  id: string;
  type: 'police' | 'fire' | 'ems';
  status: 'available' | 'responding' | 'busy' | 'out_of_service';
  location: Location;
  description: string;
}

export interface Incident {
  id: string;
  type: 'medical' | 'fire' | 'police' | 'traffic';
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'resolved' | 'pending';
  location: Location;
  description: string;
  assigned_units: string[];
  created_at: string;
}

export interface TrafficIncident {
  id: string;
  type: string;
  location: Location;
  description: string;
  severity: 'low' | 'medium' | 'high';
  created_at: string;
}

export interface WMATAIncident {
  IncidentID: string;
  Description: string;
  LinesAffected: string;
  DateUpdated: string;
}

export interface WMATAMetro {
  Incidents: WMATAIncident[];
}

export interface WMATABus {
  id: string;
  route: string;
  location: Location;
  status: 'in_service' | 'out_of_service' | 'delayed';
  last_update: string;
}

export interface WebSocketMessage {
  type: 'init' | 'incident_created' | 'unit_updated' | 'traffic_incident_created';
  incidents?: Incident[];
  units?: EmergencyUnit[];
  traffic?: TrafficIncident[];
  incident?: Incident;
  unit?: EmergencyUnit;
}

export interface IncidentStats {
  total: number;
  active: number;
  resolved: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface UnitStats {
  total: number;
  available: number;
  responding: number;
  busy: number;
  byType: Record<string, number>;
}