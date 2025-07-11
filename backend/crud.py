from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json

from database import Incident, EmergencyUnit, UnitAssignment, TrafficIncident, SystemLog
from models import (
    IncidentCreate, IncidentUpdate, EmergencyUnitCreate, EmergencyUnitUpdate,
    UnitAssignmentCreate, UnitAssignmentUpdate, TrafficIncidentCreate, TrafficIncidentUpdate,
    SystemLogCreate
)

# Incident CRUD operations
def create_incident(db: Session, incident: IncidentCreate) -> Incident:
    # Generate incident ID
    last_incident = db.query(Incident).order_by(Incident.id.desc()).first()
    if last_incident:
        last_num = int(last_incident.incident_id.split('-')[1])
        incident_id = f"INC-{last_num + 1:03d}"
    else:
        incident_id = "INC-001"
    
    db_incident = Incident(
        incident_id=incident_id,
        type=incident.type.value,
        priority=incident.priority.value,
        status=incident.status.value,
        location=incident.location.model_dump(),
        description=incident.description,
        notes=incident.notes,
        assigned_units=[]
    )
    db.add(db_incident)
    db.commit()
    db.refresh(db_incident)
    return db_incident

def get_incident(db: Session, incident_id: str) -> Optional[Incident]:
    return db.query(Incident).filter(Incident.incident_id == incident_id).first()

def get_incidents(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    status: Optional[str] = None,
    type: Optional[str] = None
) -> List[Incident]:
    query = db.query(Incident)
    
    if status:
        query = query.filter(Incident.status == status)
    if type:
        query = query.filter(Incident.type == type)
    
    return query.offset(skip).limit(limit).all()

def update_incident(db: Session, incident_id: str, incident_update: IncidentUpdate) -> Optional[Incident]:
    db_incident = get_incident(db, incident_id)
    if not db_incident:
        return None
    
    update_data = incident_update.dict(exclude_unset=True)
    
    # Handle enum values
    if 'type' in update_data:
        update_data['type'] = update_data['type'].value
    if 'priority' in update_data:
        update_data['priority'] = update_data['priority'].value
    if 'status' in update_data:
        update_data['status'] = update_data['status'].value
        if update_data['status'] == 'resolved':
            update_data['resolved_at'] = datetime.utcnow()
    if 'location' in update_data:
        update_data['location'] = update_data['location'].dict()
    
    update_data['updated_at'] = datetime.utcnow()
    
    for field, value in update_data.items():
        setattr(db_incident, field, value)
    
    db.commit()
    db.refresh(db_incident)
    return db_incident

def delete_incident(db: Session, incident_id: str) -> bool:
    db_incident = get_incident(db, incident_id)
    if not db_incident:
        return False
    
    db.delete(db_incident)
    db.commit()
    return True

# Emergency Unit CRUD operations
def create_emergency_unit(db: Session, unit: EmergencyUnitCreate) -> EmergencyUnit:
    db_unit = EmergencyUnit(
        unit_id=unit.unit_id,
        type=unit.type.value,
        status=unit.status.value,
        location=unit.location.dict(),
        description=unit.description
    )
    db.add(db_unit)
    db.commit()
    db.refresh(db_unit)
    return db_unit

def get_emergency_unit(db: Session, unit_id: str) -> Optional[EmergencyUnit]:
    return db.query(EmergencyUnit).filter(EmergencyUnit.unit_id == unit_id).first()

def get_emergency_units(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    status: Optional[str] = None,
    type: Optional[str] = None,
    active_only: bool = True
) -> List[EmergencyUnit]:
    query = db.query(EmergencyUnit)
    
    if status:
        query = query.filter(EmergencyUnit.status == status)
    if type:
        query = query.filter(EmergencyUnit.type == type)
    if active_only:
        query = query.filter(EmergencyUnit.is_active == True)
    
    return query.offset(skip).limit(limit).all()

def update_emergency_unit(db: Session, unit_id: str, unit_update: EmergencyUnitUpdate) -> Optional[EmergencyUnit]:
    db_unit = get_emergency_unit(db, unit_id)
    if not db_unit:
        return None
    
    update_data = unit_update.dict(exclude_unset=True)
    
    # Handle enum values
    if 'type' in update_data:
        update_data['type'] = update_data['type'].value
    if 'status' in update_data:
        update_data['status'] = update_data['status'].value
    if 'location' in update_data:
        update_data['location'] = update_data['location'].dict()
    
    update_data['last_updated'] = datetime.utcnow()
    
    for field, value in update_data.items():
        setattr(db_unit, field, value)
    
    db.commit()
    db.refresh(db_unit)
    return db_unit

def delete_emergency_unit(db: Session, unit_id: str) -> bool:
    db_unit = get_emergency_unit(db, unit_id)
    if not db_unit:
        return False
    
    db.delete(db_unit)
    db.commit()
    return True

# Unit Assignment CRUD operations
def create_unit_assignment(db: Session, assignment: UnitAssignmentCreate) -> UnitAssignment:
    db_assignment = UnitAssignment(
        unit_id=assignment.unit_id,
        incident_id=assignment.incident_id,
        status=assignment.status.value
    )
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

def get_unit_assignments(
    db: Session, 
    unit_id: Optional[str] = None,
    incident_id: Optional[str] = None
) -> List[UnitAssignment]:
    query = db.query(UnitAssignment)
    
    if unit_id:
        query = query.filter(UnitAssignment.unit_id == unit_id)
    if incident_id:
        query = query.filter(UnitAssignment.incident_id == incident_id)
    
    return query.all()

def update_unit_assignment(db: Session, assignment_id: int, assignment_update: UnitAssignmentUpdate) -> Optional[UnitAssignment]:
    db_assignment = db.query(UnitAssignment).filter(UnitAssignment.id == assignment_id).first()
    if not db_assignment:
        return None
    
    update_data = assignment_update.dict(exclude_unset=True)
    
    if 'status' in update_data:
        update_data['status'] = update_data['status'].value
    
    for field, value in update_data.items():
        setattr(db_assignment, field, value)
    
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

# Traffic Incident CRUD operations
def create_traffic_incident(db: Session, traffic_incident: TrafficIncidentCreate) -> TrafficIncident:
    # Generate incident ID
    last_incident = db.query(TrafficIncident).order_by(TrafficIncident.id.desc()).first()
    if last_incident:
        last_num = int(last_incident.incident_id.split('-')[1])
        incident_id = f"TRAFFIC-{last_num + 1:03d}"
    else:
        incident_id = "TRAFFIC-001"
    
    db_traffic_incident = TrafficIncident(
        incident_id=incident_id,
        type=traffic_incident.type.value,
        severity=traffic_incident.severity.value,
        location=traffic_incident.location.dict(),
        description=traffic_incident.description,
        affected_roads=traffic_incident.affected_roads,
        estimated_duration=traffic_incident.estimated_duration
    )
    db.add(db_traffic_incident)
    db.commit()
    db.refresh(db_traffic_incident)
    return db_traffic_incident

def get_traffic_incident(db: Session, incident_id: str) -> Optional[TrafficIncident]:
    return db.query(TrafficIncident).filter(TrafficIncident.incident_id == incident_id).first()

def get_traffic_incidents(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    active_only: bool = True
) -> List[TrafficIncident]:
    query = db.query(TrafficIncident)
    
    if active_only:
        query = query.filter(TrafficIncident.is_active == True)
    
    return query.offset(skip).limit(limit).all()

def update_traffic_incident(db: Session, incident_id: str, traffic_update: TrafficIncidentUpdate) -> Optional[TrafficIncident]:
    db_traffic_incident = get_traffic_incident(db, incident_id)
    if not db_traffic_incident:
        return None
    
    update_data = traffic_update.dict(exclude_unset=True)
    
    # Handle enum values
    if 'type' in update_data:
        update_data['type'] = update_data['type'].value
    if 'severity' in update_data:
        update_data['severity'] = update_data['severity'].value
    if 'location' in update_data:
        update_data['location'] = update_data['location'].dict()
    
    for field, value in update_data.items():
        setattr(db_traffic_incident, field, value)
    
    db.commit()
    db.refresh(db_traffic_incident)
    return db_traffic_incident

def resolve_traffic_incident(db: Session, incident_id: str) -> Optional[TrafficIncident]:
    db_traffic_incident = get_traffic_incident(db, incident_id)
    if not db_traffic_incident:
        return None
    
    db_traffic_incident.is_active = False
    db_traffic_incident.resolved_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_traffic_incident)
    return db_traffic_incident

# System Log CRUD operations
def create_system_log(db: Session, log: SystemLogCreate) -> SystemLog:
    db_log = SystemLog(
        level=log.level,
        category=log.category,
        message=log.message,
        data=log.data
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

def get_system_logs(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    level: Optional[str] = None,
    category: Optional[str] = None
) -> List[SystemLog]:
    query = db.query(SystemLog)
    
    if level:
        query = query.filter(SystemLog.level == level)
    if category:
        query = query.filter(SystemLog.category == category)
    
    return query.order_by(SystemLog.timestamp.desc()).offset(skip).limit(limit).all()

# Dashboard statistics
def get_dashboard_stats(db: Session) -> Dict[str, Any]:
    today = datetime.utcnow().date()
    
    # Active incidents
    active_incidents = db.query(Incident).filter(Incident.status == 'active').count()
    
    # Available units
    available_units = db.query(EmergencyUnit).filter(
        and_(EmergencyUnit.status == 'available', EmergencyUnit.is_active == True)
    ).count()
    
    # Responding units
    responding_units = db.query(EmergencyUnit).filter(
        and_(EmergencyUnit.status == 'responding', EmergencyUnit.is_active == True)
    ).count()
    
    # Active traffic issues
    traffic_issues = db.query(TrafficIncident).filter(TrafficIncident.is_active == True).count()
    
    # Total incidents today
    total_incidents_today = db.query(Incident).filter(
        func.date(Incident.created_at) == today
    ).count()
    
    # Average response time (simplified calculation)
    resolved_incidents = db.query(Incident).filter(
        and_(Incident.status == 'resolved', Incident.resolved_at.isnot(None))
    ).all()
    
    total_response_time = 0
    count = 0
    for incident in resolved_incidents:
        if incident.resolved_at:
            response_time = (incident.resolved_at - incident.created_at).total_seconds() / 60  # minutes
            total_response_time += response_time
            count += 1
    
    average_response_time = total_response_time / count if count > 0 else 0
    
    return {
        "active_incidents": active_incidents,
        "available_units": available_units,
        "responding_units": responding_units,
        "traffic_issues": traffic_issues,
        "total_incidents_today": total_incidents_today,
        "average_response_time": round(average_response_time, 2)
    }