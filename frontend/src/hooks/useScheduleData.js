import { useState, useEffect } from 'react';
import { fetchUserData, createEvent, extractEventsFromUserData } from '../services/scheduleApi';
import { filterEventsForDate } from '../utils/dateUtils';

export const useScheduleData = () => {
  const [userName, setUserName] = useState('');
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [leaderData, setLeaderData] = useState(null);
  const [error, setError] = useState(null);

  // Fixed week: Aug 25-31, 2025
  const EVENTS_WEEK_START = new Date('2025-08-25');
  const [currentDate] = useState(EVENTS_WEEK_START);

  // Load all data
  const loadScheduleData = async () => {
    try {
      const storedUserName = localStorage.getItem('userName') || 'Adrian Cheng';
      setUserName(storedUserName);

      // Fetch data from the lookup endpoint
      const userData = await fetchUserData(storedUserName);
      setLeaderData(userData);
      
      // Extract events from the lookup response
      const events = extractEventsFromUserData(userData);
      setEvents(events);
      
      const filtered = filterEventsForDate(events);
      setFilteredEvents(filtered);
      
      // Store in localStorage for offline access
      localStorage.setItem('leaderData', JSON.stringify(userData));
      localStorage.setItem('scheduleData', JSON.stringify({ events }));
      
    } catch (error) {
      console.error('Error loading data:', error);
      setError(`Failed to fetch user data: ${error.message}`);
      // Try to load from localStorage as fallback
      loadFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback to localStorage if API fails
  const loadFromLocalStorage = () => {
    try {
      const storedUserName = localStorage.getItem('userName');
      const storedLeaderData = localStorage.getItem('leaderData');
      const storedScheduleData = localStorage.getItem('scheduleData');

      if (storedUserName) setUserName(storedUserName);
      if (storedLeaderData) setLeaderData(JSON.parse(storedLeaderData));
      if (storedScheduleData) {
        const scheduleData = JSON.parse(storedScheduleData);
        setEvents(scheduleData.events || []);
        const filtered = filterEventsForDate(scheduleData.events || []);
        setFilteredEvents(filtered);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  };

  // Create a new event
  const handleCreateEvent = async (eventData) => {
    try {
      await createEvent(eventData, userName);
      // Refresh the events after creating
      loadScheduleData();
    } catch (error) {
      console.error('Failed to create event:', error);
      // For now, just show an alert instead of throwing
      alert('Create event feature will be available once the backend endpoint is implemented.');
    }
  };

  useEffect(() => {
    loadScheduleData();
  }, []); // Remove currentDate dependency since it's now fixed

  return {
    userName,
    setUserName,
    events,
    filteredEvents,
    isLoading,
    leaderData,
    error,
    currentDate,
    loadScheduleData,
    handleCreateEvent
  };
};
