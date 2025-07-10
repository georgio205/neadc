from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class IncidentType(str, Enum):
    MEDICAL = "medical"
    FIRE = "fire"
    POLICE = "police"
    TRAFFIC = "traffic"
    OTHER = "other"

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class IncidentStatus(str, Enum):
    ACTIVE = "active"
    PENDING = "pending"
    RESOLVED = "resolved"

class UnitType(str, Enum):
    POLICE = "police"
    FIRE = "fire"
    EMS = "ems"
    TRAFFIC = "traffic"

class UnitStatus(str, Enum):
    AVAILABLE = "available"
    RESPONDING = "responding"
    BUSY = "busy"
    MAINTENANCE = "maintenance"

class AssignmentStatus(str, Enum):
    ASSIGNED = "assigned"
    EN_ROUTE = "en_route"
    ON_SCENE = "on_scene"
    CLEARED = "cleared"

class TrafficIncidentType(str, Enum):
    ACCIDENT = "accident"
    CONGESTION = "congestion"
    CONSTRUCTION = "construction"
    WEATHER = "weather"

class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

# Base Models
class Location(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)

# Incident Models
class IncidentBase(BaseModel):
    type: IncidentType
    priority: Priority
    status: IncidentStatus = IncidentStatus.ACTIVE
    location: Location
    description: str = Field(..., min_length=1, max_length=500)
    notes: Optional[str] = None

class IncidentCreate(IncidentBase):
    pass

class IncidentUpdate(BaseModel):
    type: Optional[IncidentType] = None
    priority: Optional[Priority] = None
    status: Optional[IncidentStatus] = None
    location: Optional[Location] = None
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    notes: Optional[str] = None
    assigned_units: Optional[List[str]] = None

class IncidentResponse(IncidentBase):
    id: int
    incident_id: str
    assigned_units: List[str] = []
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Emergency Unit Models
class EmergencyUnitBase(BaseModel):
    unit_id: str = Field(..., min_length=1, max_length=20)
    type: UnitType
    status: UnitStatus = UnitStatus.AVAILABLE
    location: Location
    description: str = Field(..., min_length=1, max_length=200)

class EmergencyUnitCreate(EmergencyUnitBase):
    pass

class EmergencyUnitUpdate(BaseModel):
    type: Optional[UnitType] = None
    status: Optional[UnitStatus] = None
    location: Optional[Location] = None
    description: Optional[str] = Field(None, min_length=1, max_length=200)
    current_incident_id: Optional[str] = None
    is_active: Optional[bool] = None

class EmergencyUnitResponse(EmergencyUnitBase):
    id: int
    current_incident_id: Optional[str] = None
    last_updated: datetime
    is_active: bool

    class Config:
        from_attributes = True

# Unit Assignment Models
class UnitAssignmentBase(BaseModel):
    unit_id: str
    incident_id: str
    status: AssignmentStatus = AssignmentStatus.ASSIGNED

class UnitAssignmentCreate(UnitAssignmentBase):
    pass

class UnitAssignmentUpdate(BaseModel):
    status: AssignmentStatus

class UnitAssignmentResponse(UnitAssignmentBase):
    id: int
    assigned_at: datetime

    class Config:
        from_attributes = True

# Traffic Incident Models
class TrafficIncidentBase(BaseModel):
    type: TrafficIncidentType
    severity: Severity
    location: Location
    description: str = Field(..., min_length=1, max_length=500)
    affected_roads: List[str] = []
    estimated_duration: int = Field(..., ge=1, le=1440)  # 1 minute to 24 hours

class TrafficIncidentCreate(TrafficIncidentBase):
    pass

class TrafficIncidentUpdate(BaseModel):
    type: Optional[TrafficIncidentType] = None
    severity: Optional[Severity] = None
    location: Optional[Location] = None
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    affected_roads: Optional[List[str]] = None
    estimated_duration: Optional[int] = Field(None, ge=1, le=1440)
    is_active: Optional[bool] = None

class TrafficIncidentResponse(TrafficIncidentBase):
    id: int
    incident_id: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    is_active: bool

    class Config:
        from_attributes = True

# System Log Models
class SystemLogBase(BaseModel):
    level: str
    category: str
    message: str
    data: Optional[Dict[str, Any]] = None

class SystemLogCreate(SystemLogBase):
    pass

class SystemLogResponse(SystemLogBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True

# Dashboard Models
class DashboardStats(BaseModel):
    active_incidents: int
    available_units: int
    responding_units: int
    traffic_issues: int
    total_incidents_today: int
    average_response_time: float

# WebSocket Models
class WebSocketMessage(BaseModel):
    type: str
    data: Dict[str, Any]

class WebSocketIncidentUpdate(BaseModel):
    type: str = "incident_update"
    incident: IncidentResponse

class WebSocketUnitUpdate(BaseModel):
    type: str = "unit_update"
    unit: EmergencyUnitResponse

class WebSocketTrafficUpdate(BaseModel):
    type: str = "traffic_update"
    traffic_incident: TrafficIncidentResponse