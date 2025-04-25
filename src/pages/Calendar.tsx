import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useLeave, LeaveRequest, LeaveType } from '../contexts/LeaveContext';
import { useEvent, Event, EventType } from '../contexts/EventContext';
import { useAuth } from '../contexts/AuthContext';

type ViewType = 'day' | 'week' | 'month';
type FilterType = 'all' | LeaveType | EventType;

const Calendar: React.FC = () => {
  const { getLeavesByDateRange } = useLeave();
  const { getEventsByDateRange } = useEvent();
  const { currentUser, isManager } = useAuth();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [calendarData, setCalendarData] = useState<Array<{ date: Date, leaves: LeaveRequest[], events: Event[] }>>([]);
  
  // Teams (for filter)
  const teams = ['Engineering', 'Marketing', 'Sales', 'Design'];
  
  // Generate calendar data
  useEffect(() => {
    const data: Array<{ date: Date, leaves: LeaveRequest[], events: Event[] }> = [];
    
    if (view === 'month') {
      // First day of the month
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      // Last day of the month
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      // Start from the first day of the week that contains the first day of the month
      const start = new Date(firstDay);
      start.setDate(start.getDate() - start.getDay());
      
      // End on the last day of the week that contains the last day of the month
      const end = new Date(lastDay);
      const daysToAdd = 6 - end.getDay();
      end.setDate(end.getDate() + daysToAdd);
      
      // Get leaves and events for the date range
      const rangeStart = start.toISOString().split('T')[0];
      const rangeEnd = end.toISOString().split('T')[0];
      
      const leaves = getLeavesByDateRange(rangeStart, rangeEnd);
      const events = getEventsByDateRange(rangeStart, rangeEnd);
      
      // Generate calendar days
      let day = new Date(start);
      while (day <= end) {
        const currentDay = new Date(day);
        const dateStr = currentDay.toISOString().split('T')[0];
        
        // Get leaves and events for this day
        const dayLeaves = leaves.filter(leave => 
          leave.startDate <= dateStr && leave.endDate >= dateStr
        );
        
        const dayEvents = events.filter(event => {
          const eventStart = new Date(event.startTime);
          const eventEnd = new Date(event.endTime);
          const currentDayStart = new Date(currentDay);
          currentDayStart.setHours(0, 0, 0, 0);
          const currentDayEnd = new Date(currentDay);
          currentDayEnd.setHours(23, 59, 59, 999);
          
          return (
            (eventStart >= currentDayStart && eventStart <= currentDayEnd) ||
            (eventEnd >= currentDayStart && eventEnd <= currentDayEnd) ||
            (eventStart <= currentDayStart && eventEnd >= currentDayEnd)
          );
        });
        
        data.push({ 
          date: currentDay, 
          leaves: dayLeaves, 
          events: dayEvents
        });
        
        day.setDate(day.getDate() + 1);
      }
    } else if (view === 'week') {
      // Start from the first day of the week
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay());
      
      // End on the last day of the week
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      
      // Get leaves and events for the date range
      const rangeStart = start.toISOString().split('T')[0];
      const rangeEnd = end.toISOString().split('T')[0];
      
      const leaves = getLeavesByDateRange(rangeStart, rangeEnd);
      const events = getEventsByDateRange(rangeStart, rangeEnd);
      
      // Generate week days
      let day = new Date(start);
      while (day <= end) {
        const currentDay = new Date(day);
        const dateStr = currentDay.toISOString().split('T')[0];
        
        // Get leaves and events for this day
        const dayLeaves = leaves.filter(leave => 
          leave.startDate <= dateStr && leave.endDate >= dateStr
        );
        
        const dayEvents = events.filter(event => {
          const eventStart = new Date(event.startTime);
          const eventEnd = new Date(event.endTime);
          const currentDayStart = new Date(currentDay);
          currentDayStart.setHours(0, 0, 0, 0);
          const currentDayEnd = new Date(currentDay);
          currentDayEnd.setHours(23, 59, 59, 999);
          
          return (
            (eventStart >= currentDayStart && eventStart <= currentDayEnd) ||
            (eventEnd >= currentDayStart && eventEnd <= currentDayEnd) ||
            (eventStart <= currentDayStart && eventEnd >= currentDayEnd)
          );
        });
        
        data.push({ 
          date: currentDay, 
          leaves: dayLeaves, 
          events: dayEvents
        });
        
        day.setDate(day.getDate() + 1);
      }
    } else if (view === 'day') {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Get leaves and events for this day
      const leaves = getLeavesByDateRange(dateStr, dateStr);
      const events = getEventsByDateRange(dateStr, dateStr);
      
      data.push({ 
        date: new Date(currentDate), 
        leaves, 
        events
      });
    }
    
    setCalendarData(data);
  }, [currentDate, view, getLeavesByDateRange, getEventsByDateRange]);
  
  // Format the month and year for display
  const formattedMonthYear = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });
  
  // Format the current view for display
  const formattedViewDate = () => {
    if (view === 'day') {
      return currentDate.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      });
    } else if (view === 'week') {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay());
      
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      
      const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
      const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
      
      return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${start.getFullYear()}`;
    } else {
      return formattedMonthYear;
    }
  };
  
  // Navigate to previous period
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    
    if (view === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    
    setCurrentDate(newDate);
  };
  
  // Navigate to next period
  const goToNext = () => {
    const newDate = new Date(currentDate);
    
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    
    setCurrentDate(newDate);
  };
  
  // Navigate to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Filter the events and leaves based on filter type and team
  const filteredCalendarData = calendarData.map(dayData => {
    let filteredLeaves = dayData.leaves;
    let filteredEvents = dayData.events;
    
    // Filter by type
    if (filterType !== 'all') {
      if (['vacation', 'sick', 'personal', 'other'].includes(filterType as string)) {
        // It's a leave type
        filteredLeaves = filteredLeaves.filter(leave => leave.leaveType === filterType);
        filteredEvents = [];
      } else {
        // It's an event type
        filteredEvents = filteredEvents.filter(event => event.eventType === filterType);
        filteredLeaves = [];
      }
    }
    
    // Filter by team
    if (filterTeam !== 'all') {
      filteredLeaves = filteredLeaves.filter(leave => leave.userTeam === filterTeam);
    }
    
    return {
      ...dayData,
      leaves: filteredLeaves,
      events: filteredEvents
    };
  });
  
  // Render the calendar based on the view
  const renderCalendar = () => {
    if (view === 'month') {
      // Weekday headers
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {weekdays.map((day, index) => (
              <div 
                key={index} 
                className="py-2 text-sm font-medium text-gray-500 text-center"
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {filteredCalendarData.map((dayData, index) => {
              const isToday = dayData.date.toDateString() === new Date().toDateString();
              const isCurrentMonth = dayData.date.getMonth() === currentDate.getMonth();
              
              // Combine leaves and events
              const allItems = [
                ...dayData.leaves.map(leave => ({ 
                  type: 'leave', 
                  title: `${leave.userName} - ${leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)}`,
                  itemClass: leave.leaveType
                })),
                ...dayData.events.map(event => ({ 
                  type: 'event', 
                  title: event.title,
                  itemClass: event.eventType === 'training' ? 'training' : 
                            event.eventType === 'all_hands' ? 'team-event' : 
                            'personal'
                }))
              ];
              
              return (
                <div 
                  key={index}
                  className={`calendar-day ${isToday ? 'today' : ''} ${!isCurrentMonth ? 'other-month' : ''}`}
                >
                  <span className="text-xs font-medium">
                    {dayData.date.getDate()}
                  </span>
                  
                  <div className="mt-1 overflow-y-auto max-h-16">
                    {allItems.slice(0, 3).map((item, idx) => (
                      <div 
                        key={idx} 
                        className={`event-badge ${item.itemClass}`}
                        title={item.title}
                      >
                        {item.title}
                      </div>
                    ))}
                    
                    {allItems.length > 3 && (
                      <div className="text-xs text-gray-500 px-1">
                        +{allItems.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    } else if (view === 'week') {
      // Weekday headers with dates
      const dates = filteredCalendarData.map(data => data.date);
      
      return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {dates.map((date, index) => {
              const isToday = date.toDateString() === new Date().toDateString();
              
              return (
                <div 
                  key={index} 
                  className={`py-3 text-center ${isToday ? 'bg-blue-50' : ''}`}
                >
                  <p className="text-sm font-medium text-gray-500">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                  <p className={`text-lg ${isToday ? 'font-bold text-blue-600' : 'text-gray-800'}`}>
                    {date.getDate()}
                  </p>
                </div>
              );
            })}
          </div>
          
          {/* Calendar content */}
          <div className="grid grid-cols-7 divide-x divide-gray-200">
            {filteredCalendarData.map((dayData, index) => {
              const isToday = dayData.date.toDateString() === new Date().toDateString();
              
              // Combine leaves and events
              const allItems = [
                ...dayData.leaves.map(leave => ({ 
                  type: 'leave', 
                  title: `${leave.userName} - ${leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)}`,
                  itemClass: leave.leaveType
                })),
                ...dayData.events.map(event => ({ 
                  type: 'event', 
                  title: event.title,
                  time: new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  itemClass: event.eventType === 'training' ? 'training' : 
                            event.eventType === 'all_hands' ? 'team-event' : 
                            'personal'
                }))
              ];
              
              return (
                <div 
                  key={index}
                  className={`p-3 h-80 overflow-y-auto ${isToday ? 'bg-blue-50' : ''}`}
                >
                  {allItems.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                      <p>No events</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {allItems.map((item, idx) => (
                        <div 
                          key={idx} 
                          className={`p-2 rounded ${
                            item.itemClass === 'vacation' ? 'bg-blue-50 border-l-4 border-blue-500' :
                            item.itemClass === 'sick' ? 'bg-red-50 border-l-4 border-red-500' :
                            item.itemClass === 'personal' ? 'bg-purple-50 border-l-4 border-purple-500' :
                            item.itemClass === 'training' ? 'bg-amber-50 border-l-4 border-amber-500' :
                            item.itemClass === 'team-event' ? 'bg-green-50 border-l-4 border-green-500' :
                            'bg-gray-50 border-l-4 border-gray-500'
                          }`}
                        >
                          <p className="text-sm font-medium">
                            {item.title}
                          </p>
                          {item.type === 'event' && (
                            <p className="text-xs text-gray-500 mt-1">
                              {item.time}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    } else if (view === 'day') {
      const dayData = filteredCalendarData[0];
      
      // Combine leaves and events
      const allItems = [
        ...dayData.leaves.map(leave => ({ 
          type: 'leave', 
          title: `${leave.userName} - ${leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)}`,
          itemClass: leave.leaveType,
          allDay: true
        })),
        ...dayData.events.map(event => ({ 
          type: 'event', 
          title: event.title,
          description: event.description,
          startTime: new Date(event.startTime),
          endTime: new Date(event.endTime),
          itemClass: event.eventType === 'training' ? 'training' : 
                    event.eventType === 'all_hands' ? 'team-event' : 
                    'personal'
        }))
      ];
      
      // Sort events by start time
      allItems.sort((a, b) => {
        if (a.allDay && !b.allDay) return -1;
        if (!a.allDay && b.allDay) return 1;
        if (a.allDay && b.allDay) return 0;
        return a.startTime.getTime() - b.startTime.getTime();
      });
      
      return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">
              Events for {dayData.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h2>
            
            {allItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No events or leaves scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allItems.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-lg shadow-sm ${
                      item.itemClass === 'vacation' ? 'bg-blue-50' :
                      item.itemClass === 'sick' ? 'bg-red-50' :
                      item.itemClass === 'personal' ? 'bg-purple-50' :
                      item.itemClass === 'training' ? 'bg-amber-50' :
                      item.itemClass === 'team-event' ? 'bg-green-50' :
                      'bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-md font-medium text-gray-800">
                        {item.title}
                      </h3>
                      <span className={`event-badge ${item.itemClass}`}>
                        {item.type === 'leave' ? 'Leave' : 'Event'}
                      </span>
                    </div>
                    
                    {item.allDay ? (
                      <p className="text-sm text-gray-600 mt-1">All day</p>
                    ) : (
                      <p className="text-sm text-gray-600 mt-1">
                        {item.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                        {item.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                    
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Team Calendar</h1>
        
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center rounded-lg overflow-hidden border border-gray-300">
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1.5 text-sm font-medium ${
                view === 'day' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1.5 text-sm font-medium ${
                view === 'week' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 text-sm font-medium ${
                view === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Month
            </button>
          </div>
          
          <button
            onClick={goToToday}
            className="px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Today
          </button>
        </div>
      </div>
      
      {/* Filters and navigation */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          <button
            onClick={goToPrevious}
            className="p-1.5 rounded-full text-gray-600 hover:bg-gray-100"
          >
            <ChevronLeft size={20} />
          </button>
          
          <h2 className="mx-4 text-lg font-medium text-gray-800 w-44 text-center">
            {formattedViewDate()}
          </h2>
          
          <button
            onClick={goToNext}
            className="p-1.5 rounded-full text-gray-600 hover:bg-gray-100"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <span className="text-sm text-gray-600">Filter:</span>
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="rounded-md border-gray-300 py-1.5 text-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <optgroup label="Leave Types">
              <option value="vacation">Vacation</option>
              <option value="sick">Sick</option>
              <option value="personal">Personal</option>
              <option value="other">Other Leave</option>
            </optgroup>
            <optgroup label="Event Types">
              <option value="all_hands">All Hands</option>
              <option value="training">Training</option>
              <option value="celebration">Celebration</option>
              <option value="after_work">After Work</option>
              <option value="other">Other Event</option>
            </optgroup>
          </select>
          
          {isManager() && (
            <select
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              className="rounded-md border-gray-300 py-1.5 text-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Teams</option>
              {teams.map((team) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          )}
        </div>
      </div>
      
      {/* Calendar */}
      {renderCalendar()}
    </div>
  );
};

export default Calendar;