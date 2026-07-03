
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCalendar, FiMapPin, FiDollarSign, FiFilter, FiUsers, FiClock, FiTrendingUp, FiX, FiSearch } from 'react-icons/fi';
import { formatEventShort } from '../utils/date';

function EventsGrid() {
  const { role } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myTickets, setMyTickets] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [selectedOrganizer, setSelectedOrganizer] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEvents, setFilteredEvents] = useState([]);
  const BASE = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Build query parameters
        const params = new URLSearchParams();
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);
        if (selectedOrganizer) {
          params.append('organizer', selectedOrganizer);
        }

        const res = await axios.get(`${BASE}/api/events?${params.toString()}`);
        setEvents(res.data);

        // Extract unique organizers from events
        const uniqueOrganizers = [];
        const organizerMap = new Map();
        
        res.data.forEach(event => {
          if (event.created_by && event.created_by._id && !organizerMap.has(event.created_by._id)) {
            organizerMap.set(event.created_by._id, {
              _id: event.created_by._id,
              name: event.created_by.name || 'Unknown',
              role: event.created_by.role || 'unknown'
            });
          }
        });
        
        setOrganizers(Array.from(organizerMap.values()));
      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [sortBy, sortOrder, selectedOrganizer]);

  // Filter events based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEvents(events);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = events.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.venue?.toLowerCase().includes(query) ||
        event.created_by?.name?.toLowerCase().includes(query)
      );
      setFilteredEvents(filtered);
    }
  }, [searchQuery, events]);


  // Fetch user's tickets only when a student is logged in
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await axios.get(`${BASE}/api/tickets/my`, { withCredentials: true });
        setMyTickets(res.data);
      } catch (err) {
        setMyTickets([]);
      }
    };

    if (role === 'student') {
      fetchTickets();
    } else {
      // Clear tickets for non-students or guests
      setMyTickets([]);
    }
  }, [role]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-medium text-gray-600">No events available</h3>
        <p className="mt-2 text-gray-500">Check back later for upcoming events</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      {/* Compact Filter Bar */}
      <div className="mb-6">
        {/* Top Row: Search Bar and Filter Button */}
        <div className="flex items-center justify-between gap-4 mb-4">
          {/* Search Bar */}
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all bg-white hover:border-purple-300 shadow-sm"
              />
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500" size={18} />
            </div>
          </div>

          {/* Filter Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
          >
            <FiFilter className={`transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
            <span className="font-medium">Filter & Sort</span>
            {(selectedOrganizer || sortBy !== 'date' || sortOrder !== 'asc') && (
              <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">Active</span>
            )}
          </motion.button>
        </div>

        {/* Expandable Filter Panel */}
        <motion.div
          initial={false}
          animate={{
            height: showFilters ? 'auto' : 0,
            opacity: showFilters ? 1 : 0,
            marginBottom: showFilters ? 16 : 0
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sort By */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FiClock className="text-purple-600" />
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white hover:border-purple-300"
                >
                  <option value="date">Event Date</option>
                  <option value="title">Event Title</option>
                  <option value="createdAt">Recently Added</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FiTrendingUp className="text-purple-600" />
                  Sort Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white hover:border-purple-300"
                >
                  <option value="asc">
                    {sortBy === 'date' ? 'Upcoming First' : sortBy === 'title' ? 'A to Z' : 'Oldest First'}
                  </option>
                  <option value="desc">
                    {sortBy === 'date' ? 'Latest First' : sortBy === 'title' ? 'Z to A' : 'Newest First'}
                  </option>
                </select>
              </div>

              {/* Filter by Organizer */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FiUsers className="text-purple-600" />
                  Filter by Organizer
                </label>
                <select
                  value={selectedOrganizer}
                  onChange={(e) => setSelectedOrganizer(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white hover:border-purple-300"
                >
                  <option value="">All Organizers</option>
                  {organizers.map((org) => (
                    <option key={org._id} value={org._id}>
                      {org.name} {org.role === 'admin' ? '(Admin)' : '(Organizer)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom Row: Search Results Count and Active Filters */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Search Results Count */}
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-800">{filteredEvents.length}</span> of <span className="font-semibold text-gray-800">{events.length}</span> events
          </div>

          {/* Active Filter Summary */}
          <div className="flex items-center gap-2 flex-wrap text-sm">
            {sortBy !== 'date' && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                Sort: {sortBy === 'title' ? 'Title' : 'Recently Added'}
              </span>
            )}
            {sortOrder !== 'asc' && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                {sortBy === 'date' ? 'Latest First' : sortBy === 'title' ? 'Z→A' : 'Newest First'}
              </span>
            )}
            {selectedOrganizer && (
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full flex items-center gap-1">
                Organizer: {organizers.find(o => o._id === selectedOrganizer)?.name}
                <button
                  onClick={() => setSelectedOrganizer('')}
                  className="ml-1 hover:text-indigo-900"
                >
                  <FiX size={14} />
                </button>
              </span>
            )}
            {(selectedOrganizer || sortBy !== 'date' || sortOrder !== 'asc') && (
              <button
                onClick={() => {
                  setSelectedOrganizer('');
                  setSortBy('date');
                  setSortOrder('asc');
                }}
                className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg font-medium transition-colors duration-200"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Split events into upcoming and past */}
      {(() => {
        const now = new Date();
        // Don't re-sort here, respect the backend sorting
        const upcoming = filteredEvents.filter(e => new Date(e.date) >= now);
        const past = filteredEvents.filter(e => new Date(e.date) < now);
        return (
          <>
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Upcoming Events</h2>
              {upcoming.length === 0 ? (
                <div className="text-gray-500 mb-6">No upcoming events</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcoming.map((event, index) => {
                    const isRegistered = role && myTickets.some(ticket => ticket.event && (ticket.event._id === event._id));
                    const registrationClosed = event.registrationClosesAt && new Date(event.registrationClosesAt) <= now;
                    
                    return (
                      <motion.div
                        key={event._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.4 }}
                        whileHover={{ y: -5 }}
                        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300"
                      >
                        <div className="relative">
                          <img
                            src={`${BASE}/${event.image}`}
                            alt={event.title}
                            className="h-48 w-full object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                            {formatEventShort(event.date)}
                          </div>
                          {registrationClosed ? (
                            <div className="absolute top-2 left-2 bg-red-600/80 text-white text-xs px-2 py-1 rounded font-medium backdrop-blur-sm">
                              Registration Closed
                            </div>
                          ) : (
                            <div className="absolute top-2 left-2 bg-green-600/80 text-white text-xs px-2 py-1 rounded font-medium backdrop-blur-sm">
                              Registration Open
                            </div>
                          )}
                        </div>

                        <div className="p-5">
                          <h3 className="text-xl font-bold text-gray-800 mb-2">{event.title}</h3>
                          <div className="flex items-center text-gray-600 mb-2">
                            <FiMapPin className="mr-2" />
                            <span>{event.venue}</span>
                          </div>
                          {event.created_by && event.created_by.name && (
                            <div className="text-sm text-gray-500 mb-2">
                              <span className="font-medium">Organized by:</span> {event.created_by.name}
                            </div>
                          )}
                          <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                          <Link to={`/event/${event._id}`} className="inline-block w-full text-center bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 mb-2">View Details</Link>
                          {isRegistered ? (
                            <div className="w-full text-center bg-green-100 text-green-700 font-semibold py-2 rounded-lg mt-2 cursor-not-allowed">Registered</div>
                          ) : registrationClosed ? (
                            <div className="w-full text-center bg-red-100 text-red-700 font-semibold py-2 rounded-lg mt-2 cursor-not-allowed">Registration Closed</div>
                          ) : ((role === 'student' || !role) ? (
                            <Link to={`/event/${event._id}`} className="inline-block w-full text-center bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 mt-2">Register</Link>
                          ) : null)}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Past events */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Past Events</h2>
              {past.length === 0 ? (
                <div className="text-gray-500">No past events</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {past.map((event, index) => (
                    <motion.div
                      key={event._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.35 }}
                      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300"
                    >
                      <div className="relative">
                        <img src={`${BASE}/${event.image}`} alt={event.title} className="h-48 w-full object-cover brightness-50" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-black/50 text-white rounded-md px-3 py-1 text-sm">Event Completed</div>
                        </div>
                        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">{formatEventShort(event.date)}</div>
                      </div>

                      <div className="p-5">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{event.title}</h3>
                        <div className="flex items-center text-gray-600 mb-2">
                          <FiMapPin className="mr-2" />
                          <span>{event.venue}</span>
                        </div>
                        {event.created_by && event.created_by.name && (
                          <div className="text-sm text-gray-500 mb-2">
                            <span className="font-medium">Organized by:</span> {event.created_by.name}
                          </div>
                        )}
                        <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                        <Link to={`/event/${event._id}`} className="inline-block w-full text-center bg-white border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-all duration-300 mb-2">View Details</Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          </>
        );
      })()}
    </div>
  );
}

export default EventsGrid;