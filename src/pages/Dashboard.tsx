import React, { useState } from 'react';
import { Users, Calendar, AlarmClockCheck as ClockCheck, RefreshCw, Clock, CalendarClock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLeave, LeaveRequest } from '../contexts/LeaveContext';
import { useEvent, Event } from '../contexts/EventContext';

const Dashboard: React.FC = () => {
  const { currentUser, isManager } = useAuth();
  const { userLeaveRequests, pendingLeaveRequests, getLeavesByDateRange } = useLeave();
  const { getEventsByDateRange } = useEvent();
  
  // Get today's date
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // Get end of week
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
  const endOfWeekStr = endOfWeek.toISOString().split('T')[0];
  
  // Get team absences for today
  const todayAbsences = getLeavesByDateRange(todayStr, todayStr);
  
  // Get upcoming events
  const upcomingEvents = getEventsByDateRange(todayStr, endOfWeekStr);
  
  // Pending leaves (for managers)
  const pendingLeaves = isManager() ? pendingLeaveRequests : [];
  
  // User's upcoming leave requests
  const userUpcomingLeaves = userLeaveRequests.filter(
    request => new Date(request.start_date) >= today
  );
  
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Welcome back, {currentUser?.name}</h1>
        <p className="text-gray-600">Here's what's happening with your team.</p>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 flex items-start">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Out Today</p>
            <p className="text-2xl font-bold text-gray-800">{todayAbsences.length}</p>
            <p className="text-sm text-gray-500">Team members</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 flex items-start">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <Calendar className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
            <p className="text-2xl font-bold text-gray-800">{upcomingEvents.length}</p>
            <p className="text-sm text-gray-500">This week</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 flex items-start">
          <div className="rounded-full bg-purple-100 p-3 mr-4">
            <ClockCheck className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Your Upcoming Leave</p>
            <p className="text-2xl font-bold text-gray-800">{userUpcomingLeaves.length}</p>
            <p className="text-sm text-gray-500">Scheduled</p>
          </div>
        </div>
        
        {isManager() && (
          <div className="bg-white rounded-lg shadow p-6 flex items-start">
            <div className="rounded-full bg-amber-100 p-3 mr-4">
              <RefreshCw className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <p className="text-2xl font-bold text-gray-800">{pendingLeaves.length}</p>
              <p className="text-sm text-gray-500">Awaiting approval</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Who's out today */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center">
            <Clock className="h-5 w-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-800">Who's Out Today</h2>
          </div>
          
          <div className="p-6">
            {todayAbsences.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p>Everyone is in today!</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {todayAbsences.map((leave) => (
                  <li key={leave.id} className="py-4 flex items-center">
                    <img
                      className="h-10 w-10 rounded-full object-cover"
                      src={`https://i.pravatar.cc/150?img=${parseInt(leave.user_id)}`}
                      alt={leave.user_name}
                    />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{leave.user_name}</p>
                      <p className="text-xs text-gray-500">{leave.user_team}</p>
                    </div>
                    <span className={`ml-auto event-badge ${leave.leave_type}`}>
                      {leave.leave_type.charAt(0).toUpperCase() + leave.leave_type.slice(1)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* Upcoming events */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center">
            <CalendarClock className="h-5 w-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-800">Upcoming Events</h2>
          </div>
          
          <div className="p-6">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p>No upcoming events this week</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {upcomingEvents.slice(0, 5).map((event) => (
                  <li key={event.id} className="py-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {new Date(event.startTime).toLocaleDateString()} at {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className={`event-badge ${event.eventType === 'training' ? 'training' : event.eventType === 'all_hands' ? 'team-event' : 'personal'}`}>
                        {event.eventType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">{event.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;