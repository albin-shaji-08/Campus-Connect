import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { formatEventShort } from '../utils/date';

export default function OrganizerEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const BASE = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${BASE}/api/events?created_by=me`, { withCredentials: true });
        // Ensure we always set an array to avoid runtime errors when the server returns unexpected shapes
        if (Array.isArray(res.data)) {
          setEvents(res.data);
        } else if (res.data && res.data.events && Array.isArray(res.data.events)) {
          setEvents(res.data.events);
        } else {
          console.warn('Unexpected response for /api/events?created_by=me', res.data);
          setEvents([]);
          toast.error('Failed to load your events (unexpected server response)');
        }
      } catch (err) {
        toast.error(err.response?.data?.msg || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  const now = new Date();
  const upcoming = events.filter(e => new Date(e.date) >= now);
  const past = events.filter(e => new Date(e.date) < now);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">My Created Events</h2>
        <Link to="/events/create" className="px-4 py-2 bg-purple-600 text-white rounded">Create Event</Link>
      </div>

      {events.length === 0 ? (
        <div className="p-6 bg-white rounded shadow">You haven't created any events yet.</div>
      ) : (
        <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto space-y-12">
          {/* Upcoming Events */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Upcoming Events</h2>
            {upcoming.length === 0 ? (
              <div className="text-gray-500">No upcoming events</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcoming.map((event, index) => {
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
                        <img src={`${BASE}/${event.image}`} alt={event.title} className="h-48 w-full object-cover" />
                        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                          {formatEventShort(event.date)}
                        </div>
                        {registrationClosed ? (
                          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded font-medium">
                            Registration Closed
                          </div>
                        ) : (
                          <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded font-medium">
                            Registration Open
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{event.title}</h3>
                        <div className="flex items-center text-gray-600 mb-2">
                          <span>{event.venue}</span>
                        </div>
                      <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                      <Link to={`/event/${event._id}`} className="inline-block w-full text-center bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 mb-2">View Details</Link>
                      <Link to={`/event/${event._id}#registrations`} className="inline-block w-full text-center bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 mt-2">View Registrations</Link>
                    </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Past Events */}
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
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        {formatEventShort(event.date)}
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{event.title}</h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <span>{event.venue}</span>
                      </div>
                      <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                      <Link to={`/event/${event._id}`} className="inline-block w-full text-center bg-white border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-all duration-300 mb-2">View Details</Link>
                      <Link to={`/event/${event._id}#registrations`} className="inline-block w-full text-center bg-white border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-all duration-300 mt-2">View Registrations</Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
