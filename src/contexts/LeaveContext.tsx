import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { leaves } from '../api/client';

// Types
export type LeaveType = 'vacation' | 'sick' | 'personal' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_team: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  status: LeaveStatus;
  reason?: string;
  manager_comment?: string;
  created_at: string;
  updated_at: string;
}

interface LeaveContextType {
  leaveRequests: LeaveRequest[];
  userLeaveRequests: LeaveRequest[];
  pendingLeaveRequests: LeaveRequest[];
  createLeaveRequest: (data: Omit<LeaveRequest, 'id' | 'user_id' | 'user_name' | 'user_team' | 'status' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateLeaveRequest: (id: string, status: LeaveStatus, comment?: string) => Promise<void>;
  getUserLeaveHistory: (userId: string) => LeaveRequest[];
  getLeavesByDateRange: (startDate: string, endDate: string) => LeaveRequest[];
  loading: boolean;
  error: string | null;
}

const LeaveContext = createContext<LeaveContextType | undefined>(undefined);

export const useLeave = () => {
  const context = useContext(LeaveContext);
  if (context === undefined) {
    throw new Error('useLeave must be used within a LeaveProvider');
  }
  return context;
};

export const LeaveProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const { currentUser, isManager } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch leave requests on mount and when user changes
  useEffect(() => {
    const fetchLeaveRequests = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      setError(null);
      
      try {
        if (isManager()) {
          const allLeaves = await leaves.getAll();
          console.log('All leave requests:', allLeaves);
          setLeaveRequests(allLeaves);
        } else {
          const myLeaves = await leaves.getMyLeaves();
          setLeaveRequests(myLeaves);
        }
      } catch (err) {
        console.error('Failed to fetch leave requests:', err);
        setError('Failed to fetch leave requests');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveRequests();
  }, [currentUser, isManager]);

  // Get leave requests for current user
  const userLeaveRequests = currentUser 
    ? leaveRequests.filter(request => request.user_id === currentUser.id)
    : [];

  // Get pending leave requests (for managers)
  const pendingLeaveRequests = leaveRequests.filter(request => request.status === 'pending');

  // Create a new leave request
  const createLeaveRequest = async (data: Omit<LeaveRequest, 'id' | 'userId' | 'userName' | 'userTeam' | 'status' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) throw new Error('User not authenticated');
    
    setLoading(true);
    setError(null);
    
    try {
      await leaves.create({
        leaveType: data.leave_type,
        startDate: data.start_date,
        endDate: data.end_date,
        reason: data.reason,
      });
      
      // Refresh leave requests
      const myLeaves = await leaves.getMyLeaves();
      setLeaveRequests(prevLeaves => 
        isManager() 
          ? [...prevLeaves, ...myLeaves.filter(leave => 
              !prevLeaves.some(prevLeave => prevLeave.id === leave.id)
            )]
          : myLeaves
      );
    } catch (err) {
      console.error('Failed to create leave request:', err);
      throw new Error('Failed to create leave request');
    } finally {
      setLoading(false);
    }
  };

  // Update a leave request (approve/reject)
  const updateLeaveRequest = async (id: string, status: LeaveStatus, comment?: string) => {
    if (!currentUser || !isManager()) throw new Error('Unauthorized');
    
    setLoading(true);
    setError(null);
    
    try {
      await leaves.updateStatus(id, { status, comment });
      
      // Update local state
      setLeaveRequests(prevLeaves =>
        prevLeaves.map(leave =>
          leave.id === id
            ? { 
                ...leave, 
                status, 
                managerComment: comment,
                updatedAt: new Date().toISOString()
              }
            : leave
        )
      );
    } catch (err) {
      console.error('Failed to update leave request:', err);
      throw new Error('Failed to update leave request');
    } finally {
      setLoading(false);
    }
  };

  // Get leave history for a specific user
  const getUserLeaveHistory = (userId: string) => {
    return leaveRequests.filter(request => request.user_id === userId);
  };

  // Get leaves within a date range
  const getLeavesByDateRange = (startDate: string, endDate: string) => {
    return leaveRequests.filter(request => {
      // Only include approved leaves
      if (request.status !== 'approved') return false;
      
      // Check if leave period overlaps with the specified date range
      return (
        (request.start_date <= endDate && request.end_date >= startDate)
      );
    });
  };

  const value = {
    leaveRequests,
    userLeaveRequests,
    pendingLeaveRequests,
    createLeaveRequest,
    updateLeaveRequest,
    getUserLeaveHistory,
    getLeavesByDateRange,
    loading,
    error,
  };

  return <LeaveContext.Provider value={value}>{children}</LeaveContext.Provider>;
};