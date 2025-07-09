import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Users, 
  Bus, 
  Activity,
  MapPin,
  Radio
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Incidents', href: '/incidents', icon: AlertTriangle },
    { name: 'Units', href: '/units', icon: Users },
    { name: 'Transportation', href: '/transportation', icon: Bus },
  ];

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700">
        <div className="flex items-center justify-center h-16 bg-dc-blue border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Radio className="h-8 w-8 text-white" />
            <h1 className="text-xl font-bold text-white">DC RTCC</h1>
          </div>
        </div>
        
        <nav className="mt-6">
          <div className="px-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-dc-blue text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Status Indicators */}
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-gray-300">System Online</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-gray-400">DC Metro</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h2>
              <p className="text-sm text-gray-400">
                Real-Time Command Center - Washington, DC
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Activity className="h-4 w-4" />
                <span>Live Data</span>
              </div>
              <div className="text-sm text-gray-400">
                {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-900">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;