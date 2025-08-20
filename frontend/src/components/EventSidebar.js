'use client';

import React, { useState, useEffect } from 'react';
import { ClockIcon, MapPinIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const EventSidebar = ({ events, leaderData }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [checkedInEvents, setCheckedInEvents] = useState(new Set());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Parse time string to Date object for comparison
  const parseTimeToDate = (timeStr, eventDate) => {
    if (!timeStr || !eventDate) return null;
    
    const time = timeStr.toLowerCase().replace(/\s/g, '');
    let hours = parseInt(time.match(/(\d+):/)?.[1] || '0');
    const minutes = parseInt(time.match(/:(\d+)/)?.[1] || '0');
    const isPM = time.includes('pm');
    
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    
    // Handle "Aug 25" format
    let date;
    if (eventDate.includes('Aug')) {
      const dayNum = parseInt(eventDate.replace('Aug ', ''));
      date = new Date(2025, 7, dayNum); // August 2025
    } else {
      date = new Date(eventDate);
    }
    
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Format time for display
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    
    const time = timeStr.toLowerCase().replace(/\s/g, '');
    let hours = parseInt(time.match(/(\d+):/)?.[1] || '0');
    const minutes = parseInt(time.match(/:(\d+)/)?.[1] || '0');
    const isPM = time.includes('pm');
    
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${displayHours}:${displayMinutes} ${period}`;
  };

  // Get the next upcoming event (or first event if none are upcoming)
  const getNextEvent = () => {
    if (!events || events.length === 0) return null;

    // Convert "Aug 25" format to proper dates for comparison
    const convertEventDate = (eventDateStr) => {
      if (eventDateStr.includes('Aug')) {
        const dayNum = parseInt(eventDateStr.replace('Aug ', ''));
        return new Date(2025, 7, dayNum); // August 2025
      }
      return new Date(eventDateStr);
    };

    // Sort all events by date and time
    const sortedEvents = [...events].sort((a, b) => {
      const dateA = convertEventDate(a.date);
      const dateB = convertEventDate(b.date);
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      
      // Same date, sort by start time
      const startTimeA = parseTimeToDate(a.start_time || a['Start Time'], a.date);
      const startTimeB = parseTimeToDate(b.start_time || b['Start Time'], b.date);
      
      if (!startTimeA) return 1;
      if (!startTimeB) return -1;
      
      return startTimeA - startTimeB;
    });

    const now = currentTime;

    // First, try to find an upcoming event (not yet ended)
    const upcomingEvent = sortedEvents.find(event => {
      const eventDate = convertEventDate(event.date);
      const endTime = parseTimeToDate(event.end_time || event['End Time'], event.date);
      
      // If event is in the future or hasn't ended yet today
      if (eventDate.getTime() > now.getTime()) return true;
      if (eventDate.toDateString() === now.toDateString() && endTime && endTime > now) {
        return true;
      }
      return false;
    });

    // If no upcoming events, return the first event in the schedule
    return upcomingEvent || sortedEvents[0] || null;
  };

  // Check if an event has started
  const hasEventStarted = (event) => {
    if (!event) return false;
    
    const startTime = parseTimeToDate(event.start_time || event['Start Time'], event.date);
    return startTime && startTime <= currentTime;
  };

  // Handle check-in
  const handleCheckIn = (event) => {
    const eventKey = `${event.date}-${event.event_name || event.Event}-${event.start_time || event['Start Time']}`;
    setCheckedInEvents(prev => new Set([...prev, eventKey]));
  };

  // Check if event is checked in
  const isCheckedIn = (event) => {
    const eventKey = `${event.date}-${event.event_name || event.Event}-${event.start_time || event['Start Time']}`;
    return checkedInEvents.has(eventKey);
  };

  const nextEvent = getNextEvent();
  const canCheckIn = nextEvent && hasEventStarted(nextEvent);
  const isEventCheckedIn = nextEvent && isCheckedIn(nextEvent);

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex-shrink-0 flex flex-col">
      <div className="p-6 flex-1">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Next Event</h2>
        
        {nextEvent ? (
          <div className="space-y-4">
            {/* Event Card */}
            <div className="bg-gray-50 rounded-lg p-4 border">
              <h3 className="font-medium text-gray-900 mb-2">
                {nextEvent.event_name || nextEvent.Event}
              </h3>
              
              {/* Time */}
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <ClockIcon className="h-4 w-4 mr-2" />
                <span>
                  {formatTime(nextEvent.start_time || nextEvent['Start Time'])} - {formatTime(nextEvent.end_time || nextEvent['End Time'])}
                </span>
              </div>
              
              {/* Location */}
              {nextEvent.location && (
                <div className="flex items-center text-sm text-gray-600 mb-3">
                  <MapPinIcon className="h-4 w-4 mr-2" />
                  <span>{nextEvent.location}</span>
                </div>
              )}
              
              {/* Date (if not today) */}
              {(() => {
                const eventDate = nextEvent.date.includes('Aug') 
                  ? new Date(2025, 7, parseInt(nextEvent.date.replace('Aug ', '')))
                  : new Date(nextEvent.date);
                const today = new Date();
                
                return eventDate.toDateString() !== today.toDateString() && (
                  <div className="text-sm text-gray-500 mb-3">
                    {eventDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                );
              })()}
              
              {/* Check-in Status */}
              <div className="mt-4">
                {isEventCheckedIn ? (
                  <div className="flex items-center text-green-600 text-sm">
                    <CheckIcon className="h-4 w-4 mr-2" />
                    <span>Checked in</span>
                  </div>
                ) : canCheckIn ? (
                  <button
                    onClick={() => handleCheckIn(nextEvent)}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Check In
                  </button>
                ) : (
                  <div className="text-sm text-gray-500">
                    {(() => {
                      const eventDate = nextEvent.date.includes('Aug') 
                        ? new Date(2025, 7, parseInt(nextEvent.date.replace('Aug ', '')))
                        : new Date(nextEvent.date);
                      const today = new Date();
                      
                      if (eventDate.toDateString() === today.toDateString()) {
                        return <span>Check-in available at start time</span>;
                      } else {
                        return <span>Event is {eventDate > today ? 'upcoming' : 'scheduled'}</span>;
                      }
                    })()}
                  </div>
                )}
              </div>
            </div>
            
            {/* Leader Info */}
            {leaderData && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Your Assignment</h4>
                <p className="text-sm text-blue-700">
                  {leaderData.leader_name}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {leaderData.total_events} events • {leaderData.total_hours} hours total
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <ClockIcon className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-gray-500">No upcoming events</p>
          </div>
        )}
        
        {/* Current Time */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Current time: {currentTime.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })}
          </p>
        </div>
      </div>
      
      {/* Image Space - 30% of sidebar height */}
      <div className="w-full bg-gray-50 border-t border-gray-200" style={{ height: '30%', minHeight: '200px' }}>
        <div className="h-full flex items-center justify-center p-4">
          <img 
            src="/sidebar-image.png" 
            alt="Trinity College"
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          {/* Fallback when image is not available */}
          <div className="text-center text-gray-400 hidden flex-col items-center justify-center h-full">
            <div className="text-2xl mb-2">🏛️</div>
            <div className="text-sm font-medium">Trinity College</div>
            <div className="text-xs">Image Space</div>
            <div className="text-xs mt-2 text-gray-300">Add sidebar-image.png to public folder</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventSidebar;
