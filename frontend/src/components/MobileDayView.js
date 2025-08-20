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
    <>
      {/* Mobile header with day switcher and sidebar toggle */}
      <div className="sm:hidden">
        {/* Top bar with sidebar toggle */}
        <div className="px-4 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {weekDates[selectedMobileDay]?.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'short', 
                  day: 'numeric' 
                })}
              </h1>
              <div className="flex items-center space-x-4 mt-1">
                <p className="text-sm text-gray-500 truncate">
                  {leaderData?.leader_name || userName}
                </p>
                {leaderData && (
                  <p className="text-xs text-blue-600 flex-shrink-0">
                    {leaderData.total_events} events • {leaderData.total_hours}h
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onSidebarToggle}
              className="ml-3 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 flex-shrink-0"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        {/* Day switcher */}
        <div className="grid grid-cols-7 text-sm/6 text-gray-500 border-b border-gray-100">
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
      </div>

      {/* Mobile events - simplified list with time labels */}
      <div className="sm:hidden">
        <div className="space-y-1 p-4">
          {mobileEvents.length > 0 ? (
            mobileEvents
              .sort((a, b) => {
                // Sort by start time
                const timeA = a.start_time || a['Start Time'] || '';
                const timeB = b.start_time || b['Start Time'] || '';
                return timeA.localeCompare(timeB);
              })
              .map((event, index) => (
                <div key={`mobile-event-${index}`} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-3">
                  {/* Event header with time */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-base truncate">
                        {event.event_name || event.Event}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {event.start_time || event['Start Time']} - {event.end_time || event['End Time']}
                      </p>
                    </div>
                    <div className={`flex-shrink-0 w-3 h-3 rounded-full ml-3 mt-1`} 
                         style={{ backgroundColor: event.is_meal ? '#f59e0b' : '#10b981' }} />
                  </div>
                  
                  {/* Location */}
                  {event.location && (
                    <p className="text-sm text-gray-500 mb-2">
                      📍 {event.location}
                    </p>
                  )}
                  
                  {/* Event type indicator */}
                  {event.is_meal && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Meal Event
                    </span>
                  )}
                  
                  {/* Staffing info for non-meal events */}
                  {!event.is_meal && event.staffing && (
                    <div className="mt-2 text-xs text-gray-600">
                      <span className="font-medium">Staffing:</span> {event.staffing.leadersAssigned}/{event.staffing.leadersNeeded} leaders 
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
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
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">📅</div>
              <p className="text-gray-500">No events scheduled for this day</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MobileDayView;
