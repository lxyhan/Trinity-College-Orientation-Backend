import React from 'react';
import EventItem from './EventItem';
import { getMobileEvents } from '../utils/dateUtils';
import { Bars3Icon } from '@heroicons/react/24/outline';

const MobileDayView = ({ 
  filteredEvents, 
  selectedMobileDay, 
  setSelectedMobileDay, 
  weekDates,
  onEventClick,
  onSidebarToggle,
  leaderData,
  userName
}) => {
  const today = new Date();
  const mobileEvents = getMobileEvents(filteredEvents, selectedMobileDay, weekDates);

  return (
    <div className="flex flex-col h-full">
      {/* Top bar with sidebar toggle - single row */}
      <div className="px-4 py-2 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-semibold text-gray-900 truncate">
                {weekDates[selectedMobileDay]?.toLocaleDateString('en-US', { 
                  weekday: 'short',
                  month: 'short', 
                  day: 'numeric' 
                })}
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-gray-500 truncate max-w-20">
                {(leaderData?.leader_name || userName)?.split(' ')[0]}
              </span>
              {leaderData && (
                <span className="text-xs text-blue-600 whitespace-nowrap">
                  {leaderData.total_events}e
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onSidebarToggle}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 flex-shrink-0"
            aria-label="Open sidebar"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Day switcher */}
      <div className="grid grid-cols-7 text-sm/6 text-gray-500 border-b border-gray-100 flex-shrink-0">
      {weekDates.map((date, index) => {
        const isToday = date.toDateString() === today.toDateString();
        const isSelected = index === selectedMobileDay;
        return (
          <button 
            key={index} 
            type="button" 
            onClick={() => setSelectedMobileDay(index)}
            className="flex flex-col items-center pb-3 pt-2"
          >
            {date.toLocaleDateString('en-US', { weekday: 'narrow' })}
            <span className={`mt-1 flex size-8 items-center justify-center font-semibold ${
              isSelected 
                ? 'rounded-full bg-indigo-600 text-white' 
                : isToday
                ? 'rounded-full bg-gray-200 text-gray-900'
                : 'text-gray-900'
            }`}>
              {date.getDate()}
            </span>
          </button>
        );
      })}
      </div>

      {/* Mobile events - simple card layout */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-4 pb-8">
          {mobileEvents.length > 0 ? (
            mobileEvents
              .sort((a, b) => {
                // Sort by start time
                const timeA = a.start_time || a['Start Time'] || '';
                const timeB = b.start_time || b['Start Time'] || '';
                return timeA.localeCompare(timeB);
              })
              .map((event, index) => (
                <div key={`mobile-event-${index}`} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-4 last:mb-0">
                  {/* Event header with time */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-lg truncate">
                        {event.event_name || event.Event}
                      </h3>
                      <p className="text-base text-gray-600 mt-1 font-medium">
                        {event.start_time || event['Start Time']} - {event.end_time || event['End Time']}
                      </p>
                    </div>
                    <div className={`flex-shrink-0 w-4 h-4 rounded-full ml-3 mt-1`} 
                         style={{ backgroundColor: event.is_meal ? '#f59e0b' : '#10b981' }} />
                  </div>
                  
                  {/* Location */}
                  {event.location && (
                    <p className="text-sm text-gray-600 mb-3 flex items-center">
                      <span className="mr-2">📍</span>
                      {event.location}
                    </p>
                  )}
                  
                  {/* Event type indicator */}
                  {event.is_meal && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                      Meal Event
                    </span>
                  )}
                  
                  {/* Staffing info for non-meal events */}
                  {!event.is_meal && event.staffing && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Staffing:</span> {event.staffing.leadersAssigned}/{event.staffing.leadersNeeded} leaders
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                        event.staffing.status === 'fully_staffed' ? 'bg-green-100 text-green-800' :
                        event.staffing.status === 'good' ? 'bg-blue-100 text-blue-800' :
                        event.staffing.status === 'understaffed' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {event.staffing.status === 'fully_staffed' ? 'Fully Staffed' :
                         event.staffing.status === 'good' ? 'Well Staffed' :
                         event.staffing.status === 'understaffed' ? 'Understaffed' :
                         'Critical'}
                      </span>
                    </div>
                  )}
                </div>
              ))
          ) : (
            <div className="text-center py-16">
              <div className="text-gray-400 text-2xl mb-3">📅</div>
              <p className="text-gray-500 text-lg">No events scheduled</p>
              <p className="text-gray-400 text-sm mt-1">for this day</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileDayView;
