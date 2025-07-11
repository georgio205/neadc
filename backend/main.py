from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import asyncio
import json
import os
from dotenv import load_dotenv
from typing import List, Dict, Any
import httpx
import random
from datetime import datetime, timedelta

from database import get_db, create_tables
from models import (
    IncidentCreate, IncidentUpdate, IncidentResponse,
    EmergencyUnitCreate, EmergencyUnitUpdate, EmergencyUnitResponse,
    UnitAssignmentCreate, UnitAssignmentUpdate, UnitAssignmentResponse,
    TrafficIncidentCreate, TrafficIncidentUpdate, TrafficIncidentResponse,
    SystemLogCreate, SystemLogResponse, DashboardStats
)
from crud import (
    create_incident, get_incident, get_incidents, update_incident, delete_incident,
    create_emergency_unit, get_emergency_unit, get_emergency_units, update_emergency_unit, delete_emergency_unit,
    create_unit_assignment, get_unit_assignments, update_unit_assignment,
    create_traffic_incident, get_traffic_incident, get_traffic_incidents, update_traffic_incident, resolve_traffic_incident,
    create_system_log, get_system_logs, get_dashboard_stats
)

# Load environment variables
load_dotenv()

app = FastAPI(
    title="DC RTCC Simulation",
    description="Real-Time Command Center for DC Public Safety and Transportation",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

# Initialize database tables
create_tables()

# Initialize with sample data
def initialize_sample_data(db):
    from sqlalchemy.orm import Session
    
    # Check if we already have data
    existing_units = get_emergency_units(db, limit=1)
    if existing_units:
        return  # Data already exists
    
    # Sample emergency units
    sample_units = [
        EmergencyUnitCreate(
            unit_id="PD-001",
            type="police",
            status="available",
            location={"lat": 38.9072, "lng": -77.0369, "address": "Union Station, Washington, DC"},
            description="Metro Police Unit 1"
        ),
        EmergencyUnitCreate(
            unit_id="FD-001",
            type="fire",
            status="responding",
            location={"lat": 38.8951, "lng": -77.0364, "address": "National Mall, Washington, DC"},
            description="Fire Engine 1"
        ),
        EmergencyUnitCreate(
            unit_id="EMS-001",
            type="ems",
            status="available",
            location={"lat": 38.9007, "lng": -77.0167, "address": "Capitol Hill, Washington, DC"},
            description="Ambulance 1"
        )
    ]
    
    for unit in sample_units:
        create_emergency_unit(db, unit)
    
    # Sample incidents
    sample_incidents = [
        IncidentCreate(
            type="medical",
            priority="high",
            status="active",
            location={"lat": 38.9072, "lng": -77.0369, "address": "Union Station, Washington, DC"},
            description="Medical emergency at Union Station",
            notes="Patient experiencing chest pain"
        )
    ]
    
    for incident in sample_incidents:
        create_incident(db, incident)
    
    # Sample traffic incidents
    sample_traffic = [
        TrafficIncidentCreate(
            type="accident",
            severity="medium",
            location={"lat": 38.8951, "lng": -77.0364, "address": "I-95 near National Mall, Washington, DC"},
            description="Multi-vehicle accident on I-95",
            affected_roads=["I-95", "Route 50"],
            estimated_duration=45
        )
    ]
    
    for traffic in sample_traffic:
        create_traffic_incident(db, traffic)

# WMATA API integration
class WMATAAPI:
    def __init__(self):
        self.api_key = os.getenv("WMATA_API_KEY", "demo_key")
        self.base_url = "https://api.wmata.com"
    
    async def get_metro_status(self):
        """Get WMATA Metro status"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/Incidents.svc/json/Incidents",
                    headers={"api_key": self.api_key}
                )
                if response.status_code == 200:
                    return response.json()
                else:
                    # Return simulated data if API fails
                    return self._get_simulated_metro_data()
        except:
            return self._get_simulated_metro_data()
    
    def _get_simulated_metro_data(self):
        """Simulated WMATA Metro data"""
        lines = ["Red", "Blue", "Orange", "Green", "Yellow", "Silver"]
        statuses = ["Normal", "Minor Delays", "Major Delays", "Service Suspended"]
        
        return {
            "Incidents": [
                {
                    "IncidentID": f"METRO-{i}",
                    "Description": f"Simulated incident on {line} line",
                    "LinesAffected": line,
                    "DateUpdated": datetime.now().isoformat()
                }
                for i, line in enumerate(lines[:3])
            ]
        }

wmata_api = WMATAAPI()

# WebSocket endpoint for real-time updates
@app.websocket("/ws/rtcc")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Get database session
        db = next(get_db())
        
        # Send initial data
        incidents_data = get_incidents(db, limit=50)
        units_data = get_emergency_units(db, limit=50)
        traffic_data = get_traffic_incidents(db, limit=50)
        
        await websocket.send_text(json.dumps({
            "type": "init",
            "incidents": [IncidentResponse.from_orm(incident).dict() for incident in incidents_data],
            "units": [EmergencyUnitResponse.from_orm(unit).dict() for unit in units_data],
            "traffic": [TrafficIncidentResponse.from_orm(incident).dict() for incident in traffic_data]
        }))
        
        # Keep connection alive
        while True:
            await asyncio.sleep(30)
            await websocket.send_text(json.dumps({
                "type": "ping",
                "timestamp": datetime.utcnow().isoformat()
            }))
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# API Routes
@app.get("/")
async def root():
    return {"message": "DC RTCC Simulation API", "status": "running"}

@app.get("/api/dashboard/stats")
async def get_dashboard_stats_api(db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    return get_dashboard_stats(db)

@app.get("/api/incidents", response_model=List[IncidentResponse])
async def get_incidents_api(
    skip: int = 0, 
    limit: int = 100,
    status: str = None,
    type: str = None,
    db: Session = Depends(get_db)
):
    """Get all incidents with optional filtering"""
    incidents = get_incidents(db, skip=skip, limit=limit, status=status, type=type)
    return incidents

@app.post("/api/incidents", response_model=IncidentResponse)
async def create_incident_api(incident: IncidentCreate, db: Session = Depends(get_db)):
    """Create a new incident"""
    db_incident = create_incident(db, incident)
    
    # Log the incident creation
    create_system_log(db, SystemLogCreate(
        level="info",
        category="incident",
        message=f"New incident created: {db_incident.incident_id}",
        data={"incident_id": db_incident.incident_id, "type": db_incident.type}
    ))
    
    # Broadcast to all connected clients
    await manager.broadcast(json.dumps({
        "type": "incident_created",
        "incident": IncidentResponse.from_orm(db_incident).dict()
    }))
    
    return db_incident

@app.get("/api/incidents/{incident_id}", response_model=IncidentResponse)
async def get_incident_api(incident_id: str, db: Session = Depends(get_db)):
    """Get a specific incident"""
    incident = get_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

@app.put("/api/incidents/{incident_id}", response_model=IncidentResponse)
async def update_incident_api(incident_id: str, incident_update: IncidentUpdate, db: Session = Depends(get_db)):
    """Update an incident"""
    incident = update_incident(db, incident_id, incident_update)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Broadcast update
    await manager.broadcast(json.dumps({
        "type": "incident_updated",
        "incident": IncidentResponse.from_orm(incident).dict()
    }))
    
    return incident

@app.delete("/api/incidents/{incident_id}")
async def delete_incident_api(incident_id: str, db: Session = Depends(get_db)):
    """Delete an incident"""
    success = delete_incident(db, incident_id)
    if not success:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Broadcast deletion
    await manager.broadcast(json.dumps({
        "type": "incident_deleted",
        "incident_id": incident_id
    }))
    
    return {"message": "Incident deleted successfully"}

@app.get("/api/units", response_model=List[EmergencyUnitResponse])
async def get_units_api(
    skip: int = 0, 
    limit: int = 100,
    status: str = None,
    type: str = None,
    db: Session = Depends(get_db)
):
    """Get all emergency units with optional filtering"""
    units = get_emergency_units(db, skip=skip, limit=limit, status=status, type=type)
    return units

@app.post("/api/units", response_model=EmergencyUnitResponse)
async def create_unit_api(unit: EmergencyUnitCreate, db: Session = Depends(get_db)):
    """Create a new emergency unit"""
    db_unit = create_emergency_unit(db, unit)
    
    # Log the unit creation
    create_system_log(db, SystemLogCreate(
        level="info",
        category="unit",
        message=f"New emergency unit created: {db_unit.unit_id}",
        data={"unit_id": db_unit.unit_id, "type": db_unit.type}
    ))
    
    return db_unit

@app.get("/api/units/{unit_id}", response_model=EmergencyUnitResponse)
async def get_unit_api(unit_id: str, db: Session = Depends(get_db)):
    """Get a specific emergency unit"""
    unit = get_emergency_unit(db, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    return unit

@app.put("/api/units/{unit_id}", response_model=EmergencyUnitResponse)
async def update_unit_api(unit_id: str, unit_update: EmergencyUnitUpdate, db: Session = Depends(get_db)):
    """Update an emergency unit"""
    unit = update_emergency_unit(db, unit_id, unit_update)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    
    # Broadcast update
    await manager.broadcast(json.dumps({
        "type": "unit_updated",
        "unit": EmergencyUnitResponse.from_orm(unit).dict()
    }))
    
    return unit

@app.delete("/api/units/{unit_id}")
async def delete_unit_api(unit_id: str, db: Session = Depends(get_db)):
    """Delete an emergency unit"""
    success = delete_emergency_unit(db, unit_id)
    if not success:
        raise HTTPException(status_code=404, detail="Unit not found")
    
    return {"message": "Unit deleted successfully"}

@app.put("/api/units/{unit_id}/status")
async def update_unit_status_api(unit_id: str, status_update: Dict[str, str], db: Session = Depends(get_db)):
    """Update unit status"""
    unit = get_emergency_unit(db, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    
    unit_update = EmergencyUnitUpdate(status=status_update["status"])
    if "location" in status_update:
        unit_update.location = status_update["location"]
    
    updated_unit = update_emergency_unit(db, unit_id, unit_update)
    
    # Broadcast to all connected clients
    await manager.broadcast(json.dumps({
        "type": "unit_updated",
        "unit": EmergencyUnitResponse.from_orm(updated_unit).dict()
    }))
    
    return updated_unit

@app.get("/api/wmata/metro")
async def get_wmata_metro():
    """Get WMATA Metro status"""
    return await wmata_api.get_metro_status()

@app.get("/api/wmata/bus")
async def get_wmata_bus():
    """Get WMATA Bus locations (simulated)"""
    # Simulated bus data
    buses = []
    for i in range(10):
        buses.append({
            "id": f"BUS-{i+1:03d}",
            "route": f"Route {random.randint(1, 100)}",
            "location": {
                "lat": 38.9072 + random.uniform(-0.1, 0.1),
                "lng": -77.0369 + random.uniform(-0.1, 0.1),
                "address": f"Washington DC Area - Bus {i+1}"
            },
            "status": random.choice(["in_service", "out_of_service", "delayed"]),
            "last_update": datetime.now().isoformat()
        })
    
    return {"buses": buses}

@app.get("/api/traffic", response_model=List[TrafficIncidentResponse])
async def get_traffic_incidents_api(
    skip: int = 0, 
    limit: int = 100,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get all traffic incidents"""
    incidents = get_traffic_incidents(db, skip=skip, limit=limit, active_only=active_only)
    return incidents

@app.post("/api/traffic", response_model=TrafficIncidentResponse)
async def create_traffic_incident_api(incident: TrafficIncidentCreate, db: Session = Depends(get_db)):
    """Create a new traffic incident"""
    db_incident = create_traffic_incident(db, incident)
    
    # Log the traffic incident creation
    create_system_log(db, SystemLogCreate(
        level="info",
        category="traffic",
        message=f"New traffic incident created: {db_incident.incident_id}",
        data={"incident_id": db_incident.incident_id, "type": db_incident.type}
    ))
    
    # Broadcast to all connected clients
    await manager.broadcast(json.dumps({
        "type": "traffic_created",
        "incident": TrafficIncidentResponse.from_orm(db_incident).dict()
    }))
    
    return db_incident

@app.get("/api/traffic/{incident_id}", response_model=TrafficIncidentResponse)
async def get_traffic_incident_api(incident_id: str, db: Session = Depends(get_db)):
    """Get a specific traffic incident"""
    incident = get_traffic_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Traffic incident not found")
    return incident

@app.put("/api/traffic/{incident_id}", response_model=TrafficIncidentResponse)
async def update_traffic_incident_api(incident_id: str, incident_update: TrafficIncidentUpdate, db: Session = Depends(get_db)):
    """Update a traffic incident"""
    incident = update_traffic_incident(db, incident_id, incident_update)
    if not incident:
        raise HTTPException(status_code=404, detail="Traffic incident not found")
    
    # Broadcast update
    await manager.broadcast(json.dumps({
        "type": "traffic_updated",
        "incident": TrafficIncidentResponse.from_orm(incident).dict()
    }))
    
    return incident

@app.post("/api/traffic/{incident_id}/resolve", response_model=TrafficIncidentResponse)
async def resolve_traffic_incident_api(incident_id: str, db: Session = Depends(get_db)):
    """Resolve a traffic incident"""
    incident = resolve_traffic_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Traffic incident not found")
    
    # Broadcast resolution
    await manager.broadcast(json.dumps({
        "type": "traffic_resolved",
        "incident": TrafficIncidentResponse.from_orm(incident).dict()
    }))
    
    return incident

@app.get("/api/logs", response_model=List[SystemLogResponse])
async def get_system_logs_api(
    skip: int = 0, 
    limit: int = 100,
    level: str = None,
    category: str = None,
    db: Session = Depends(get_db)
):
    """Get system logs"""
    logs = get_system_logs(db, skip=skip, limit=limit, level=level, category=category)
    return logs

# Background task to simulate real-time updates
async def simulate_real_time_updates():
    """Simulate real-time data updates"""
    while True:
        try:
            # Get database session
            db = next(get_db())
            
            # Simulate unit movements
            units = get_emergency_units(db, status="responding")
            for unit in units:
                # Move unit slightly
                new_location = {
                    "lat": unit.location["lat"] + random.uniform(-0.001, 0.001),
                    "lng": unit.location["lng"] + random.uniform(-0.001, 0.001),
                    "address": unit.location.get("address", "Washington DC Area")
                }
                
                unit_update = EmergencyUnitUpdate(location=new_location)
                update_emergency_unit(db, unit.unit_id, unit_update)
            
            # Simulate new incidents occasionally
            if random.random() < 0.05:  # 5% chance
                incident_types = ["medical", "fire", "police", "traffic"]
                priorities = ["low", "medium", "high"]
                
                new_incident = IncidentCreate(
                    type=random.choice(incident_types),
                    priority=random.choice(priorities),
                    status="active",
                    location={
                        "lat": 38.9072 + random.uniform(-0.05, 0.05),
                        "lng": -77.0369 + random.uniform(-0.05, 0.05),
                        "address": "Washington DC Area - Simulated Incident"
                    },
                    description=f"Simulated {random.choice(incident_types)} incident"
                )
                
                db_incident = create_incident(db, new_incident)
                
                await manager.broadcast(json.dumps({
                    "type": "incident_created",
                    "incident": IncidentResponse.from_orm(db_incident).dict()
                }))
            
            # Simulate traffic incidents occasionally
            if random.random() < 0.03:  # 3% chance
                traffic_types = ["accident", "congestion", "construction", "weather"]
                severities = ["low", "medium", "high"]
                
                new_traffic = TrafficIncidentCreate(
                    type=random.choice(traffic_types),
                    severity=random.choice(severities),
                    location={
                        "lat": 38.9072 + random.uniform(-0.05, 0.05),
                        "lng": -77.0369 + random.uniform(-0.05, 0.05),
                        "address": "Washington DC Area - Simulated Traffic Incident"
                    },
                    description=f"Simulated {random.choice(traffic_types)} traffic incident",
                    affected_roads=[f"Route {random.randint(1, 100)}"],
                    estimated_duration=random.randint(15, 120)
                )
                
                db_traffic = create_traffic_incident(db, new_traffic)
                
                await manager.broadcast(json.dumps({
                    "type": "traffic_created",
                    "incident": TrafficIncidentResponse.from_orm(db_traffic).dict()
                }))
                
        except Exception as e:
            print(f"Error in simulation: {e}")
        
        await asyncio.sleep(60)  # Update every minute

@app.on_event("startup")
async def startup_event():
    """Initialize the application"""
    # Get database session and initialize sample data
    db = next(get_db())
    initialize_sample_data(db)
    asyncio.create_task(simulate_real_time_updates())

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)