import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { notifications as notificationsApi} from '../api/client';

// Types
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotification: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const fetchedNotifications = await notificationsApi.getAll();
        setNotifications(fetchedNotifications);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
        setError('Failed to fetch notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    
    // Poll for new notifications every minute
    const pollInterval = setInterval(fetchNotifications, 60000);
    
    return () => clearInterval(pollInterval);
  }, [currentUser]);

  // Count unread notifications
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Add a new notification
  const addNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    setLoading(true);
    setError(null);
    
    try {
      await notificationsApi.create({
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
      });
      
      // Refresh notifications
      const fetchedNotifications = await notificationsApi.getAll();
      setNotifications(fetchedNotifications);
    } catch (err) {
      console.error('Failed to create notification:', err);
      throw new Error('Failed to create notification');
    } finally {
      setLoading(false);
    }
  };

  // Mark a notification as read
  const markAsRead = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await notificationsApi.markAsRead(id);
      
      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      throw new Error('Failed to mark notification as read');
    } finally {
      setLoading(false);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await notificationsApi.markAllAsRead();
      
      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      throw new Error('Failed to mark all notifications as read');
    } finally {
      setLoading(false);
    }
  };

  // Clear a notification
  const clearNotification = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await notificationsApi.delete(id);
      
      // Update local state
      setNotifications(prev =>
        prev.filter(notification => notification.id !== id)
      );
    } catch (err) {
      console.error('Failed to delete notification:', err);
      throw new Error('Failed to delete notification');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    loading,
    error,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};