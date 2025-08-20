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
  onSidebarToggle
}) => {
  const today = new Date();
  const mobileEvents = getMobileEvents(filteredEvents, selectedMobileDay, weekDates);

  return (
    <>
      {/* Mobile header with day switcher and sidebar toggle */}
      <div className="sm:hidden">
        {/* Top bar with sidebar toggle */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900">
            {weekDates[selectedMobileDay]?.toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'short', 
              day: 'numeric' 
            })}
          </h1>
          <button
            onClick={onSidebarToggle}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
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

      {/* Mobile events */}
      <div className="sm:hidden px-4 py-2">
        {mobileEvents.map((event, index) => (
          <EventItem
            key={`mobile-${index}`}
            event={event}
            index={index}
            isMobile={true}
          />
        ))}
      </div>
    </>
  );
};

export default MobileDayView;
