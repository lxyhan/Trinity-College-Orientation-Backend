'use client';

import React, { useState } from 'react';
import { useScheduleData } from '../../hooks/useScheduleData';
import ScheduleHeader from '../../components/ScheduleHeader';
import WeekGrid from '../../components/WeekGrid';
import EventSidebar from '../../components/EventSidebar';
import { getWeekDates } from '../../utils/dateUtils';

const ScheduleCalendar = () => {
  const [selectedMobileDay, setSelectedMobileDay] = useState(0); // 0 = Sunday, 1 = Monday, etc.
  const [viewMode, setViewMode] = useState('week');
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const {
    userName,
    events,
    filteredEvents,
    isLoading,
    leaderData,
    error,
    currentDate,
    loadScheduleData,
    handleCreateEvent
  } = useScheduleData();



  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        <div className="ml-4">
          <p className="text-lg font-semibold">Loading schedule...</p>
          <p className="text-sm text-gray-500">Connecting to backend...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={loadScheduleData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const weekDates = getWeekDates(currentDate);

  const handleSidebarToggle = () => {
    setShowMobileSidebar(!showMobileSidebar);
  };
 
  
  return (
    <div className="flex h-full flex-col">
      {/* Contact Bar */}
      <div className="bg-indigo-600 text-white px-4 py-2 text-sm">
        {/* Mobile: Compact contact info */}
        <div className="flex items-center justify-center space-x-4 sm:hidden">
          <div className="flex items-center space-x-1">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.40z"/>
            </svg>
            <a 
              href="https://instagram.com/jameshan05" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-indigo-200 text-xs font-medium"
            >
              @jameshan05
            </a>
          </div>
          <div className="flex items-center space-x-1">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z"/>
            </svg>
            <a 
              href="https://discord.gg/864ZgUgS" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-indigo-200 text-xs font-medium"
            >
              Discord
            </a>
          </div>
        </div>
        
        {/* Desktop: Full contact info */}
        <div className="hidden sm:flex items-center justify-center space-x-6">
          <div className="flex items-center space-x-2">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.40z"/>
            </svg>
            <span className="font-medium">Tech Issues:</span>
            <a 
              href="https://instagram.com/jameshan05" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-indigo-200 font-medium"
            >
              @jameshan05
            </a>
            <span className="text-indigo-200">• James Han</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z"/>
            </svg>
            <span className="font-medium">Orientation Discord:</span>
            <a 
              href="https://discord.gg/864ZgUgS" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-indigo-200 font-medium"
            >
              Join Server
            </a>
          </div>
        </div>
      </div>

      <ScheduleHeader
        currentDate={currentDate}
        leaderData={leaderData}
        userName={userName}
        viewMode={viewMode}
        setViewMode={setViewMode}
        showViewMenu={showViewMenu}
        setShowViewMenu={setShowViewMenu}
      />

      <div className="flex flex-1 overflow-hidden">
        <WeekGrid
          weekDates={weekDates}
          filteredEvents={filteredEvents}
          events={events}
          selectedMobileDay={selectedMobileDay}
          setSelectedMobileDay={setSelectedMobileDay}
          viewMode={viewMode}
          onSidebarToggle={handleSidebarToggle}
          leaderData={leaderData}
          userName={userName}
        />
        
        {/* Desktop Sidebar */}
        <EventSidebar
          events={events}
          leaderData={leaderData}
          isMobile={false}
        />
        
        {/* Mobile Sidebar */}
        <EventSidebar
          events={events}
          leaderData={leaderData}
          isMobile={true}
          isOpen={showMobileSidebar}
          onClose={() => setShowMobileSidebar(false)}
        />
      </div>
    </div>
  );
};

export default ScheduleCalendar;