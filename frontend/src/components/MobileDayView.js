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
        {/* Top bar with sidebar toggle - single row */}
        <div className="px-4 py-2 border-b border-gray-200 bg-white">
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
    </>
  );
};

export default MobileDayView;
