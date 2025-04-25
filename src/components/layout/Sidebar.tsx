import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Clock, Users, PieChart, FileText, CalendarDays } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { isManager } = useAuth();
  
  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-30 w-64 bg-blue-600 text-white transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 transition-transform duration-300 ease-in-out lg:static lg:inset-0`}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="px-6 py-4 bg-blue-700">
          <div className="flex items-center">
            <Clock className="h-8 w-8" />
            <span className="ml-2 text-xl font-bold">Team Calendar</span>
          </div>
        </div>
        
        {/* Navigation links */}
        <nav className="px-4 py-6 flex-1 overflow-y-auto">
          <NavLink 
            to="/dashboard" 
            onClick={onClose}
            className={({ isActive }) => 
              `flex items-center px-4 py-3 mb-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-700 text-white' 
                  : 'text-blue-100 hover:bg-blue-500'
              }`
            }
          >
            <PieChart className="h-5 w-5 mr-3" />
            <span>Dashboard</span>
          </NavLink>
          
          <NavLink 
            to="/calendar" 
            onClick={onClose}
            className={({ isActive }) => 
              `flex items-center px-4 py-3 mb-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-700 text-white' 
                  : 'text-blue-100 hover:bg-blue-500'
              }`
            }
          >
            <Calendar className="h-5 w-5 mr-3" />
            <span>Calendar</span>
          </NavLink>
          
          <NavLink 
            to="/leave-requests" 
            onClick={onClose}
            className={({ isActive }) => 
              `flex items-center px-4 py-3 mb-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-700 text-white' 
                  : 'text-blue-100 hover:bg-blue-500'
              }`
            }
          >
            <FileText className="h-5 w-5 mr-3" />
            <span>Leave Requests</span>
          </NavLink>
          
          <NavLink 
            to="/events" 
            onClick={onClose}
            className={({ isActive }) => 
              `flex items-center px-4 py-3 mb-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-700 text-white' 
                  : 'text-blue-100 hover:bg-blue-500'
              }`
            }
          >
            <CalendarDays className="h-5 w-5 mr-3" />
            <span>Events</span>
          </NavLink>
          
          {isManager() && (
            <div className="mt-8">
              <h3 className="px-4 text-xs font-semibold text-blue-200 uppercase tracking-wider">
                Manager
              </h3>
              
              <NavLink 
                to="/team-analytics" 
                onClick={onClose}
                className={({ isActive }) => 
                  `flex items-center px-4 py-3 mt-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-700 text-white' 
                      : 'text-blue-100 hover:bg-blue-500'
                  }`
                }
              >
                <Users className="h-5 w-5 mr-3" />
                <span>Team Analytics</span>
              </NavLink>
            </div>
          )}
        </nav>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-blue-700">
          <p className="text-xs text-blue-200">Team Calendar v1.0.0</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;