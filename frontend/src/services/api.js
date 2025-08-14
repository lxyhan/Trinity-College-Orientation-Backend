const API_BASE_URL = 'https://honest-rejoicing.railway.app';

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
      const encodedEventName = encodeURIComponent(eventName);
      const url = `${API_BASE_URL}/api/event/${encodedEventName}/leaders`;
      console.log(`🔍 Fetching leaders for event: "${eventName}" -> ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`⚠️ Failed to fetch event leaders for "${eventName}": ${response.status} ${response.statusText}`);
        throw new Error('Failed to fetch event leaders');
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
