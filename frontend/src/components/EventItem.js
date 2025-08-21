import React, { useState, useEffect, useMemo } from 'react';
import { timeToGridRow, calculateDuration, getEventColumn, getEventColorClass, getEventBackgroundColor } from '../utils/dateUtils';
import { apiService } from '../services/api';

const EventItem = ({ event, index, isMobile = false, column = null, dayViewMode = false }) => {
  const [eventLeaders, setEventLeaders] = useState(null);
  const [loadingLeaders, setLoadingLeaders] = useState(false);
  
  // Calculate grid positioning
  const startRow = timeToGridRow(event.start_time);
  const duration = calculateDuration(event.start_time, event.end_time);
  const eventColumn = column || (dayViewMode ? 1 : getEventColumn(event.date));
  const colorClass = getEventColorClass(event);
  const backgroundColor = getEventBackgroundColor(event);

  // Memoize card dimensions for performance
  const cardDimensions = useMemo(() => {
    const GRID_ROW_HEIGHT = 56; // 3.5rem in pixels
    const CARD_PADDING = 12; // p-1.5 = 6px * 2 (reduced from 16px)
    const EVENT_NAME_HEIGHT = 18; // text-sm event name (reduced)
    const STATUS_BADGE_HEIGHT = 16; // text-xs status badge (reduced)
    const TIME_HEIGHT = 16; // text-xs time (reduced)
    const LOCATION_HEIGHT = event.location ? 14 : 0; // text-xs location (reduced)
    const STAFFING_INFO_HEIGHT = event.staffing ? 14 : 0; // text-xs staffing
    const LEADER_COUNT_HEIGHT = 18; // Leader count with smaller icon (reduced)
    const LEADER_ITEM_HEIGHT = 20; // Each leader item (significantly reduced)
    const TRUNCATION_INDICATOR_HEIGHT = 20; // "+X more" indicator (reduced)
    const SPACING = 8; // Total spacing between elements (reduced)
    const BUFFER = 4; // Minimal safety buffer

    const totalCardHeight = duration * GRID_ROW_HEIGHT;
    const usedHeight = CARD_PADDING + EVENT_NAME_HEIGHT + STATUS_BADGE_HEIGHT + 
                     TIME_HEIGHT + LOCATION_HEIGHT + STAFFING_INFO_HEIGHT + 
                     LEADER_COUNT_HEIGHT + SPACING + BUFFER;
    const availableForLeaders = Math.max(0, totalCardHeight - usedHeight);

    // Calculate how many leaders can fit
    let maxLeaders = Math.floor(availableForLeaders / LEADER_ITEM_HEIGHT);
    
    // If we need truncation indicator, reserve space for it
    const totalLeaders = eventLeaders?.leaders?.length || 0;
    if (totalLeaders > maxLeaders && maxLeaders > 0) {
      const spaceWithIndicator = availableForLeaders - TRUNCATION_INDICATOR_HEIGHT;
      maxLeaders = Math.floor(spaceWithIndicator / LEADER_ITEM_HEIGHT);
    }

    return {
      totalHeight: totalCardHeight,
      availableForLeaders,
      maxLeaders: Math.max(0, maxLeaders),
      canShowAny: availableForLeaders >= LEADER_ITEM_HEIGHT
    };
  }, [duration, event.location, event.staffing, eventLeaders?.leaders?.length]);

  // Staffing status configuration (subtle, no emojis)
  const getStatusInfo = (staffing, isMeal = false) => {
    // Special handling for meal events
    if (isMeal) {
      return {
        color: 'bg-orange-100',
        textColor: 'text-orange-800',
        text: 'Meal'
      };
    }
    
    const statusConfig = {
      fully_staffed: { 
        color: 'bg-green-100', 
        textColor: 'text-green-800', 
        text: 'Fully Staffed' 
      },
      good: { 
        color: 'bg-blue-100', 
        textColor: 'text-blue-800', 
        text: 'Well Staffed' 
      },
      understaffed: { 
        color: 'bg-yellow-100', 
        textColor: 'text-yellow-800', 
        text: 'Understaffed' 
      },
      critical: { 
        color: 'bg-red-100', 
        textColor: 'text-red-800', 
        text: 'Critical' 
      },
      unknown: { 
        color: 'bg-gray-100', 
        textColor: 'text-gray-800', 
        text: 'Unknown' 
      }
    };
    
    return statusConfig[staffing?.status] || statusConfig.unknown;
  };

  // Fetch event leaders (skip for meal events as they show eligibility instead)
  useEffect(() => {
    const eventName = event.event_name || event.Event;
    if (!eventName || event.is_meal) return;

    setLoadingLeaders(true);
    
    apiService.getEventLeaders(eventName)
      .then(data => setEventLeaders(data))
      .catch(error => {
        console.error('Failed to fetch event leaders:', error);
        setEventLeaders(null);
      })
      .finally(() => setLoadingLeaders(false));
  }, [event]);

  // Leaders display logic - dynamic limit based on event size and available space
  const leadersDisplay = useMemo(() => {
    if (!eventLeaders?.leaders) {
      return { showLeaders: [], hasMore: false, totalCount: 0 };
    }

    const leaders = eventLeaders.leaders;
    
    // Calculate how many leaders we can show based on event duration and mobile status
    let maxShow;
    if (isMobile) {
      // Mobile: Show more leaders since we have more space
      maxShow = Math.min(leaders.length, 8);
    } else {
      // Desktop: Base on event duration for available space
      if (duration >= 3) {
        maxShow = Math.min(leaders.length, 6); // Long events: up to 6 leaders
      } else if (duration >= 2) {
        maxShow = Math.min(leaders.length, 4); // Medium events: up to 4 leaders  
      } else {
        maxShow = Math.min(leaders.length, 3); // Short events: up to 3 leaders
      }
    }
    
    return {
      showLeaders: leaders.slice(0, maxShow),
      hasMore: leaders.length > maxShow,
      totalCount: leaders.length,
      hiddenCount: Math.max(0, leaders.length - maxShow)
    };
  }, [eventLeaders?.leaders, duration, isMobile]);

  const statusInfo = getStatusInfo(event.staffing, event.is_meal);
  const leaderCount = eventLeaders?.total_leaders || 0;

  // Styling
  const gridStyle = {
    gridRow: `${startRow} / span ${duration}`,
    gridColumn: isMobile ? 1 : eventColumn
  };

  return (
    <li style={gridStyle} className="relative mt-px flex">
      <div 
        className={`
          group absolute inset-1 flex flex-col overflow-hidden rounded-lg p-1.5 text-xs 
          hover:shadow-lg transition-shadow ${colorClass}
        `}
        style={{ backgroundColor }}
      >
        
        {/* Event Name */}
        <div className="mb-1 flex-shrink-0">
          <span className="font-semibold text-sm truncate block">
            {event.event_name}
          </span>
          {event.staffing?.eventType && (
            <span className="text-xs opacity-70 block">
              {event.staffing.eventType}
            </span>
          )}
        </div>
        
        {/* Status Badge - Removed for cleaner look */}
        
        {/* Time */}
        <p className="group-hover:opacity-80 text-xs mb-1 flex-shrink-0">
          <time dateTime={`${event.date}T${event.start_time}`}>
            {isMobile 
              ? `${event.start_time} - ${event.end_time}` 
              : event.start_time
            }
          </time>
        </p>
        
        {/* Location */}
        {event.location && (
          <p className="text-xs opacity-75 mb-1 flex-shrink-0 truncate">
            {event.location}
          </p>
        )}

         {/* Staffing Info - Show for non-meal events only */}
         {!event.is_meal && event.staffing && (
           <div className="text-xs opacity-75 mb-1 flex-shrink-0">
             {event.staffing.leadersAssigned}/{event.staffing.leadersNeeded} leaders 
             ({event.staffing.staffingPercentage}%)
           </div>
         )}
         
         {/* Leaders Section - Only show for non-meal events */}
         {!event.is_meal && (
           <div className="flex-1 min-h-0 overflow-hidden">
             {loadingLeaders ? (
               <LoadingIndicator />
             ) : leadersDisplay.totalCount > 0 ? (
               <LeadersList 
                 leaders={leadersDisplay.showLeaders}
                 totalCount={leaderCount}
                 hasMore={leadersDisplay.hasMore}
                 hiddenCount={leadersDisplay.hiddenCount}
               />
             ) : leaderCount === 0 ? (
               <UnassignedIndicator />
             ) : null}
           </div>
         )}
         

        
      </div>
    </li>
  );
};

// Optimized sub-components
const LoadingIndicator = React.memo(() => (
  <div className="flex items-center">
    <div className="animate-spin rounded-full h-3 w-3 border border-white/50 border-t-white mr-1.5" />
    <span className="text-xs opacity-75">Loading...</span>
  </div>
));
LoadingIndicator.displayName = 'LoadingIndicator';

const LeadersList = React.memo(({ leaders, totalCount, hasMore, hiddenCount }) => (
  <>
    {/* Leader Count */}
    <div className="flex items-center mb-1 flex-shrink-0">
      <svg className="h-3 w-3 mr-1 opacity-75" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-xs opacity-90 font-medium">
        {totalCount} assigned
      </span>
    </div>
    
    {/* Leader Items */}
    <div className="space-y-0.5 overflow-hidden">
      {leaders.map((leader, idx) => (
        <LeaderItem key={`${leader.name || leader.first_name}-${idx}`} leader={leader} />
      ))}
      
      {hasMore && (
        <div className="flex items-center space-x-1.5 text-xs opacity-75">
          <div className="flex-shrink-0 w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-xs">⋯</span>
          </div>
          <span className="font-medium">
            +{hiddenCount} more
          </span>
        </div>
      )}
    </div>
  </>
));
LeadersList.displayName = 'LeadersList';

const LeaderItem = React.memo(({ leader }) => {
  const displayName = leader.first_name && leader.last_name 
    ? `${leader.first_name} ${leader.last_name[0]}.`
    : leader.name;
    
  const initial = leader.first_name 
    ? leader.first_name[0].toUpperCase()
    : leader.name[0].toUpperCase();

  return (
    <div className="flex items-center space-x-1.5 text-xs min-w-0">
      <div className="flex-shrink-0 w-4 h-4 bg-white/30 rounded-full flex items-center justify-center">
        <span className="text-xs font-semibold">{initial}</span>
      </div>
      <span className="truncate opacity-90 font-medium min-w-0">
        {displayName}
      </span>
    </div>
  );
});
LeaderItem.displayName = 'LeaderItem';

const UnassignedIndicator = React.memo(() => (
  <div className="flex items-center">
    <svg className="h-4 w-4 mr-1 opacity-50" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
    </svg>
    <span className="text-sm opacity-50">Unassigned</span>
  </div>
));
UnassignedIndicator.displayName = 'UnassignedIndicator';

export default EventItem;