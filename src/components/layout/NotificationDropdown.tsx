import React, { useRef, useEffect } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, X, Loader } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

interface NotificationDropdownProps {
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose }) => {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    clearNotification,
    loading,
    error 
  } = useNotification();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'error':
        return <X className="h-5 w-5 text-red-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const handleReadNotification = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    markAsRead(id);
  };

  const handleClearNotification = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    clearNotification(id);
  };

  if (loading) {
    return (
      <div 
        ref={dropdownRef}
        className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg overflow-hidden z-50 animate-fade-in"
      >
        <div className="p-4 flex items-center justify-center">
          <Loader className="h-5 w-5 text-blue-500 animate-spin" />
          <span className="ml-2 text-gray-600">Loading notifications...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        ref={dropdownRef}
        className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg overflow-hidden z-50 animate-fade-in"
      >
        <div className="p-4 bg-red-50 text-red-700 flex items-start">
          <AlertCircle className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <p className="font-medium">Error loading notifications</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg overflow-hidden z-50 animate-fade-in"
    >
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <Bell className="h-5 w-5 text-gray-600" />
          <h3 className="ml-2 text-lg font-medium text-gray-800">Notifications</h3>
        </div>
        <button 
          onClick={() => markAllAsRead()}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Mark all as read
        </button>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No notifications</p>
          </div>
        ) : (
          <ul>
            {notifications.map((notification) => (
              <li 
                key={notification.id}
                className={`p-4 border-b border-gray-100 transition-colors ${
                  notification.read ? 'bg-white' : 'bg-blue-50'
                }`}
              >
                <div className="flex">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        {!notification.read && (
                          <button
                            onClick={(e) => handleReadNotification(notification.id, e)}
                            className="mr-1 text-blue-600 hover:text-blue-500 focus:outline-none"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleClearNotification(notification.id, e)}
                          className="text-gray-400 hover:text-gray-500 focus:outline-none"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;