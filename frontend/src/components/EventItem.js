import React, { useState, useEffect } from 'react';
import { timeToGridRow, calculateDuration, getEventColumn, getEventColorClass } from '../utils/dateUtils';
import { apiService } from '../services/api';

const EventItem = ({ event, index, isMobile = false, column = null, dayViewMode = false }) => {
  const [eventLeaders, setEventLeaders] = useState(null);
  const [loadingLeaders, setLoadingLeaders] = useState(false);
  
  const startRow = timeToGridRow(event.start_time);
  const duration = calculateDuration(event.start_time, event.end_time);
  const eventColumn = column || (dayViewMode ? 1 : getEventColumn(event.date));
  const colorClass = getEventColorClass(index);

  // Calculate how many leaders we can show based on card height
  const getMaxLeaders = () => {
    // Each leader takes about 1.5rem (24px), header takes about 5rem (80px)
    // Available space = (duration * 3.5rem) - 5rem for header content
    const cardHeight = duration * 56; // 3.5rem = 56px
    const headerHeight = 80; // Approximate height for title, time, location, leader count
    const availableHeight = cardHeight - headerHeight;
    const leaderItemHeight = 28; // Height per leader item including spacing
    
    return Math.max(1, Math.floor(availableHeight / leaderItemHeight));
  };

  // Fetch event leaders
  useEffect(() => {
    const eventName = event.event_name || event.Event;
    if (eventName) {
      setLoadingLeaders(true);
      apiService.getEventLeaders(eventName)
        .then(data => {
          setEventLeaders(data);
        })
        .catch(error => {
          console.error('Failed to fetch event leaders:', error);
          setEventLeaders(null);
        })
        .finally(() => {
          setLoadingLeaders(false);
        });
    }
  }, [event]);

  console.log('🎯 Rendering event:', {
    event: event.event_name,
    date: event.date,
    startRow,
    duration,
    column: eventColumn,
    startTime: event.start_time,
    endTime: event.end_time,
    isMobile,
    dayViewMode
  });

  const baseClasses = "relative mt-px flex";
  
  // Use inline styles for grid positioning since Tailwind classes might not be compiled
  const gridStyle = {
    gridRow: `${startRow} / span ${duration}`,
    gridColumn: isMobile ? 1 : eventColumn
  };

  const leaderCount = eventLeaders?.total_leaders || 0;
  const maxLeaders = getMaxLeaders();
  const shouldTruncate = eventLeaders?.leaders && eventLeaders.leaders.length > maxLeaders;

  return (
    <li
      style={gridStyle}
      className={baseClasses}
    >
      <div className={`group absolute inset-1 flex flex-col overflow-hidden rounded-lg p-2 text-sm hover:shadow-lg transition-shadow ${colorClass}`}>
        <p className="font-semibold text-base mb-1">{event.event_name}</p>
        
        <p className="group-hover:opacity-80 text-sm mb-1">
          <time dateTime={`${event.date}T${event.start_time}`}>
            {isMobile ? `${event.start_time} - ${event.end_time}` : event.start_time}
          </time>
        </p>
        
        {event.location && (
          <p className="text-sm opacity-75 mb-2">{event.location}</p>
        )}
        
        {/* Leaders display */}
        {loadingLeaders ? (
          <div className="flex items-center mt-1">
            <div className="animate-spin rounded-full h-4 w-4 border border-white/50 border-t-white mr-2"></div>
            <span className="text-sm opacity-75">Loading...</span>
          </div>
        ) : eventLeaders && eventLeaders.leaders && eventLeaders.leaders.length > 0 ? (
          <div className="mt-1 flex-1">
            {/* Leader count */}
            <div className="flex items-center mb-2">
              <svg className="h-4 w-4 mr-1 opacity-75" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
              </svg>
              <span className="text-sm opacity-75 font-medium">{leaderCount} leader{leaderCount !== 1 ? 's' : ''}</span>
            </div>
            
            {/* Leader names - smart truncation based on card size */}
            <div className="space-y-1 flex-1 overflow-hidden">
              {(shouldTruncate ? eventLeaders.leaders.slice(0, maxLeaders) : eventLeaders.leaders).map((leader, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <div className="flex-shrink-0 w-5 h-5 bg-white/30 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium">
                      {leader.first_name ? leader.first_name[0].toUpperCase() : leader.name[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="truncate opacity-90">{leader.name}</span>
                </div>
              ))}
              {shouldTruncate && (
                <div className="text-sm opacity-75 font-medium">
                  +{eventLeaders.leaders.length - maxLeaders} more
                </div>
              )}
            </div>
          </div>
        ) : leaderCount === 0 ? (
          <div className="flex items-center mt-1">
            <svg className="h-4 w-4 mr-1 opacity-50" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm opacity-50">No leaders assigned</span>
          </div>
        ) : null}
      </div>
    </li>
  );
};

export default EventItem;
