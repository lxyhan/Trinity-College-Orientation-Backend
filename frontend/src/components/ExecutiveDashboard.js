'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';

// Import your API service
const API_BASE_URL = 'http://localhost:8000';

const apiService = {
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

  async getLeaderAssignments() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leader-assignments`);
      if (!response.ok) throw new Error('Failed to fetch leader assignments');
      const data = await response.json();
      return data.assignments;
    } catch (error) {
      console.error('Error fetching leader assignments:', error);
      return [];
    }
  },

  async getEventsWithStaffing() {
    try {
      const [events, staffingData] = await Promise.all([
        this.getEvents(),
        fetch(`${API_BASE_URL}/api/event-staffing`).then(r => r.json()).then(d => d.events)
      ]);

      const staffingMap = new Map();
      staffingData.forEach(staffingEvent => {
        staffingMap.set(staffingEvent.Event, staffingEvent);
      });

      return events.map(event => {
        const eventName = event.Event;
        const staffing = staffingMap.get(eventName);
        
        return {
          ...event,
          staffing: staffing ? {
            leadersNeeded: staffing['Leaders Needed'],
            leadersAssigned: staffing['Leaders Assigned'],
            staffingPercentage: staffing['Staffing Percentage'],
            fullyStaffed: staffing['Fully Staffed'],
            eventType: staffing['Event Type']
          } : null
        };
      });
    } catch (error) {
      console.error('Error fetching events with staffing:', error);
      return [];
    }
  },

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
  }
};

const ExecutiveDashboard = () => {
  const [events, setEvents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real data from your backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsData, assignmentsData, summaryData] = await Promise.all([
          apiService.getEventsWithStaffing(),
          apiService.getLeaderAssignments(),
          apiService.getSummary()
        ]);
        
        setEvents(eventsData);
        setAssignments(assignmentsData);
        setSummary(summaryData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data from backend');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper function to calculate event duration in hours
  const calculateDuration = (startTime, endTime) => {
    const parseTime = (timeStr) => {
      const time = timeStr.toLowerCase().replace(/\s/g, '');
      let hours = parseInt(time.match(/(\d+):/)?.[1] || '0');
      const minutes = parseInt(time.match(/:(\d+)/)?.[1] || '0');
      const isPM = time.includes('pm');
      
      if (isPM && hours !== 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
      
      return hours + minutes / 60;
    };

    return parseTime(endTime) - parseTime(startTime);
  };

  // Calculate comprehensive statistics
  const analytics = useMemo(() => {
    if (!events.length) return null;

    // Calculate event durations and add to events
    const eventsWithDuration = events.map(event => ({
      ...event,
      duration: calculateDuration(event.start_time || event['Start Time'], event.end_time || event['End Time'])
    }));

    // Leader performance metrics from assignments
    const leaderStats = assignments.reduce((acc, assignment) => {
      const leader = assignment['Leader Email'] || assignment.leader_email || assignment.leader_name || assignment.Leader;
      const eventName = assignment.Event || assignment.event_name;
      const hours = assignment.Hours || assignment.hours || calculateDuration(
        assignment['Start Time'] || assignment.start_time, 
        assignment['End Time'] || assignment.end_time
      );
      
      if (!acc[leader]) {
        acc[leader] = { name: leader, totalHours: 0, eventCount: 0, events: new Set() };
      }
      acc[leader].totalHours += hours || 0;
      acc[leader].events.add(eventName);
      acc[leader].eventCount = acc[leader].events.size;
      return acc;
    }, {});

    const leaders = Object.values(leaderStats).sort((a, b) => b.totalHours - a.totalHours);

    // Event type analysis
    const eventTypeStats = eventsWithDuration.reduce((acc, event) => {
      let eventType = 'Other';
      if (event.is_meal) eventType = 'Meals';
      else if (event.is_indoor && !event.is_outdoor) eventType = 'Indoor';
      else if (event.is_outdoor && !event.is_indoor) eventType = 'Outdoor';
      else if (event.is_indoor && event.is_outdoor) eventType = 'Mixed';
      
      if (!acc[eventType]) {
        acc[eventType] = { type: eventType, count: 0, totalHours: 0, avgStaffing: 0 };
      }
      acc[eventType].count += 1;
      acc[eventType].totalHours += event.duration;
      if (event.staffing) {
        acc[eventType].avgStaffing += event.staffing.staffingPercentage || 0;
      }
      return acc;
    }, {});

    Object.values(eventTypeStats).forEach(stat => {
      stat.avgStaffing = stat.avgStaffing / stat.count;
    });

    // Staffing efficiency metrics
    const staffingData = events.filter(e => e.staffing).map(event => ({
      name: event.Event || event.event_name,
      staffingPercentage: event.staffing.staffingPercentage,
      leadersNeeded: event.staffing.leadersNeeded,
      leadersAssigned: event.staffing.leadersAssigned,
      status: event.staffing.fullyStaffed ? 'Fully Staffed' : 
              event.staffing.staffingPercentage < 50 ? 'Critical' :
              event.staffing.staffingPercentage < 80 ? 'Understaffed' : 'Good'
    }));

    // Daily event distribution
    const dailyStats = eventsWithDuration.reduce((acc, event) => {
      const date = event.date || event.Date;
      if (!acc[date]) {
        acc[date] = { date, eventCount: 0, totalHours: 0, avgStaffing: 0 };
      }
      acc[date].eventCount += 1;
      acc[date].totalHours += event.duration;
      if (event.staffing) {
        acc[date].avgStaffing += event.staffing.staffingPercentage || 0;
      }
      return acc;
    }, {});

    Object.values(dailyStats).forEach(stat => {
      stat.avgStaffing = stat.avgStaffing / stat.eventCount;
    });

    // Key performance indicators
    const totalEvents = events.length;
    const totalHours = eventsWithDuration.reduce((sum, event) => sum + event.duration, 0);
    const totalLeaders = leaders.length;
    const totalVolunteerHours = leaders.reduce((sum, leader) => sum + leader.totalHours, 0);
    const avgStaffingPercentage = staffingData.reduce((sum, event) => sum + event.staffingPercentage, 0) / staffingData.length;
    const fullyStaffedEvents = staffingData.filter(e => e.status === 'Fully Staffed').length;
    const criticalEvents = staffingData.filter(e => e.status === 'Critical').length;
    const avgLeaderHours = Math.round((totalVolunteerHours / totalLeaders) * 10) / 10;
    const eventCompletionRate = Math.round((fullyStaffedEvents / totalEvents) * 100);

    return {
      leaders,
      eventTypeStats: Object.values(eventTypeStats),
      staffingData,
      dailyStats: Object.values(dailyStats).sort((a, b) => new Date(a.date) - new Date(b.date)),
      kpis: {
        totalEvents,
        totalHours: Math.round(totalHours * 10) / 10,
        totalLeaders,
        totalVolunteerHours: Math.round(totalVolunteerHours * 10) / 10,
        avgStaffingPercentage: Math.round(avgStaffingPercentage),
        fullyStaffedEvents,
        criticalEvents,
        avgLeaderHours,
        eventCompletionRate,
        avgHoursPerEvent: Math.round((totalHours / totalEvents) * 10) / 10,
        avgEventsPerLeader: Math.round((totalEvents / totalLeaders) * 10) / 10
      }
    };
  }, [events, assignments]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading executive dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ {error}</div>
          <p className="text-gray-600">Please ensure your backend is running on localhost:8000</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No data available for analysis</p>
        </div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-white p-6 print:p-2 print:text-xs">
      {/* Header */}
      <div className="mb-6 border-b-2 border-gray-200 pb-4 print:mb-3 print:pb-2">
        <div className="flex justify-between items-start print:flex-col print:gap-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-xl print:mb-1">Trinity College Orientation Executive Dashboard</h1>
            <p className="text-base text-gray-600 print:text-xs">Comprehensive Leadership & Event Management Analytics</p>
          </div>
          <div className="text-right print:text-left">
            <p className="text-sm text-gray-500 print:text-xs">Generated on</p>
            <p className="text-base font-semibold text-gray-900 print:text-xs">{currentDate}</p>
            <div className="mt-2 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium border border-green-300 print:text-xs print:px-1 print:py-0">
              Live Data
            </div>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="mb-6 print:mb-3">
        <h2 className="text-xl font-bold text-gray-900 mb-3 print:text-lg print:mb-2">Key Performance Indicators</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 print:gap-1 print:grid-cols-5">
          <div className="bg-blue-50 p-3 border-2 border-blue-400 print:p-1">
            <div className="text-xl font-bold text-blue-900 print:text-sm">{analytics.kpis.totalEvents}</div>
            <div className="text-xs text-blue-700 print:text-xs">Total Events</div>
          </div>
          <div className="bg-green-50 p-3 border-2 border-green-400 print:p-1">
            <div className="text-xl font-bold text-green-900 print:text-sm">{analytics.kpis.totalHours}h</div>
            <div className="text-xs text-green-700 print:text-xs">Total Event Hours</div>
          </div>
          <div className="bg-purple-50 p-3 border-2 border-purple-400 print:p-1">
            <div className="text-xl font-bold text-purple-900 print:text-sm">{analytics.kpis.totalLeaders}</div>
            <div className="text-xs text-purple-700 print:text-xs">Active Leaders</div>
          </div>
          <div className="bg-yellow-50 p-3 border-2 border-yellow-400 print:p-1">
            <div className="text-xl font-bold text-yellow-900 print:text-sm">{analytics.kpis.avgStaffingPercentage}%</div>
            <div className="text-xs text-yellow-700 print:text-xs">Avg Staffing</div>
          </div>
          <div className="bg-gray-50 p-3 border-2 border-gray-400 print:p-1">
            <div className="text-xl font-bold text-gray-900 print:text-sm">{analytics.kpis.totalVolunteerHours}h</div>
            <div className="text-xs text-gray-700 print:text-xs">Total Volunteer Hours</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6 print:gap-2">
        
        {/* Leader Performance Chart */}
        <div className="bg-white border-2 border-gray-400 p-3 shadow-sm print:p-2">
          <h3 className="text-lg font-bold text-gray-900 mb-2 print:text-sm print:mb-1">Top Leader Performance</h3>
          <ResponsiveContainer width="100%" height={200} className="print:h-32">
            <BarChart data={analytics.leaders.slice(0, 8)} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={60}
                fontSize={8}
                interval={0}
              />
              <YAxis fontSize={8} />
              <Tooltip />
              <Bar dataKey="totalHours" fill="#3B82F6" name="Total Hours" />
              <Bar dataKey="eventCount" fill="#10B981" name="Events Led" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Staffing Status Distribution */}
        <div className="bg-white border-2 border-gray-400 p-3 shadow-sm print:p-2">
          <h3 className="text-lg font-bold text-gray-900 mb-2 print:text-sm print:mb-1">Event Staffing Status</h3>
          <ResponsiveContainer width="100%" height={200} className="print:h-32">
            <PieChart>
              <Pie
                data={[
                  { name: 'Fully Staffed', value: analytics.kpis.fullyStaffedEvents, color: '#10B981' },
                  { name: 'Good', value: analytics.staffingData.filter(e => e.status === 'Good').length, color: '#3B82F6' },
                  { name: 'Understaffed', value: analytics.staffingData.filter(e => e.status === 'Understaffed').length, color: '#F59E0B' },
                  { name: 'Critical', value: analytics.kpis.criticalEvents, color: '#EF4444' }
                ]}
                cx="50%"
                cy="50%"
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelStyle={{ fontSize: '10px' }}
              >
                {[
                  { name: 'Fully Staffed', value: analytics.kpis.fullyStaffedEvents, color: '#10B981' },
                  { name: 'Good', value: analytics.staffingData.filter(e => e.status === 'Good').length, color: '#3B82F6' },
                  { name: 'Understaffed', value: analytics.staffingData.filter(e => e.status === 'Understaffed').length, color: '#F59E0B' },
                  { name: 'Critical', value: analytics.kpis.criticalEvents, color: '#EF4444' }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Event Distribution */}
        <div className="bg-white border-2 border-gray-400 p-3 shadow-sm print:p-2">
          <h3 className="text-lg font-bold text-gray-900 mb-2 print:text-sm print:mb-1">Daily Event Distribution</h3>
          <ResponsiveContainer width="100%" height={200} className="print:h-32">
            <AreaChart data={analytics.dailyStats} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={8} />
              <YAxis fontSize={8} />
              <Tooltip />
              <Area type="monotone" dataKey="eventCount" stackId="1" stroke="#3B82F6" fill="#3B82F6" name="Events" />
              <Area type="monotone" dataKey="totalHours" stackId="2" stroke="#10B981" fill="#10B981" name="Total Hours" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Event Type Analysis */}
        <div className="bg-white border-2 border-gray-400 p-3 shadow-sm print:p-2">
          <h3 className="text-lg font-bold text-gray-900 mb-2 print:text-sm print:mb-1">Event Type Analysis</h3>
          <ResponsiveContainer width="100%" height={200} className="print:h-32">
            <BarChart data={analytics.eventTypeStats} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" fontSize={8} />
              <YAxis fontSize={8} />
              <Tooltip />
              <Bar dataKey="count" fill="#8B5CF6" name="Event Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        
        {/* EXECUTIVE HOURS MASTER TABLE */}
        <div className="bg-white border-2 border-gray-400 shadow-lg">
          <div className="bg-gray-800 text-white px-4 py-2 border-b-2 border-gray-400">
            <h3 className="text-lg font-bold tracking-wide">EXECUTIVE LEADERSHIP HOURS ANALYSIS</h3>
            <div className="text-xs text-gray-300">Leadership performance breakdown and comprehensive metrics</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-gray-100 border-b-2 border-gray-400">
                <tr>
                  <th className="border border-gray-300 px-2 py-2 text-left font-bold">RANK</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-bold">LEADER NAME</th>
                  <th className="border border-gray-300 px-2 py-2 text-right font-bold">TOTAL HRS</th>
                  <th className="border border-gray-300 px-2 py-2 text-right font-bold">EVENTS</th>
                  <th className="border border-gray-300 px-2 py-2 text-right font-bold">AVG HRS/EVENT</th>
                  <th className="border border-gray-300 px-2 py-2 text-right font-bold">CONTRIBUTION %</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {analytics.leaders.map((leader, index) => {
                  const contributionPercent = Math.round((leader.totalHours / analytics.kpis.totalVolunteerHours) * 100);
                  const avgHoursPerEvent = Math.round((leader.totalHours / leader.eventCount) * 10) / 10;
                  
                  return (
                    <tr key={leader.name} className={`
                      ${index < 3 ? 'bg-yellow-50 font-semibold' : ''}
                      ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                      hover:bg-blue-50 transition-colors
                    `}>
                      <td className="border border-gray-300 px-2 py-1 text-center font-bold">
                        #{index + 1}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 font-medium">{leader.name}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right font-bold text-blue-900">
                        {leader.totalHours.toFixed(1)}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{leader.eventCount}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{avgHoursPerEvent}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right font-medium">{contributionPercent}%</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-200 border-t-2 border-gray-400">
                <tr className="font-bold text-xs">
                  <td className="border border-gray-300 px-2 py-2" colSpan="2">TOTALS:</td>
                  <td className="border border-gray-300 px-2 py-2 text-right">{analytics.kpis.totalVolunteerHours}</td>
                  <td className="border border-gray-300 px-2 py-2 text-right">{analytics.kpis.totalEvents}</td>
                  <td className="border border-gray-300 px-2 py-2 text-right">{analytics.kpis.avgLeaderHours}</td>
                  <td className="border border-gray-300 px-2 py-2 text-right">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* DETAILED EVENT BREAKDOWN TABLE */}
        <div className="bg-white border-2 border-gray-400 shadow-lg">
          <div className="bg-gray-800 text-white px-4 py-2 border-b-2 border-gray-400">
            <h3 className="text-lg font-bold tracking-wide">EVENT STAFFING MATRIX</h3>
            <div className="text-xs text-gray-300">Critical staffing analysis and resource allocation</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-gray-100 border-b-2 border-gray-400">
                <tr>
                  <th className="border border-gray-300 px-2 py-2 text-left font-bold">EVENT NAME</th>
                  <th className="border border-gray-300 px-2 py-2 text-center font-bold">DATE</th>
                  <th className="border border-gray-300 px-2 py-2 text-center font-bold">TIME</th>
                  <th className="border border-gray-300 px-2 py-2 text-right font-bold">NEEDED</th>
                  <th className="border border-gray-300 px-2 py-2 text-right font-bold">ASSIGNED</th>
                  <th className="border border-gray-300 px-2 py-2 text-right font-bold">FILL %</th>
                  <th className="border border-gray-300 px-2 py-2 text-center font-bold">STATUS</th>
                  <th className="border border-gray-300 px-2 py-2 text-center font-bold">PRIORITY</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {analytics.staffingData
                  .sort((a, b) => a.staffingPercentage - b.staffingPercentage)
                  .map((event, index) => {
                    const priority = event.staffingPercentage < 50 ? 'HIGH' : 
                                   event.staffingPercentage < 80 ? 'MED' : 'LOW';
                    
                    const eventData = events.find(e => (e.Event || e.event_name) === event.name);
                    
                    return (
                      <tr key={event.name} className={`
                        ${event.staffingPercentage < 50 ? 'bg-red-50' : 
                          event.staffingPercentage < 80 ? 'bg-yellow-50' : 'bg-green-50'}
                        ${index % 2 === 0 ? 'opacity-90' : ''}
                        hover:bg-blue-50 transition-colors
                      `}>
                        <td className="border border-gray-300 px-2 py-1 font-medium max-w-xs truncate">
                          {event.name}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center text-xs">
                          {eventData?.date || eventData?.Date || 'TBD'}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center text-xs">
                          {eventData?.start_time || eventData?.['Start Time'] || 'TBD'}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-right font-bold">
                          {event.leadersNeeded}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-right font-bold text-blue-900">
                          {event.leadersAssigned}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-right">
                          <span className={`font-bold ${
                            event.staffingPercentage >= 100 ? 'text-green-700' :
                            event.staffingPercentage >= 80 ? 'text-blue-700' :
                            event.staffingPercentage >= 50 ? 'text-orange-700' : 'text-red-700'
                          }`}>
                            {event.staffingPercentage}%
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <span className={`px-1 py-0.5 text-xs font-bold border ${
                            event.status === 'Fully Staffed' ? 'bg-green-200 text-green-800 border-green-400' :
                            event.status === 'Good' ? 'bg-blue-200 text-blue-800 border-blue-400' :
                            event.status === 'Understaffed' ? 'bg-yellow-200 text-yellow-800 border-yellow-400' :
                            'bg-red-200 text-red-800 border-red-400'
                          }`}>
                            {event.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <span className={`px-1 py-0.5 text-xs font-bold border ${
                            priority === 'HIGH' ? 'bg-red-200 text-red-800 border-red-400' :
                            priority === 'MED' ? 'bg-yellow-200 text-yellow-800 border-yellow-400' :
                            'bg-green-200 text-green-800 border-green-400'
                          }`}>
                            {priority}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* COMPACT ANALYTICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 print:gap-1 print:grid-cols-3">
          
          {/* Event Type Distribution */}
          <div className="bg-white border-2 border-gray-400 shadow-lg print:shadow-none">
            <div className="bg-gray-800 text-white px-2 py-1 border-b border-gray-400 print:px-1">
              <h4 className="text-xs font-bold print:text-xs">EVENT TYPE DISTRIBUTION</h4>
            </div>
            <div className="p-2 print:p-1">
              <table className="w-full text-xs print:text-xs">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-1 print:py-0">TYPE</th>
                    <th className="text-right py-1 print:py-0">COUNT</th>
                    <th className="text-right py-1 print:py-0">HRS</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.eventTypeStats.slice(0, 6).map((type, i) => (
                    <tr key={type.type} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="py-1 font-medium print:py-0">{type.type}</td>
                      <td className="text-right py-1 print:py-0">{type.count}</td>
                      <td className="text-right py-1 print:py-0">{type.totalHours.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daily Metrics */}
          <div className="bg-white border-2 border-gray-400 shadow-lg print:shadow-none">
            <div className="bg-gray-800 text-white px-2 py-1 border-b border-gray-400 print:px-1">
              <h4 className="text-xs font-bold print:text-xs">DAILY WORKLOAD ANALYSIS</h4>
            </div>
            <div className="p-2 print:p-1">
              <table className="w-full text-xs print:text-xs">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-1 print:py-0">DATE</th>
                    <th className="text-right py-1 print:py-0">EVENTS</th>
                    <th className="text-right py-1 print:py-0">HRS</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.dailyStats.slice(0, 6).map((day, i) => (
                    <tr key={day.date} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="py-1 font-medium print:py-0 text-xs">{day.date}</td>
                      <td className="text-right py-1 print:py-0">{day.eventCount}</td>
                      <td className="text-right py-1 print:py-0">{day.totalHours.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white border-2 border-gray-400 shadow-lg print:shadow-none">
            <div className="bg-gray-800 text-white px-2 py-1 border-b border-gray-400 print:px-1">
              <h4 className="text-xs font-bold print:text-xs">PERFORMANCE METRICS</h4>
            </div>
            <div className="p-2 space-y-1 text-xs print:p-1 print:space-y-0">
              <div className="flex justify-between print:text-xs">
                <span>Completion Rate:</span>
                <span className="font-bold text-blue-900">{analytics.kpis.eventCompletionRate}%</span>
              </div>
              <div className="flex justify-between print:text-xs">
                <span>Avg Hours/Event:</span>
                <span className="font-bold">{analytics.kpis.avgHoursPerEvent}h</span>
              </div>
              <div className="flex justify-between print:text-xs">
                <span>Avg Hours/Leader:</span>
                <span className="font-bold">{analytics.kpis.avgLeaderHours}h</span>
              </div>
              <div className="flex justify-between print:text-xs">
                <span>Events/Leader:</span>
                <span className="font-bold">{analytics.kpis.avgEventsPerLeader}</span>
              </div>
              <div className="flex justify-between print:text-xs">
                <span>Critical Events:</span>
                <span className="font-bold text-red-700">{analytics.kpis.criticalEvents}</span>
              </div>
              <div className="flex justify-between print:text-xs">
                <span>Fully Staffed:</span>
                <span className="font-bold text-green-700">{analytics.kpis.fullyStaffedEvents}</span>
              </div>
              <div className="flex justify-between print:text-xs">
                <span>Avg Staffing:</span>
                <span className="font-bold">{analytics.kpis.avgStaffingPercentage}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-gray-400 p-4 mb-4 print:p-2 print:mb-2 print:bg-gray-50">
        <h2 className="text-xl font-bold text-gray-900 mb-3 print:text-lg print:mb-2">Executive Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 print:text-sm print:mb-1">Operational Highlights</h4>
            <ul className="text-sm text-gray-700 space-y-1 print:text-xs print:space-y-0">
              <li>• Successfully managing {analytics.kpis.totalEvents} events totaling {analytics.kpis.totalHours} hours</li>
              <li>• {analytics.kpis.totalLeaders} active leaders contributing {analytics.kpis.totalVolunteerHours} volunteer hours</li>
              <li>• {analytics.kpis.eventCompletionRate}% event completion rate</li>
              <li>• {analytics.kpis.fullyStaffedEvents} events fully staffed, {analytics.kpis.criticalEvents} requiring attention</li>
              <li>• Average {analytics.kpis.avgLeaderHours} hours per leader</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 print:text-sm print:mb-1">Key Recommendations</h4>
            <ul className="text-sm text-gray-700 space-y-1 print:text-xs print:space-y-0">
              <li>• Focus on {analytics.kpis.criticalEvents > 0 ? `staffing ${analytics.kpis.criticalEvents} critical events` : 'maintaining excellent staffing levels'}</li>
              <li>• Recognize top performers: {analytics.leaders.slice(0, 3).map(l => l.name).join(', ')}</li>
              <li>• Average staffing at {analytics.kpis.avgStaffingPercentage}% - {analytics.kpis.avgStaffingPercentage > 90 ? 'excellent' : analytics.kpis.avgStaffingPercentage > 80 ? 'good, room for improvement' : 'needs attention'}</li>
              <li>• Total volunteer contribution represents significant community engagement</li>
              <li>• Consider load balancing for optimal leader utilization</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 border-t pt-2 print:text-xs print:pt-1">
        <p>Generated from live event management system • Data refreshed in real-time</p>
        <p>Report generated for Trinity College Orientation Leadership Team</p>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
