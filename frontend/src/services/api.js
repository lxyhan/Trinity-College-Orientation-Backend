const API_BASE_URL = 'http://localhost:8000';

export const apiService = {
  // Fetch all events
  async getEvents() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/events`);
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      return data.events;
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  },

  // Fetch leader assignments
  async getLeaderAssignments(leaderEmail = null) {
    try {
      const url = leaderEmail 
        ? `${API_BASE_URL}/api/leader-assignments?leader_email=${encodeURIComponent(leaderEmail)}`
        : `${API_BASE_URL}/api/leader-assignments`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch leader assignments');
      const data = await response.json();
      return data.assignments;
    } catch (error) {
      console.error('Error fetching leader assignments:', error);
      return [];
    }
  },

  // Look up leader by name
  async lookupLeader(leaderName) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/lookup/${encodeURIComponent(leaderName)}`);
      if (!response.ok) throw new Error('Failed to lookup leader');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error looking up leader:', error);
      return null;
    }
  },

  // Get event staffing information
  async getEventStaffing() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/event-staffing`);
      if (!response.ok) throw new Error('Failed to fetch event staffing');
      const data = await response.json();
      return data.events;
    } catch (error) {
      console.error('Error fetching event staffing:', error);
      return [];
    }
  },

  // Get events with enriched staffing data
  async getEventsWithStaffing() {
    try {
      const [events, staffingData] = await Promise.all([
        this.getEvents(),
        this.getEventStaffing()
      ]);

      // Create a map of event names to staffing data for quick lookup
      const staffingMap = new Map();
      staffingData.forEach(staffingEvent => {
        staffingMap.set(staffingEvent.Event, staffingEvent);
      });

      // Enrich events with staffing data
      const enrichedEvents = events.map(event => {
        const eventName = event.Event;
        const staffing = staffingMap.get(eventName);
        
        return {
          ...event,
          staffing: staffing ? {
            leadersNeeded: staffing['Leaders Needed'],
            leadersAssigned: staffing['Leaders Assigned'],
            staffingPercentage: staffing['Staffing Percentage'],
            fullyStaffed: staffing['Fully Staffed'],
            eventType: staffing['Event Type'], // Contains emoji indicators
            status: this.getStaffingStatus(staffing['Staffing Percentage'], staffing['Fully Staffed'])
          } : null
        };
      });

      return enrichedEvents;
    } catch (error) {
      console.error('Error fetching events with staffing:', error);
      return [];
    }
  },

  // Helper function to determine staffing status
  getStaffingStatus(staffingPercentage, fullyStaffed) {
    if (fullyStaffed) return 'fully_staffed';
    if (staffingPercentage < 50) return 'critical';
    if (staffingPercentage < 80) return 'understaffed';
    return 'good';
  },

  // Get summary statistics
  async getSummary() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/summary`);
      if (!response.ok) throw new Error('Failed to fetch summary');
      const data = await response.json();
      return data.summary;
    } catch (error) {
      console.error('Error fetching summary:', error);
      return [];
    }
  },

  // Get leaders for a specific event
  async getEventLeaders(eventName) {
    try {
      // Try the path parameter approach first
      const encodedEventName = encodeURIComponent(eventName);
      const url = `${API_BASE_URL}/api/event/${encodedEventName}/leaders`;
      console.log(`🔍 Fetching leaders for event: "${eventName}" -> ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`⚠️ Path parameter failed for "${eventName}": ${response.status}, trying fallback approach`);
        
        // Fallback: Use leader-assignments endpoint with event filter
        const fallbackUrl = `${API_BASE_URL}/api/leader-assignments?event=${encodeURIComponent(eventName)}`;
        console.log(`🔄 Fallback URL: ${fallbackUrl}`);
        
        const fallbackResponse = await fetch(fallbackUrl);
        if (!fallbackResponse.ok) {
          throw new Error('Both approaches failed to fetch event leaders');
        }
        
        const fallbackData = await fallbackResponse.json();
        
        // Transform the data to match the expected format
        const leaders = fallbackData.assignments.map(assignment => ({
          name: assignment['Leader Email'].split('@')[0], // Use email username as name
          first_name: assignment['Leader Email'].split('@')[0],
          last_name: '',
          email: assignment['Leader Email']
        }));
        
        // Remove duplicates by email
        const uniqueLeaders = leaders.reduce((acc, leader) => {
          if (!acc.some(l => l.email === leader.email)) {
            acc.push(leader);
          }
          return acc;
        }, []);
        
        console.log(`✅ Fallback found ${uniqueLeaders.length} unique leaders for "${eventName}"`);
        return {
          total_leaders: uniqueLeaders.length,
          leaders: uniqueLeaders,
          event_name: eventName
        };
      }
      
      const data = await response.json();
      console.log(`✅ Found ${data.total_leaders} leaders for "${eventName}"`);
      return data;
    } catch (error) {
      console.error(`❌ Error fetching event leaders for "${eventName}":`, error);
      return null;
    }
  },

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) throw new Error('Backend not healthy');
      const data = await response.json();
      return data.status === 'healthy';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
};

// Helper function to parse time strings
export const parseTime = (timeStr) => {
  if (!timeStr) return null;
  
  // Handle formats like "10:00am", "2:00pm", "10:00 AM", etc.
  const time = timeStr.toLowerCase().replace(/\s/g, '');
  let hours = parseInt(time.match(/(\d+):/)?.[1] || '0');
  const minutes = parseInt(time.match(/:(\d+)/)?.[1] || '0');
  const isPM = time.includes('pm');
  
  if (isPM && hours !== 12) hours += 12;
  if (!isPM && hours === 12) hours = 0;
  
  return { hours, minutes };
};

// Helper function to convert time to grid position
export const timeToGridPosition = (timeStr) => {
  const time = parseTime(timeStr);
  if (!time) return 0;
  
  // Convert to minutes since 6 AM (our grid starts at 6 AM)
  const totalMinutes = (time.hours * 60 + time.minutes) - (6 * 60);
  return Math.max(0, totalMinutes);
};

// Helper function to format time for display
export const formatTime = (timeStr) => {
  if (!timeStr) return '';
  
  // Convert to 12-hour format with AM/PM
  const time = parseTime(timeStr);
  if (!time) return timeStr;
  
  const { hours, minutes } = time;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const displayMinutes = minutes.toString().padStart(2, '0');
  
  return `${displayHours}:${displayMinutes} ${period}`;
};

// Helper function to get event color based on event type
export const getEventColor = (eventName) => {
  const colors = {
    'breakfast': 'green',
    'lunch': 'orange',
    'dinner': 'pink',
    'tour': 'blue',
    'workshop': 'purple',
    'ceremony': 'indigo',
    'social': 'yellow',
    'sports': 'emerald',
    'arts': 'rose',
    'academic': 'violet'
  };
  
  const eventLower = eventName.toLowerCase();
  for (const [key, color] of Object.entries(colors)) {
    if (eventLower.includes(key)) return color;
  }
  
  // Default color
  return 'gray';
};
