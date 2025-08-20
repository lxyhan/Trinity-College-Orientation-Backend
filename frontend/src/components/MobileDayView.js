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

      {/* Mobile events with proper time-based grid */}
      <div className="sm:hidden relative">
        {/* Time grid background for mobile */}
        <div className="absolute inset-0 flex">
          <div className="w-14 flex-none bg-white" />
          <div className="flex-auto">
            <div 
              style={{ gridTemplateRows: 'repeat(60, minmax(3.5rem, 1fr))' }}
              className="grid divide-y divide-gray-100 min-h-full"
            >
              <div className="row-end-1 h-7" />
              {Array.from({ length: 15 }, (_, hour) => {
                const displayHour = hour + 8; // 8am-11pm
                const hourLabel = displayHour === 12 ? '12PM' : 
                                 displayHour < 12 ? `${displayHour}AM` : 
                                 `${displayHour - 12}PM`;
                return [
                  <div key={`mobile-${hour}-label`}>
                    <div className="absolute left-0 -mt-2.5 w-14 pr-2 text-right text-xs text-gray-400">
                      {hourLabel}
                    </div>
                  </div>,
                  <div key={`mobile-${hour}-quarter1`} />,
                  <div key={`mobile-${hour}-half`} />,
                  <div key={`mobile-${hour}-quarter3`} />
                ];
              }).flat()}
            </div>
          </div>
        </div>
        
        {/* Events positioned on the grid */}
        <div className="relative">
          <div className="flex">
            <div className="w-14 flex-none" />
            <div className="flex-auto">
              <ol
                style={{ gridTemplateRows: '1.75rem repeat(60, minmax(0, 1fr)) auto' }}
                className="grid grid-cols-1"
              >
                {mobileEvents.map((event, index) => (
                  <EventItem
                    key={`mobile-${index}`}
                    event={event}
                    index={index}
                    isMobile={true}
                  />
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileDayView;
