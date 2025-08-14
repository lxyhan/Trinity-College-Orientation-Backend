// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Fetch user data from backend using the lookup endpoint
 */
export const fetchUserData = async (username) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/lookup/${encodeURIComponent(username)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers if needed
        // 'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw new Error(`Failed to fetch user data: ${error.message}`);
  }
};

/**
 * For now, we'll extract schedule data from the lookup response
 * since the separate schedule endpoint doesn't exist yet
 */
export const fetchScheduleData = async (username, startDate, endDate) => {
  try {
    // Since we already have the data from lookup, we don't need a separate call
    // This function is kept for future use when a dedicated schedule endpoint is added
    return { events: [] }; // Will be populated from lookup data
  } catch (error) {
    console.error('Error fetching schedule data:', error);
    throw new Error(`Failed to fetch schedule: ${error.message}`);
  }
};

/**
 * Create a new event (when backend endpoint is available)
 */
export const createEvent = async (eventData, userName) => {
  try {
    // Note: This endpoint may not exist yet based on the 404 errors
    const response = await fetch(`${API_BASE_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers if needed
        // 'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_name: userName,
        ...eventData
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating event:', error);
    throw new Error(`Create event feature not available yet: ${error.message}`);
  }
};

/**
 * Extract events from user data response
 */
export const extractEventsFromUserData = (userData) => {
  console.log('🔍 Raw user data received:', userData);
  console.log('🔍 Type of userData:', typeof userData);
  console.log('🔍 Available keys:', Object.keys(userData || {}));
  
  let events = [];
  
  if (userData.events) {
    events = userData.events;
    console.log('📅 Found events in userData.events:', events);
  } else if (userData.data && userData.data.events) {
    events = userData.data.events;
    console.log('📅 Found events in userData.data.events:', events);
  } else if (Array.isArray(userData)) {
    events = userData;
    console.log('📅 userData is an array, using as events:', events);
  } else {
    console.log('❌ No events found in userData structure');
    console.log('🔍 Trying to find events in all properties...');
    
    // Search for events in all properties
    Object.keys(userData || {}).forEach(key => {
      console.log(`🔍 ${key}:`, userData[key]);
      if (Array.isArray(userData[key])) {
        console.log(`📝 ${key} is an array with ${userData[key].length} items`);
        if (userData[key].length > 0) {
          console.log(`📝 First item in ${key}:`, userData[key][0]);
        }
      }
    });
  }
  
  console.log('📅 Final events array:', events);
  console.log('📅 Events length:', events.length);
  
  return events;
};
