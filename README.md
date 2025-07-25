# DC RTCC Simulation

A comprehensive Real-Time Command Center simulation focused on Washington, DC public safety and transportation. This project simulates a dispatch and emergency management system integrating with WMATA APIs and other DC public safety data sources.

## Features

### 🚨 Public Safety Dashboard
- Real-time incident tracking and dispatch
- Emergency vehicle status and location
- Police, Fire, and EMS unit management
- Incident response coordination

### 🚇 Transportation Integration
- WMATA Metro real-time data
- Bus location and status tracking
- Traffic incident monitoring
- Transit emergency coordination

### 🗺️ Geographic Visualization
- Interactive DC map with real-time overlays
- Emergency vehicle tracking
- Incident location mapping
- Traffic flow visualization

### 📊 Real-time Analytics
- Incident statistics and trends
- Response time analytics
- Resource utilization tracking
- Performance metrics

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Leaflet for mapping
- Chart.js for analytics
- Tailwind CSS for styling

### Backend
- FastAPI (Python)
- SQLAlchemy for database
- Redis for caching
- WMATA API integration
- Real-time WebSocket support

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- Redis server

### Installation

1. **Backend Setup**
```bash
cd backend
pip install -r requirements.txt
python main.py
```

2. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

3. **Environment Variables**
Create `.env` files in both frontend and backend directories with:
```
WMATA_API_KEY=your_wmata_api_key_here
```

## API Endpoints

### Public Safety
- `GET /api/incidents` - Get all active incidents
- `POST /api/incidents` - Create new incident
- `GET /api/units` - Get all emergency units
- `PUT /api/units/{id}/status` - Update unit status

### Transportation
- `GET /api/wmata/metro` - WMATA Metro status
- `GET /api/wmata/bus` - WMATA Bus locations
- `GET /api/traffic` - Traffic incidents

### Real-time
- `WS /ws/rtcc` - WebSocket for real-time updates

## Project Structure

```
├── frontend/          # React TypeScript frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript types
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── models/       # Database models
│   │   ├── services/     # Business logic
│   │   └── utils/        # Utilities
└── docs/              # Documentation
```

## Contributing

This is a simulation project for educational and demonstration purposes. Feel free to contribute improvements and additional features.

## License

MIT License