// Example frontend integration with Trinity College Orientation Leaders API
// This demonstrates how to consume the API endpoints from a JavaScript frontend

const API_BASE_URL = 'http://localhost:8000';

// Utility function for API calls
async function apiCall(endpoint, params = {}) {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    
    // Add query parameters
    Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
            url.searchParams.append(key, params[key]);
        }
    });
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Example 1: Get all events with staffing information
async function getAllEvents() {
    try {
        const data = await apiCall('/api/events');
        console.log(`Total events: ${data.total_events}`);
        
        // Display events in a table
        const eventsTable = document.getElementById('events-table');
        if (eventsTable) {
            eventsTable.innerHTML = data.events.map(event => `
                <tr>
                    <td>${event.Event}</td>
                    <td>${event['Time Slot']}</td>
                    <td>${event['Duration (hours)']}h</td>
                    <td>${event['Leaders Needed']}</td>
                    <td>${event['Leaders Assigned']}</td>
                    <td>${event['Staffing Percentage']}%</td>
                    <td>${event['Fully Staffed'] ? '✅' : '❌'}</td>
                </tr>
            `).join('');
        }
        
        return data;
    } catch (error) {
        console.error('Failed to fetch events:', error);
    }
}

// Example 2: Get leader assignments with filters
async function getLeaderAssignments(filters = {}) {
    try {
        const data = await apiCall('/api/leader-assignments', filters);
        console.log(`Total assignments: ${data.total_assignments}`);
        
        // Display assignments
        const assignmentsDiv = document.getElementById('assignments-list');
        if (assignmentsDiv) {
            assignmentsDiv.innerHTML = data.assignments.map(assignment => `
                <div class="assignment-card">
                    <h4>${assignment.Event}</h4>
                    <p><strong>Leader:</strong> ${assignment['Leader Email']}</p>
                    <p><strong>Date:</strong> ${assignment.Date}</p>
                    <p><strong>Time:</strong> ${assignment['Start Time']} - ${assignment['End Time']}</p>
                    <p><strong>Hours:</strong> ${assignment.Hours}</p>
                </div>
            `).join('');
        }
        
        return data;
    } catch (error) {
        console.error('Failed to fetch assignments:', error);
    }
}

// Example 3: Search for a specific leader
async function searchLeader(leaderName) {
    try {
        const data = await apiCall(`/api/lookup/${encodeURIComponent(leaderName)}`);
        console.log(`Found leader: ${data.leader_name}`);
        
        // Display leader schedule
        const leaderScheduleDiv = document.getElementById('leader-schedule');
        if (leaderScheduleDiv) {
            leaderScheduleDiv.innerHTML = `
                <h3>${data.leader_name}</h3>
                <p><strong>Email:</strong> ${data.leader_email}</p>
                <p><strong>Total Events:</strong> ${data.total_events}</p>
                <p><strong>Total Hours:</strong> ${data.total_hours}</p>
                
                <h4>Schedule:</h4>
                <div class="schedule-list">
                    ${data.events.map(event => `
                        <div class="event-item">
                            <span class="event-name">${event.event_name}</span>
                            <span class="event-date">${event.date}</span>
                            <span class="event-time">${event.start_time} - ${event.end_time}</span>
                            <span class="event-duration">${event.duration_hours}h</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        return data;
    } catch (error) {
        console.error('Failed to search leader:', error);
    }
}

// Example 4: Get summary statistics
async function getSummaryStats() {
    try {
        const data = await apiCall('/api/summary');
        console.log('Summary statistics loaded');
        
        // Display summary in a dashboard
        const summaryDiv = document.getElementById('summary-dashboard');
        if (summaryDiv) {
            summaryDiv.innerHTML = data.summary.map(metric => `
                <div class="metric-card">
                    <h3>${metric.Metric}</h3>
                    <p class="metric-value">${metric.Value}</p>
                </div>
            `).join('');
        }
        
        return data;
    } catch (error) {
        console.error('Failed to fetch summary:', error);
    }
}

// Example 5: Get all leaders with their statistics
async function getAllLeaders() {
    try {
        const data = await apiCall('/api/leaders');
        console.log(`Total leaders: ${data.total_leaders}`);
        
        // Display leaders in a table
        const leadersTable = document.getElementById('leaders-table');
        if (leadersTable) {
            leadersTable.innerHTML = data.leaders.map(leader => `
                <tr>
                    <td>${leader.full_name}</td>
                    <td>${leader.email}</td>
                    <td>${leader.event_count}</td>
                    <td>${leader.total_hours}h</td>
                </tr>
            `).join('');
        }
        
        return data;
    } catch (error) {
        console.error('Failed to fetch leaders:', error);
    }
}

// Example 6: Filter events by staffing status
async function getFullyStaffedEvents() {
    try {
        const data = await apiCall('/api/event-staffing', { fully_staffed: true });
        console.log(`Fully staffed events: ${data.total_events}`);
        return data;
    } catch (error) {
        console.error('Failed to fetch fully staffed events:', error);
    }
}

// Example 7: Filter events by duration
async function getLongEvents(minDuration = 3.0) {
    try {
        const data = await apiCall('/api/event-staffing', { min_duration: minDuration });
        console.log(`Events ${minDuration}+ hours: ${data.total_events}`);
        return data;
    } catch (error) {
        console.error('Failed to fetch long events:', error);
    }
}

// Example 8: Filter assignments by hours
async function getHighHourAssignments(minHours = 5.0) {
    try {
        const data = await apiCall('/api/leader-assignments', { min_hours: minHours });
        console.log(`Assignments ${minHours}+ hours: ${data.total_assignments}`);
        return data;
    } catch (error) {
        console.error('Failed to fetch high hour assignments:', error);
    }
}

// Example usage in a React/Vue component or vanilla JS app
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Trinity College Orientation Leaders API Integration Example');
    
    // Load initial data
    try {
        await getAllEvents();
        await getSummaryStats();
        await getAllLeaders();
        
        // Example: Search for a specific leader
        await searchLeader('adrianyh');
        
        // Example: Get filtered data
        await getFullyStaffedEvents();
        await getLongEvents(2.0);
        await getHighHourAssignments(5.0);
        
    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
});

// Export functions for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        apiCall,
        getAllEvents,
        getLeaderAssignments,
        searchLeader,
        getSummaryStats,
        getAllLeaders,
        getFullyStaffedEvents,
        getLongEvents,
        getHighHourAssignments
    };
}
