import React from 'react';
import EventItem from './EventItem';
import { getMobileEvents } from '../utils/dateUtils';

const MobileDayView = ({ 
  filteredEvents, 
  selectedMobileDay, 
  setSelectedMobileDay, 
  weekDates,
  onEventClick
}) => {
  const today = new Date();
  const mobileEvents = getMobileEvents(filteredEvents, selectedMobileDay, weekDates);

  return (
    <>
      {/* Mobile header with day switcher */}
      <div className="grid grid-cols-7 text-sm/6 text-gray-500 sm:hidden">
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

      {/* Mobile events */}
      <div className="sm:hidden">
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
