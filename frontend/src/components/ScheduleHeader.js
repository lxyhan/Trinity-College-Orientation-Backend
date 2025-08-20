import React from 'react';
import { ChevronDown } from 'lucide-react';

const ScheduleHeader = ({ 
  currentDate, 
  leaderData, 
  userName, 
  viewMode,
  setViewMode,
  showViewMenu, 
  setShowViewMenu
}) => {
  return (
    <header className="hidden sm:flex flex-none items-center justify-between border-b border-gray-200 px-6 py-4">
      <div>
        <h1 className="text-base font-semibold text-gray-900">
          <time dateTime={currentDate.toISOString()}>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </time>
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {leaderData?.leader_name || userName}! 🎓
        </p>
        {leaderData && (
          <p className="mt-1 text-xs text-blue-600">
            📅 {leaderData.total_events} events • ⏱️ {leaderData.total_hours} hours
          </p>
        )}
        <p className="mt-1 text-xs text-green-600">✓ Connected to backend</p>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowViewMenu(!showViewMenu)}
              className="flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              {viewMode === 'week' ? 'Week view' : 'Day view'}
              <ChevronDown className="-mr-1 size-5 text-gray-400" />
            </button>

            {showViewMenu && (
              <div className="absolute right-0 z-10 mt-3 w-48 origin-top-right overflow-hidden rounded-md bg-white shadow-lg outline outline-1 outline-black/5">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setViewMode('week');
                      setShowViewMenu(false);
                    }}
                    className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                      viewMode === 'week' ? 'text-indigo-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {viewMode === 'week' ? '✓ ' : ''}Week view
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('day');
                      setShowViewMenu(false);
                    }}
                    className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                      viewMode === 'day' ? 'text-indigo-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {viewMode === 'day' ? '✓ ' : ''}Day view
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default ScheduleHeader;
