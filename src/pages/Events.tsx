import React, { useState } from 'react';
import { Plus, Users, Calendar, Clock, AlertCircle, CheckCircle, HelpCircle, X, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEvent, Event, EventType, EventVisibility, RsvpResponse } from '../contexts/EventContext';
import { useNotification } from '../contexts/NotificationContext';

const Events: React.FC = () => {
  const { currentUser, isManager } = useAuth();
  const { 
    events, 
    eventRsvps, 
    createEvent, 
    getUserRsvpForEvent, 
    respondToEvent, 
    getEventRsvps,
    loading,
    error 
  } = useEvent();
  const { addNotification } = useNotification();
  
  const [formOpen, setFormOpen] = useState(false);
  const [eventType, setEventType] = useState<EventType>('all_hands');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [visibility, setVisibility] = useState<EventVisibility>('team');
  const [rsvpRequired, setRsvpRequired] = useState(false);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  
  // RSVP Modal state
  const [rsvpModalOpen, setRsvpModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  
  // Event Details Modal state
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [eventDetails, setEventDetails] = useState<Event | null>(null);
  
  // Filter state
  const [filterType, setFilterType] = useState<'all' | EventType>('all');

  // Show loading state
  if (loading && !formOpen && !rsvpModalOpen && !detailsModalOpen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader className="h-8 w-8 text-blue-500 animate-spin" />
          <p className="mt-2 text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !formOpen && !rsvpModalOpen && !detailsModalOpen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start max-w-md">
          <AlertCircle className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-medium">Error loading events</h3>
            <p className="mt-1 text-sm">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-3 text-sm font-medium text-red-700 hover:text-red-600"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get upcoming events (events that haven't ended yet)
  const upcomingEvents = events.filter(event => new Date(event.endTime) >= new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  // Get past events
  const pastEvents = events.filter(event => new Date(event.endTime) < new Date())
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  
  // Apply filter
  const filteredUpcomingEvents = filterType === 'all' 
    ? upcomingEvents 
    : upcomingEvents.filter(event => event.eventType === filterType);
  
  const filteredPastEvents = filterType === 'all' 
    ? pastEvents 
    : pastEvents.filter(event => event.eventType === filterType);

  // Handle event creation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    // Validate form
    if (!title || !startTime || !endTime) {
      setFormError('Please fill in all required fields');
      return;
    }
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (end <= start) {
      setFormError('End time must be after start time');
      return;
    }
    
    // Check if start time is in the past
    if (start < new Date()) {
      setFormError('Start time cannot be in the past');
      return;
    }
    
    setFormLoading(true);
    
    try {
      // Create the event
      await createEvent({
        title,
        eventType,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        description,
        visibility,
        rsvpRequired,
      });
      
      // Add notification for team members
      await addNotification({
        userId: '2', // Employee ID
        type: 'info',
        title: 'New Event',
        message: `${currentUser!.name} has created a new event: ${title} on ${start.toLocaleDateString()} at ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      });
      
      closeForm();
    } catch (error) {
      setFormError('An error occurred while creating the event');
      console.error(error);
    } finally {
      setFormLoading(false);
    }
  };

  // Handle RSVP response
  const handleRsvpResponse = async (response: RsvpResponse) => {
    if (!selectedEvent || !currentUser) return;
    
    setRsvpLoading(true);
    
    try {
      await respondToEvent(selectedEvent.id, response);
      
      // Add notification for event creator
      await addNotification({
        userId: selectedEvent.createdBy,
        type: 'info',
        title: 'Event RSVP',
        message: `${currentUser.name} has responded ${response.replace('_', ' ')} to your event: ${selectedEvent.title}.`,
      });
      
      closeRsvpModal();
    } catch (error) {
      console.error(error);
    } finally {
      setRsvpLoading(false);
    }
  };

  // Close modals
  const closeForm = () => {
    setFormOpen(false);
    setEventType('all_hands');
    setTitle('');
    setDescription('');
    setStartTime('');
    setEndTime('');
    setVisibility('team');
    setRsvpRequired(false);
    setFormError('');
  };

  const closeRsvpModal = () => {
    setRsvpModalOpen(false);
    setSelectedEvent(null);
  };

  const closeDetailsModal = () => {
    setDetailsModalOpen(false);
    setEventDetails(null);
  };

  // Open modals
  const openForm = () => {
    if (!isManager() || !currentUser) return;
    
    setFormOpen(true);
    setFormError('');
    
    // Set default dates and times
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format for datetime-local input
    const formatDateTime = (date: Date) => {
      return date.toISOString().slice(0, 16);
    };
    
    setStartTime(formatDateTime(tomorrow));
    
    // End time is 1 hour after start time
    const endTimeDate = new Date(tomorrow);
    endTimeDate.setHours(endTimeDate.getHours() + 1);
    setEndTime(formatDateTime(endTimeDate));
  };

  const openRsvpModal = (event: Event) => {
    setSelectedEvent(event);
    setRsvpModalOpen(true);
  };

  const openDetailsModal = (event: Event) => {
    setEventDetails(event);
    setDetailsModalOpen(true);
  };

  // Get user's RSVP status for an event
  const getRsvpStatus = (eventId: string) => {
    const rsvp = getUserRsvpForEvent(eventId);
    return rsvp ? rsvp.response : null;
  };

  // Render RSVP badge
  const renderRsvpBadge = (status: RsvpResponse | null) => {
    if (!status) return null;
    
    switch (status) {
      case 'attending':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Attending
          </span>
        );
      case 'maybe':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
            <HelpCircle className="h-3 w-3 mr-1" />
            Maybe
          </span>
        );
      case 'not_attending':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
            <X className="h-3 w-3 mr-1" />
            Not Attending
          </span>
        );
      default:
        return null;
    }
  };

  // Render event card
  const renderEventCard = (event: Event) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const eventDate = start.toLocaleDateString();
    const startTime = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Check if this is a multi-day event
    const isMultiDay = start.toDateString() !== end.toDateString();
    
    // Get user's RSVP status
    const rsvpStatus = getRsvpStatus(event.id);
    console.log('akash-----------------')
    return (
      <div key={event.id} className="bg-white rounded-lg shadow-sm hover:shadow overflow-hidden transition-shadow duration-300">
        <div className="px-6 py-4">
          <div className="flex flex-wrap justify-between items-start mb-2">
            <span 
              className={`event-badge ${
                event.eventType === 'training' ? 'training' : 
                event.eventType === 'all_hands' ? 'team-event' : 
                event.eventType === 'celebration' ? 'personal' :
                'sick'
              }`}
            >
              {event.eventType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </span>
            
            {rsvpStatus && renderRsvpBadge(rsvpStatus)}
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-1">{event.title}</h3>
          
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{isMultiDay 
              ? `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
              : eventDate
            }</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <Clock className="h-4 w-4 mr-1" />
            <span>{startTime} - {endTime}</span>
          </div>
          
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.description}</p>
          
          <div className="flex items-center text-xs text-gray-500">
            <Users className="h-3 w-3 mr-1" />
            <span>Organized by {event.createdByName}</span>
          </div>
        </div>
        
        <div className="px-6 py-3 bg-gray-50 flex justify-between items-center">
          <button
            onClick={() => openDetailsModal(event)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View Details
          </button>
          
          {event.rsvpRequired && new Date(event.startTime) > new Date() && (
            <button
              onClick={() => openRsvpModal(event)}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              {rsvpStatus ? 'Update RSVP' : 'RSVP'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Events</h1>
        
        {/* Only managers can create events */}
        {isManager() && (
          <button
            onClick={openForm}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </button>
        )}
      </div>
      
      {/* Filters */}
      <div className="mb-6 flex items-center">
        <span className="text-sm font-medium text-gray-700 mr-3">Filter by:</span>
        
        <div className="flex flex-wrap gap-2">
          <button 
            className={`px-3 py-1.5 text-sm rounded-md ${
              filterType === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setFilterType('all')}
          >
            All
          </button>
          
          <button 
            className={`px-3 py-1.5 text-sm rounded-md ${
              filterType === 'all_hands' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setFilterType('all_hands')}
          >
            All Hands
          </button>
          
          <button 
            className={`px-3 py-1.5 text-sm rounded-md ${
              filterType === 'training' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setFilterType('training')}
          >
            Training
          </button>
          
          <button 
            className={`px-3 py-1.5 text-sm rounded-md ${
              filterType === 'celebration' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setFilterType('celebration')}
          >
            Celebration
          </button>
          
          <button 
            className={`px-3 py-1.5 text-sm rounded-md ${
              filterType === 'after_work' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setFilterType('after_work')}
          >
            After Work
          </button>
        </div>
      </div>
      
      {/* Event Form Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-slide-up">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Create Event</h3>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4">
                {formError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                
                <div className="mb-4">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Event Title*
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 mb-1">
                    Event Type*
                  </label>
                  <select
                    id="eventType"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as EventType)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="all_hands">All Hands</option>
                    <option value="training">Training</option>
                    <option value="celebration">Celebration</option>
                    <option value="after_work">After Work</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date & Time*
                    </label>
                    <input
                      type="datetime-local"
                      id="startTime"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                      End Date & Time*
                    </label>
                    <input
                      type="datetime-local"
                      id="endTime"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Event details"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-1">
                    Visible to*
                  </label>
                  <select
                    id="visibility"
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as EventVisibility)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="team">My Team</option>
                    <option value="department">My Department</option>
                    <option value="all">Everyone</option>
                  </select>
                </div>
                
                <div className="mb-4 flex items-center">
                  <input
                    type="checkbox"
                    id="rsvpRequired"
                    checked={rsvpRequired}
                    onChange={(e) => setRsvpRequired(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <label htmlFor="rsvpRequired" className="ml-2 block text-sm text-gray-700">
                    Require RSVP
                  </label>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {formLoading ? (
                    <>
                      <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Creating...
                    </>
                  ) : (
                    'Create Event'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* RSVP Modal */}
      {rsvpModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-slide-up">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">RSVP to Event</h3>
            </div>
            
            <div className="px-6 py-4">
              <h4 className="text-xl font-medium text-gray-900 mb-2">{selectedEvent.title}</h4>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  {new Date(selectedEvent.startTime).toLocaleDateString()} at{' '}
                  {new Date(selectedEvent.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-sm text-gray-600">
                  Organized by {selectedEvent.createdByName}
                </p>
              </div>
              
              <p className="mb-6 text-gray-700">{selectedEvent.description}</p>
              
              <p className="text-sm font-medium text-gray-700 mb-4">Will you attend this event?</p>
              
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => handleRsvpResponse('attending')}
                  disabled={rsvpLoading}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Yes, I'll attend
                </button>
                
                <button
                  onClick={() => handleRsvpResponse('maybe')}
                  disabled={rsvpLoading}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:bg-amber-400 disabled:cursor-not-allowed"
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Maybe
                </button>
                
                <button
                  onClick={() => handleRsvpResponse('not_attending')}
                  disabled={rsvpLoading}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400 disabled:cursor-not-allowed"
                >
                  <X className="h-4 w-4 mr-2" />
                  No, I can't attend
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 flex justify-end rounded-b-lg">
              <button
                type="button"
                onClick={closeRsvpModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Event Details Modal */}
      {detailsModalOpen && eventDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 animate-slide-up">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Event Details</h3>
            </div>
            
            <div className="px-6 py-4">
              <div className="flex flex-wrap justify-between items-start mb-2">
                <span 
                  className={`event-badge ${
                    eventDetails.eventType === 'training' ? 'training' : 
                    eventDetails.eventType === 'all_hands' ? 'team-event' : 
                    eventDetails.eventType === 'celebration' ? 'personal' :
                    'sick'
                  }`}
                >
                  {eventDetails.eventType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
                
                {getRsvpStatus(eventDetails.id) && renderRsvpBadge(getRsvpStatus(eventDetails.id))}
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{eventDetails.title}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Date & Time</h4>
                  <div className="flex items-center text-gray-700 mb-1">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <span>
                      {new Date(eventDetails.startTime).toLocaleDateString()} to {new Date(eventDetails.endTime).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <span>
                      {new Date(eventDetails.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                      {new Date(eventDetails.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Organizer</h4>
                  <div className="flex items-center text-gray-700">
                    <Users className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{eventDetails.createdByName}</span>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                <p className="text-gray-700 whitespace-pre-line">{eventDetails.description}</p>
              </div>
              
              {isManager() && eventDetails.rsvpRequired && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">RSVPs</h4>
                  
                  {(() => {
                    const rsvps = getEventRsvps(eventDetails.id);
                    
                    if (rsvps.length === 0) {
                      return (
                        <p className="text-gray-500">No responses yet</p>
                      );
                    }
                    
                    // Count responses
                    const attending = rsvps.filter(r => r.response === 'attending').length;
                    const maybe = rsvps.filter(r => r.response === 'maybe').length;
                    const notAttending = rsvps.filter(r => r.response === 'not_attending').length;
                    
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Attending</span>
                          <span className="text-sm font-medium text-gray-900">{attending}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Maybe</span>
                          <span className="text-sm font-medium text-gray-900">{maybe}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Not Attending</span>
                          <span className="text-sm font-medium text-gray-900">{notAttending}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-gray-50 flex justify-between rounded-b-lg">
              {eventDetails.rsvpRequired && new Date(eventDetails.startTime) > new Date() && (
                <button
                  onClick={() => {
                    closeDetailsModal();
                    openRsvpModal(eventDetails);
                  }}
                  className="px-4 py-2 border border-blue-500 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {getRsvpStatus(eventDetails.id) ? 'Update RSVP' : 'RSVP'}
                </button>
              )}
              
              <button
                type="button"
                onClick={closeDetailsModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Upcoming Events */}
      <div className="mb-8">
        <h2 className="text-xl font-medium text-gray-800 mb-4">Upcoming Events</h2>
        
        {filteredUpcomingEvents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            <p>No upcoming events found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUpcomingEvents.map(event => renderEventCard(event))}
          </div>
        )}
      </div>
      
      {/* Past Events */}
      <div>
        <h2 className="text-xl font-medium text-gray-800 mb-4">Past Events</h2>
        
        {filteredPastEvents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            <p>No past events found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPastEvents.slice(0, 3).map(event => renderEventCard(event))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;