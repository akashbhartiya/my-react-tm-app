import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { events } from '../api/client';

// Types
export type EventType = 'after_work' | 'all_hands' | 'celebration' | 'training' | 'other';
export type RsvpResponse = 'attending' | 'maybe' | 'not_attending';
export type EventVisibility = 'team' | 'department' | 'all' | 'custom';

export interface Event {
  id: string;
  title: string;
  eventType: EventType;
  startTime: string;
  endTime: string;
  description: string;
  createdBy: string;
  createdByName: string;
  visibility: EventVisibility;
  rsvpRequired: boolean;
  createdAt: string;
}

export interface EventRsvp {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  response: RsvpResponse;
  respondedAt: string;
}

interface EventContextType {
  events: Event[];
  eventRsvps: EventRsvp[];
  createEvent: (data: Omit<Event, 'id' | 'createdBy' | 'createdByName' | 'createdAt'>) => Promise<void>;
  getEventById: (id: string) => Event | undefined;
  getEventsByDateRange: (startDate: string, endDate: string) => Event[];
  respondToEvent: (eventId: string, response: RsvpResponse) => Promise<void>;
  getUserRsvpForEvent: (eventId: string) => EventRsvp | undefined;
  getEventRsvps: (eventId: string) => EventRsvp[];
  loading: boolean;
  error: string | null;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const useEvent = () => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
};

export const EventProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const { currentUser } = useAuth();
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [eventRsvps, setEventRsvps] = useState<EventRsvp[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch events on mount and when user changes
  useEffect(() => {
    const fetchEvents = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const fetchedEvents = await events.getAll();
        setAllEvents(fetchedEvents);
      } catch (err) {
        console.error('Failed to fetch events:', err);
        setError('Failed to fetch events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [currentUser]);

  // Create a new event
  const createEvent = async (data: Omit<Event, 'id' | 'createdBy' | 'createdByName' | 'createdAt'>) => {
    if (!currentUser) throw new Error('User not authenticated');
    
    setLoading(true);
    setError(null);
    
    try {
      await events.create({
        title: data.title,
        eventType: data.eventType,
        startTime: data.startTime,
        endTime: data.endTime,
        description: data.description,
        visibility: data.visibility,
        rsvpRequired: data.rsvpRequired,
      });
      
      // Refresh events
      const fetchedEvents = await events.getAll();
      setAllEvents(fetchedEvents);
    } catch (err) {
      console.error('Failed to create event:', err);
      throw new Error('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  // Get event by ID
  const getEventById = (id: string) => {
    return allEvents.find(event => event.id === id);
  };

  // Get events within a date range
  const getEventsByDateRange = (startDate: string, endDate: string) => {
    return allEvents.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      const rangeStart = new Date(startDate);
      const rangeEnd = new Date(endDate);
      
      return (
        (eventStart >= rangeStart && eventStart <= rangeEnd) ||
        (eventEnd >= rangeStart && eventEnd <= rangeEnd) ||
        (eventStart <= rangeStart && eventEnd >= rangeEnd)
      );
    });
  };

  // Respond to an event (RSVP)
  const respondToEvent = async (eventId: string, response: RsvpResponse) => {
    if (!currentUser) throw new Error('User not authenticated');
    
    setLoading(true);
    setError(null);
    
    try {
      await events.submitRsvp(eventId, response);
      
      // Refresh RSVPs for this event
      const updatedRsvps = await events.getRsvps(eventId);
      setEventRsvps(prev => {
        const otherEventRsvps = prev.filter(rsvp => rsvp.eventId !== eventId);
        return [...otherEventRsvps, ...updatedRsvps];
      });
    } catch (err) {
      console.error('Failed to submit RSVP:', err);
      throw new Error('Failed to submit RSVP');
    } finally {
      setLoading(false);
    }
  };

  // Get user's RSVP for an event
  const getUserRsvpForEvent = (eventId: string) => {
    if (!currentUser) return undefined;
    
    return eventRsvps.find(
      rsvp => rsvp.eventId === eventId && rsvp.userId === currentUser.id
    );
  };

  // Get all RSVPs for an event
  const getEventRsvps = (eventId: string) => {
    return eventRsvps.filter(rsvp => rsvp.eventId === eventId);
  };

  const value = {
    events: allEvents,
    eventRsvps,
    createEvent,
    getEventById,
    getEventsByDateRange,
    respondToEvent,
    getUserRsvpForEvent,
    getEventRsvps,
    loading,
    error,
  };

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};