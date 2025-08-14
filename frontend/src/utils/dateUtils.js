/**
 * Convert time string to grid row position (8am-11pm = 15 hours)
 */
export const timeToGridRow = (timeString) => {
  // Handle both "9:00pm" and "9:00 PM" formats
  const normalizedTime = timeString.replace(/([ap])m/i, ' $1M').toUpperCase();
  const [time, period] = normalizedTime.split(' ');
  const [hours, minutes = 0] = time.split(':').map(Number);
  let hour24 = hours;
  
  if (period === 'PM' && hours !== 12) hour24 += 12;
  if (period === 'AM' && hours === 12) hour24 = 0;
  
  // Clamp to 8am-11pm range (8-23 hours)
  if (hour24 < 8) hour24 = 8;
  if (hour24 > 23) hour24 = 23;
  
  // Convert to grid position: 8am = row 2, each hour has 4 rows (15-minute intervals)
  const relativeHour = hour24 - 8; // 0-15 (8am-11pm)
  return Math.floor(relativeHour * 4 + (minutes / 15)) + 2;
};

/**
 * Calculate event duration in grid rows
 */
export const calculateDuration = (startTime, endTime) => {
  const startRow = timeToGridRow(startTime);
  const endRow = timeToGridRow(endTime);
  return Math.max(endRow - startRow, 6); // Minimum 6 rows (30 minutes)
};

/**
 * Get day of week column for Monday-first week (1 = Monday, 7 = Sunday)
 * Time labels are positioned separately with flexbox, not part of the grid
 */
export const getEventColumn = (eventDate) => {
  // Handle "Aug 25" format - convert to actual date
  if (eventDate.includes('Aug')) {
    const dayNum = parseInt(eventDate.replace('Aug ', ''));
    
    // Map to our fixed week: Aug 25=Monday, Aug 26=Tuesday, ..., Aug 31=Sunday
    // The grid only contains day columns (no time column in grid)
    const baseDay = 25; // Aug 25 is our Monday
    const column = dayNum - baseDay + 1; // Aug 25->1, Aug 26->2, ..., Aug 31->7
    
    return Math.max(1, Math.min(7, column)); // Clamp to 1-7
  }
  
  return 1; // Default to first day column (Monday)
};

/**
 * Get array of dates for the specific orientation week (Mon Aug 25 - Sun Aug 31, 2025)
 */
export const getWeekDates = (currentDate) => {
  // Fixed orientation week: Monday Aug 25 to Sunday Aug 31, 2025
  const startOfWeek = new Date(2025, 7, 25); // August 25, 2025 (month is 0-indexed)
  
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });
};

/**
 * Filter events for a specific date range
 */
export const filterEventsForDate = (eventsData) => {
  console.log('🔍 Filtering events for fixed week Aug 25-31, 2025');
  console.log('🔍 Available events:', eventsData);
  
  // All events should show since we're locked to their week
  const filtered = eventsData.filter(event => {
    const eventDate = event.date;
    console.log('🔍 Including event:', eventDate);
    
    // Since we're locked to events week, include all Aug events
    return eventDate.includes('Aug');
  });
  
  console.log('🔍 Filtered events:', filtered);
  return filtered;
};

/**
 * Filter events for mobile day view
 */
export const getMobileEvents = (filteredEvents, selectedMobileDay, weekDates) => {
  const selectedDate = weekDates[selectedMobileDay];
  const targetDay = selectedDate.getDate();
  
  return filteredEvents.filter(event => {
    if (event.date.includes('Aug')) {
      const eventDay = parseInt(event.date.replace('Aug ', ''));
      return eventDay === targetDay;
    }
    return false;
  });
};

/**
 * Generate color class for events based on index
 */
export const getEventColorClass = (index) => {
  const colors = [
    'bg-blue-50 text-blue-700 hover:bg-blue-100',
    'bg-pink-50 text-pink-700 hover:bg-pink-100',
    'bg-green-50 text-green-700 hover:bg-green-100',
    'bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
    'bg-purple-50 text-purple-700 hover:bg-purple-100',
  ];
  return colors[index % colors.length];
};
