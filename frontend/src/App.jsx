import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Coffee, LayoutDashboard, Package, BarChart3, Menu, X, LogOut, Plus, Edit, Trash2 } from 'lucide-react';
import POS from './components/POS';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Reports from './components/Reports';
import Login from './components/Login';

function App() {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const canAccess = (feature) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'cashier') {
      return ['pos', 'dashboard', 'inventory-view'].includes(feature);
    }
    return false;
  };

  const NavItem = ({ to, icon: Icon, children, requires = null }) => {
    if (requires && !canAccess(requires)) return null;
    return (
      <Link
        to={to}
        onClick={() => setSidebarOpen(false)}
        className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-amber-100 transition-colors text-gray-700 hover:text-amber-800"
      >
        <Icon size={20} />
        <span className="text-sm sm:text-base">{children}</span>
      </Link>
    );
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="lg:hidden bg-amber-600 text-white p-3 sm:p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coffee size={24} />
            <span className="font-bold text-base sm:text-lg">Cafe POS</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-56 sm:w-64 bg-amber-50 border-r border-amber-200 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-2 text-amber-800 mb-6 sm:mb-8">
                <Coffee size={24} />
                <span className="font-bold text-xl sm:text-2xl">Cafe POS</span>
              </div>
              <nav className="space-y-1 sm:space-y-2">
                <NavItem to="/" icon={Coffee} requires="pos">Point of Sale</NavItem>
                <NavItem to="/dashboard" icon={LayoutDashboard} requires="dashboard">Dashboard</NavItem>
                <NavItem to="/inventory" icon={Package} requires="inventory-view">Inventory</NavItem>
                <NavItem to="/reports" icon={BarChart3} requires="reports-view">Reports</NavItem>
              </nav>

              {/* User Info & Logout */}
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-amber-200">
                <div className="mb-3">
                  <p className="text-xs text-gray-500">Logged in as</p>
                  <p className="font-medium text-gray-800">{user.full_name || user.username}</p>
                  <p className="text-xs text-amber-600 capitalize">{user.role}</p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to logout?')) {
                      handleLogout();
                    }
                  }}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          </aside>

          {/* Overlay for mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <main className="flex-1 p-6 lg:p-8 min-h-screen">
            <Routes>
              <Route path="/" element={<POS />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/inventory" element={<Inventory readOnly={!canAccess('inventory-edit')} />} />
              <Route path="/reports" element={<Reports readOnly={!canAccess('reports-edit')} />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
