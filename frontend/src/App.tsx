import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Incidents from './pages/Incidents';
import Units from './pages/Units';
import Transportation from './pages/Transportation';
import Layout from './components/Layout';
import './index.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/units" element={<Units />} />
            <Route path="/transportation" element={<Transportation />} />
          </Routes>
        </Layout>
      </div>
    </Router>
  );
}

export default App;