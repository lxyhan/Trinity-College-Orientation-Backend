'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ClockIcon, MapPinIcon, UsersIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';

export default function EventModal({ isOpen, closeModal, event }) {
  const [eventLeaders, setEventLeaders] = useState(null);
  const [loadingLeaders, setLoadingLeaders] = useState(false);

  // Fetch event leaders when modal opens
  useEffect(() => {
    if (isOpen && event && (event.event_name || event.Event)) {
      setLoadingLeaders(true);
      const eventName = event.event_name || event.Event;
      
      apiService.getEventLeaders(eventName)
        .then(data => {
          setEventLeaders(data);
        })
        .catch(error => {
          console.error('Failed to fetch event leaders:', error);
          setEventLeaders(null);
        })
        .finally(() => {
          setLoadingLeaders(false);
        });
    }
  }, [isOpen, event]);

  if (!event) return null;

  const getEventColor = (eventName) => {
    const colors = {
      'breakfast': 'bg-green-50 text-green-700 border-green-200',
      'lunch': 'bg-orange-50 text-orange-700 border-orange-200',
      'dinner': 'bg-pink-50 text-pink-700 border-pink-200',
      'tour': 'bg-blue-50 text-blue-700 border-blue-200',
      'workshop': 'bg-purple-50 text-purple-700 border-purple-200',
      'ceremony': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'social': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'sports': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'arts': 'bg-rose-50 text-rose-700 border-rose-200',
      'academic': 'bg-violet-50 text-violet-700 border-violet-200'
    };
    
    const eventLower = eventName.toLowerCase();
    for (const [key, color] of Object.entries(colors)) {
      if (eventLower.includes(key)) return color;
    }
    
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    
    // Convert to 12-hour format with AM/PM
    const time = timeStr.toLowerCase().replace(/\s/g, '');
    let hours = parseInt(time.match(/(\d+):/)?.[1] || '0');
    const minutes = parseInt(time.match(/:(\d+)/)?.[1] || '0');
    const isPM = time.includes('pm');
    
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${displayHours}:${displayMinutes} ${period}`;
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Event Details
                  </Dialog.Title>
                  <button
                    onClick={closeModal}
                    className="rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Event Name */}
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">
                      {event.event_name || event.Event}
                    </h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getEventColor(event.event_name || event.Event)}`}>
                      {event.event_name || event.Event}
                    </span>
                  </div>

                  {/* Date and Time */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {event.date || 'Date not specified'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <ClockIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {event.time_slot || `${formatTime(event.start_time || event['Start Time'])} - ${formatTime(event.end_time || event['End Time'])}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          Duration: {event.duration_hours || event['Duration (hours)']} hours
                        </p>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center space-x-3">
                      <MapPinIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {event.location || 'Location not specified'}
                        </p>
                      </div>
                    </div>

                    {/* Staffing Information */}
                    {event.leaders_needed && (
                      <div className="flex items-center space-x-3">
                        <UsersIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Staffing: {event.leaders_assigned || 0} / {event.leaders_needed} leaders
                          </p>
                          <p className="text-sm text-gray-500">
                            {event.staffing_percentage || 100}% staffed
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Event Leaders */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-3">Assigned Leaders</h5>
                    {loadingLeaders ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                        <span className="ml-2 text-sm text-gray-500">Loading leaders...</span>
                      </div>
                    ) : eventLeaders && eventLeaders.leaders ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">
                            {eventLeaders.total_leaders} leader{eventLeaders.total_leaders !== 1 ? 's' : ''} assigned
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                          {eventLeaders.leaders.map((leader, index) => (
                            <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-indigo-600">
                                  {leader.first_name ? leader.first_name[0].toUpperCase() : leader.name[0].toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {leader.name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {leader.email}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No leaders assigned or unable to load leader information.</p>
                    )}
                  </div>

                  {/* Additional Details */}
                  {event.description && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Description</h5>
                      <p className="text-sm text-gray-600">{event.description}</p>
                    </div>
                  )}

                  {/* Notes */}
                  {event.notes && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Notes</h5>
                      <p className="text-sm text-gray-600">{event.notes}</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    onClick={closeModal}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
