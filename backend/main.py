from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
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

# Simulated data storage
incidents = []
units = []
traffic_incidents = []

# Initialize with sample data
def initialize_sample_data():
    global incidents, units, traffic_incidents
    
    # Sample emergency units
    units.extend([
        {
            "id": "PD-001",
            "type": "police",
            "status": "available",
            "location": {"lat": 38.9072, "lng": -77.0369},
            "description": "Metro Police Unit 1"
        },
        {
            "id": "FD-001", 
            "type": "fire",
            "status": "responding",
            "location": {"lat": 38.8951, "lng": -77.0364},
            "description": "Fire Engine 1"
        },
        {
            "id": "EMS-001",
            "type": "ems", 
            "status": "available",
            "location": {"lat": 38.9007, "lng": -77.0167},
            "description": "Ambulance 1"
        }
    ])
    
    # Sample incidents
    incidents.extend([
        {
            "id": "INC-001",
            "type": "medical",
            "priority": "high",
            "status": "active",
            "location": {"lat": 38.9072, "lng": -77.0369},
            "description": "Medical emergency at Union Station",
            "assigned_units": ["EMS-001"],
            "created_at": datetime.now().isoformat()
        }
    ])

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
        while True:
            # Send initial data
            await websocket.send_text(json.dumps({
                "type": "init",
                "incidents": incidents,
                "units": units,
                "traffic": traffic_incidents
            }))
            
            # Keep connection alive
            await asyncio.sleep(30)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# API Routes
@app.get("/")
async def root():
    return {"message": "DC RTCC Simulation API", "status": "running"}

@app.get("/api/incidents")
async def get_incidents():
    """Get all active incidents"""
    return {"incidents": incidents}

@app.post("/api/incidents")
async def create_incident(incident: Dict[str, Any]):
    """Create a new incident"""
    incident_id = f"INC-{len(incidents) + 1:03d}"
    new_incident = {
        "id": incident_id,
        "created_at": datetime.now().isoformat(),
        **incident
    }
    incidents.append(new_incident)
    
    # Broadcast to all connected clients
    await manager.broadcast(json.dumps({
        "type": "incident_created",
        "incident": new_incident
    }))
    
    return new_incident

@app.get("/api/units")
async def get_units():
    """Get all emergency units"""
    return {"units": units}

@app.put("/api/units/{unit_id}/status")
async def update_unit_status(unit_id: str, status: Dict[str, str]):
    """Update unit status"""
    for unit in units:
        if unit["id"] == unit_id:
            unit["status"] = status["status"]
            if "location" in status:
                unit["location"] = status["location"]
            
            # Broadcast update
            await manager.broadcast(json.dumps({
                "type": "unit_updated",
                "unit": unit
            }))
            
            return unit
    
    raise HTTPException(status_code=404, detail="Unit not found")

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
                "lng": -77.0369 + random.uniform(-0.1, 0.1)
            },
            "status": random.choice(["in_service", "out_of_service", "delayed"]),
            "last_update": datetime.now().isoformat()
        })
    
    return {"buses": buses}

@app.get("/api/traffic")
async def get_traffic_incidents():
    """Get traffic incidents"""
    return {"incidents": traffic_incidents}

@app.post("/api/traffic")
async def create_traffic_incident(incident: Dict[str, Any]):
    """Create a new traffic incident"""
    incident_id = f"TRAFFIC-{len(traffic_incidents) + 1:03d}"
    new_incident = {
        "id": incident_id,
        "created_at": datetime.now().isoformat(),
        **incident
    }
    traffic_incidents.append(new_incident)
    
    await manager.broadcast(json.dumps({
        "type": "traffic_incident_created",
        "incident": new_incident
    }))
    
    return new_incident

# Background task to simulate real-time updates
async def simulate_real_time_updates():
    """Simulate real-time data updates"""
    while True:
        # Simulate unit movements
        for unit in units:
            if unit["status"] == "responding":
                # Move unit slightly
                unit["location"]["lat"] += random.uniform(-0.001, 0.001)
                unit["location"]["lng"] += random.uniform(-0.001, 0.001)
        
        # Simulate new incidents occasionally
        if random.random() < 0.1:  # 10% chance
            new_incident = {
                "id": f"INC-{len(incidents) + 1:03d}",
                "type": random.choice(["medical", "fire", "police", "traffic"]),
                "priority": random.choice(["low", "medium", "high"]),
                "status": "active",
                "location": {
                    "lat": 38.9072 + random.uniform(-0.05, 0.05),
                    "lng": -77.0369 + random.uniform(-0.05, 0.05)
                },
                "description": f"Simulated {random.choice(['medical', 'fire', 'police', 'traffic'])} incident",
                "assigned_units": [],
                "created_at": datetime.now().isoformat()
            }
            incidents.append(new_incident)
            
            await manager.broadcast(json.dumps({
                "type": "incident_created",
                "incident": new_incident
            }))
        
        await asyncio.sleep(30)  # Update every 30 seconds

@app.on_event("startup")
async def startup_event():
    """Initialize the application"""
    initialize_sample_data()
    asyncio.create_task(simulate_real_time_updates())

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)