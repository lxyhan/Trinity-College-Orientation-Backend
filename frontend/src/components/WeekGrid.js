import React from 'react';
import EventItem from './EventItem';
import MobileDayView from './MobileDayView';
import EventModal from './EventModal';

const WeekGrid = ({ 
  weekDates, 
  filteredEvents, 
  events,
  selectedMobileDay, 
  setSelectedMobileDay,
  viewMode = 'week',
  onSidebarToggle,
  leaderData,
  userName
}) => {
  const today = new Date();

  return (
    <div className="isolate flex flex-auto flex-col overflow-auto bg-white">
      <div className="flex max-w-full flex-none flex-col sm:max-w-none md:max-w-full" style={{ width: viewMode === 'week' ? '165%' : '100%' }}>
        {/* Week header */}
        <div className="sticky top-0 z-30 flex-none bg-white shadow ring-1 ring-black/5 sm:pr-8">
          <MobileDayView
            filteredEvents={filteredEvents}
            selectedMobileDay={selectedMobileDay}
            setSelectedMobileDay={setSelectedMobileDay}
            weekDates={weekDates}
            onSidebarToggle={onSidebarToggle}
            leaderData={leaderData}
            userName={userName}
          />

          {/* Desktop header */}
          <div className={`-mr-px hidden divide-x divide-gray-100 border-r border-gray-100 text-sm/6 text-gray-500 sm:grid ${
            viewMode === 'day' ? 'grid-cols-1' : 'grid-cols-7'
          }`}>
            <div className="col-end-1 w-14" />
            {(viewMode === 'day' ? [weekDates[selectedMobileDay]] : weekDates).map((date, index) => {
              if (!date) return null;
              const isToday = date.toDateString() === today.toDateString();
              const actualIndex = viewMode === 'day' ? selectedMobileDay : index;
              return (
                <div 
                  key={actualIndex} 
                  className={`flex items-center justify-center py-3 ${
                    viewMode === 'day' ? 'cursor-pointer hover:bg-gray-50' : ''
                  }`}
                  onClick={viewMode === 'day' ? () => {
                    // Cycle through days when in day view
                    const nextDay = (selectedMobileDay + 1) % weekDates.length;
                    setSelectedMobileDay(nextDay);
                  } : undefined}
                >
                  <span className={isToday ? "flex items-baseline" : ""}>
                    {date.toLocaleDateString('en-US', { weekday: viewMode === 'day' ? 'long' : 'short' })}
                    <span className={`ml-1.5 items-center justify-center font-semibold ${
                      isToday 
                        ? 'flex size-8 rounded-full bg-indigo-600 text-white' 
                        : 'text-gray-900'
                    }`}>
                      {date.getDate()}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-auto">
          <div className="sticky left-0 z-10 w-14 flex-none bg-white ring-1 ring-gray-100" />
          <div className="grid flex-auto grid-cols-1 grid-rows-1">
            {/* Time grid - 8am to 11pm */}
            <div
              style={{ gridTemplateRows: 'repeat(60, minmax(3.5rem, 1fr))' }}
              className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100"
            >
              <div className="row-end-1 h-7" />
              {Array.from({ length: 15 }, (_, hour) => { // 15 hours: 8am-11pm
                const displayHour = hour + 8; // 8, 9, 10, ..., 22
                const hourLabel = displayHour === 12 ? '12PM' : 
                                 displayHour < 12 ? `${displayHour}AM` : 
                                 `${displayHour - 12}PM`;
                return [
                  <div key={`${hour}-label`}>
                    <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">
                      {hourLabel}
                    </div>
                  </div>,
                  <div key={`${hour}-quarter1`} />,
                  <div key={`${hour}-half`} />,
                  <div key={`${hour}-quarter3`} />
                ];
              }).flat()}
            </div>

            {/* Vertical grid lines */}
            <div className={`col-start-1 col-end-2 row-start-1 hidden grid-rows-1 divide-x divide-gray-100 sm:grid ${
              viewMode === 'day' ? 'sm:grid-cols-1' : 'sm:grid-cols-7'
            }`}>
              {Array.from({ length: viewMode === 'day' ? 1 : 8 }, (_, i) => (
                <div key={i} className={`col-start-${i + 1} row-span-full ${i === (viewMode === 'day' ? 0 : 7) ? 'w-8' : ''}`} />
              ))}
            </div>

            {/* Events */}
            <ol
              style={{ gridTemplateRows: '1.75rem repeat(60, minmax(0, 1fr)) auto' }}
              className={`col-start-1 col-end-2 row-start-1 grid grid-cols-1 sm:pr-8 ${
                viewMode === 'day' ? 'sm:grid-cols-1' : 'sm:grid-cols-7'
              }`}
            >
              {/* Desktop: Show events based on view mode */}
              <div className="hidden sm:contents">
                {(viewMode === 'day' 
                  ? filteredEvents.filter(event => {
                      // Handle "Aug 25" format for day filtering
                      if (event.date.includes('Aug')) {
                        const eventDay = parseInt(event.date.replace('Aug ', ''));
                        const selectedDate = weekDates[selectedMobileDay];
                        return selectedDate && eventDay === selectedDate.getDate();
                      }
                      return false;
                    })
                  : filteredEvents
                ).map((event, index) => (
                  <EventItem
                    key={`desktop-${index}`}
                    event={event}
                    index={index}
                    isMobile={false}
                    dayViewMode={viewMode === 'day'}
                  />
                ))}
              </div>
              
              {/* Debug info */}
              <li className="col-start-1 row-start-1 p-2 text-xs text-gray-500">
                📊 Debug: {filteredEvents.length} events loaded, {events.length} total events
                <span className="sm:hidden"> | Selected day: {weekDates[selectedMobileDay]?.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekGrid;
