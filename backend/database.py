from sqlalchemy import create_engine, Column, Integer, String, DateTime, JSON, Text, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

# Database URL - use SQLite for development, can be changed to PostgreSQL for production
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./rtcc.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Database Models
class Incident(Base):
    __tablename__ = "incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String, unique=True, index=True)  # e.g., "INC-001"
    type = Column(String)  # medical, fire, police, traffic
    priority = Column(String)  # low, medium, high, critical
    status = Column(String)  # active, resolved, pending
    location = Column(JSON)  # {"lat": 38.9072, "lng": -77.0369}
    description = Column(Text)
    assigned_units = Column(JSON)  # ["PD-001", "EMS-001"]
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Relationships
    unit_assignments = relationship("UnitAssignment", back_populates="incident")

class EmergencyUnit(Base):
    __tablename__ = "emergency_units"
    
    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(String, unique=True, index=True)  # e.g., "PD-001"
    type = Column(String)  # police, fire, ems, traffic
    status = Column(String)  # available, responding, busy, maintenance
    location = Column(JSON)  # {"lat": 38.9072, "lng": -77.0369}
    description = Column(Text)
    current_incident_id = Column(String, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    assignments = relationship("UnitAssignment", back_populates="unit")

class UnitAssignment(Base):
    __tablename__ = "unit_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(String, ForeignKey("emergency_units.unit_id"))
    incident_id = Column(String, ForeignKey("incidents.incident_id"))
    assigned_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String)  # assigned, en_route, on_scene, cleared
    
    # Relationships
    unit = relationship("EmergencyUnit", back_populates="assignments")
    incident = relationship("Incident", back_populates="unit_assignments")

class TrafficIncident(Base):
    __tablename__ = "traffic_incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String, unique=True, index=True)
    type = Column(String)  # accident, congestion, construction, weather
    severity = Column(String)  # low, medium, high
    location = Column(JSON)
    description = Column(Text)
    affected_roads = Column(JSON)  # ["I-95", "Route 50"]
    estimated_duration = Column(Integer)  # minutes
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

class SystemLog(Base):
    __tablename__ = "system_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    level = Column(String)  # info, warning, error, critical
    category = Column(String)  # incident, unit, system, traffic
    message = Column(Text)
    data = Column(JSON, nullable=True)

# Create tables
def create_tables():
    Base.metadata.create_all(bind=engine)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()