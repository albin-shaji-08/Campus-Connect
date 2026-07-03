import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import {
  FiCalendar,
  FiUsers,
  FiTrendingUp,
  FiClock,
  FiMapPin,
  FiCheckCircle,
  FiAlertCircle,
  FiActivity,
  FiBarChart2,
  FiPieChart,
  FiEye,
  FiEdit,
  FiAward,
  FiTarget,
  FiDownload
} from 'react-icons/fi';

function OrganizerDashboard() {
  const { role, currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    pastEvents: 0,
    totalRegistrations: 0,
    averageRegistrations: 0,
    topEvent: null,
  });
  const [registrationData, setRegistrationData] = useState([]);
  const BASE = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch organizer's events
      const eventsRes = await axios.get(`${BASE}/api/events?created_by=me`, {
        withCredentials: true,
      });
      const eventsData = eventsRes.data;
      setEvents(eventsData);

      // Fetch registration counts for each event
      const regPromises = eventsData.map(async (event) => {
        try {
          const regRes = await axios.get(`${BASE}/api/registrations/event/${event._id}/count`);
          return { eventId: event._id, count: regRes.data.count || 0 };
        } catch (err) {
          return { eventId: event._id, count: 0 };
        }
      });

      const regCounts = await Promise.all(regPromises);
      setRegistrationData(regCounts);

      // Calculate statistics
      const now = new Date();
      const upcoming = eventsData.filter((e) => new Date(e.date) >= now);
      const past = eventsData.filter((e) => new Date(e.date) < now);
      const totalRegs = regCounts.reduce((sum, item) => sum + item.count, 0);
      const avgRegs = eventsData.length > 0 ? (totalRegs / eventsData.length).toFixed(1) : 0;

      // Find top event
      const topEventData = regCounts.reduce((max, item) => 
        item.count > (max?.count || 0) ? item : max, 
        regCounts[0]
      );
      const topEvent = eventsData.find((e) => e._id === topEventData?.eventId);

      setStats({
        totalEvents: eventsData.length,
        upcomingEvents: upcoming.length,
        pastEvents: past.length,
        totalRegistrations: totalRegs,
        averageRegistrations: avgRegs,
        topEvent: topEvent || null,
        topEventRegistrations: topEventData?.count || 0,
      });

      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setLoading(false);
    }
  };

  const getRegistrationCount = (eventId) => {
    const reg = registrationData.find((r) => r.eventId === eventId);
    return reg ? reg.count : 0;
  };

  const getCapacityPercentage = (eventId, maxParticipants) => {
    const count = getRegistrationCount(eventId);
    return maxParticipants > 0 ? Math.round((count / maxParticipants) * 100) : 0;
  };

  const exportEventCSV = async (eventId, eventTitle) => {
    try {
      toast.loading('Generating CSV...', { id: 'csv-export' });
      
      const url = `${BASE}/api/registrations/event/${eventId}/export/csv`;
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'text/csv' }
      });
      
      if (!response.ok) throw new Error('Failed to download CSV');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${eventTitle}_registrations.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('CSV downloaded!', { id: 'csv-export' });
    } catch (err) {
      console.error('CSV export error:', err);
      toast.error('Failed to export CSV', { id: 'csv-export' });
    }
  };

  const exportEventPDF = async (eventId, eventTitle) => {
    try {
      toast.loading('Generating PDF...', { id: 'pdf-export' });
      
      const url = `${BASE}/api/registrations/event/${eventId}/export/pdf`;
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/pdf' }
      });
      
      if (!response.ok) throw new Error('Failed to download PDF');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${eventTitle}_registrations.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('PDF downloaded!', { id: 'pdf-export' });
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to export PDF', { id: 'pdf-export' });
    }
  };

  if (role !== 'organizer') {
    return <Navigate to="/" />;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600 font-semibold">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const upcomingEvents = events.filter((e) => new Date(e.date) >= now);
  const recentEvents = events.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50">
      <Toaster position="top-center" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2 flex-wrap gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent break-words">
                Organizer Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Welcome back, <span className="font-semibold text-purple-600">{currentUser?.name}</span>!
              </p>
            </div>
            <Link
              to="/create-event"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex-shrink-0"
            >
              <FiCalendar />
              <span className="font-semibold">Create Event</span>
            </Link>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Events */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiCalendar className="text-purple-600 text-2xl" />
              </div>
              <FiTrendingUp className="text-green-500 text-xl" />
            </div>
            <h3 className="text-gray-600 text-sm font-semibold mb-1">Total Events</h3>
            <p className="text-3xl font-bold text-gray-800">{stats.totalEvents}</p>
            <p className="text-xs text-gray-500 mt-2">
              {stats.upcomingEvents} upcoming · {stats.pastEvents} completed
            </p>
          </motion.div>

          {/* Total Registrations */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-indigo-500 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <FiUsers className="text-indigo-600 text-2xl" />
              </div>
              <FiActivity className="text-indigo-500 text-xl" />
            </div>
            <h3 className="text-gray-600 text-sm font-semibold mb-1">Total Registrations</h3>
            <p className="text-3xl font-bold text-gray-800">{stats.totalRegistrations}</p>
            <p className="text-xs text-gray-500 mt-2">Across all events</p>
          </motion.div>

          {/* Average Registrations */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-pink-500 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-pink-100 rounded-lg">
                <FiBarChart2 className="text-pink-600 text-2xl" />
              </div>
              <FiTarget className="text-pink-500 text-xl" />
            </div>
            <h3 className="text-gray-600 text-sm font-semibold mb-1">Avg. Registrations</h3>
            <p className="text-3xl font-bold text-gray-800">{stats.averageRegistrations}</p>
            <p className="text-xs text-gray-500 mt-2">Per event</p>
          </motion.div>

          {/* Top Event */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <FiAward className="text-white text-2xl" />
              </div>
              <FiTrendingUp className="text-white text-xl" />
            </div>
            <h3 className="text-white/90 text-sm font-semibold mb-1">Top Performing Event</h3>
            {stats.topEvent ? (
              <>
                <p className="text-xl font-bold truncate">{stats.topEvent.title}</p>
                <p className="text-xs text-white/80 mt-2">
                  {stats.topEventRegistrations} registrations
                </p>
              </>
            ) : (
              <p className="text-sm">No events yet</p>
            )}
          </motion.div>
        </div>

        {/* Charts and Recent Events Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Event Status Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <FiPieChart className="text-purple-600 text-xl" />
              <h3 className="text-lg font-bold text-gray-800">Event Status</h3>
            </div>
            <div className="space-y-4">
              {/* Upcoming Events */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Upcoming</span>
                  <span className="text-sm font-bold text-green-600">{stats.upcomingEvents}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${stats.totalEvents > 0 ? (stats.upcomingEvents / stats.totalEvents) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Completed Events */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Completed</span>
                  <span className="text-sm font-bold text-blue-600">{stats.pastEvents}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${stats.totalEvents > 0 ? (stats.pastEvents / stats.totalEvents) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Total Capacity Utilization */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Avg. Capacity Used</span>
                  <span className="text-sm font-bold text-purple-600">
                    {events.length > 0
                      ? Math.round(
                          events.reduce((sum, e) => {
                            const count = getRegistrationCount(e._id);
                            return sum + (e.maxParticipants > 0 ? (count / e.maxParticipants) * 100 : 0);
                          }, 0) / events.length
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-400 to-indigo-600 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        events.length > 0
                          ? Math.round(
                              events.reduce((sum, e) => {
                                const count = getRegistrationCount(e._id);
                                return sum + (e.maxParticipants > 0 ? (count / e.maxParticipants) * 100 : 0);
                              }, 0) / events.length
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Registration Trends */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <FiBarChart2 className="text-indigo-600 text-xl" />
              <h3 className="text-lg font-bold text-gray-800">Registration Overview</h3>
            </div>
            <div className="space-y-3">
              {events.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FiCalendar className="text-6xl mx-auto mb-4 opacity-30" />
                  <p>No events created yet</p>
                </div>
              ) : (
                events.slice(0, 6).map((event, index) => {
                  const count = getRegistrationCount(event._id);
                  const percentage = getCapacityPercentage(event._id, event.maxParticipants);
                  const isPast = new Date(event.date) < now;

                  return (
                    <motion.div
                      key={event._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.05 }}
                      className="group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              isPast ? 'bg-gray-400' : percentage >= 80 ? 'bg-red-500' : 'bg-green-500'
                            }`}
                          />
                          <span className="text-sm font-medium text-gray-700 truncate group-hover:text-purple-600 transition-colors">
                            {event.title}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-gray-800 ml-4">
                          {count}/{event.maxParticipants}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${
                            percentage >= 80
                              ? 'bg-gradient-to-r from-red-400 to-red-600'
                              : percentage >= 50
                              ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                              : 'bg-gradient-to-r from-green-400 to-green-600'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{percentage}% capacity</p>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>

        {/* Recent Events Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FiActivity />
              Your Events
            </h3>
          </div>
          <div className="overflow-x-auto">
            {events.length === 0 ? (
              <div className="text-center py-16 px-4">
                <FiCalendar className="text-6xl text-gray-300 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-gray-600 mb-2">No Events Yet</h4>
                <p className="text-gray-500 mb-6">Create your first event to get started!</p>
                <Link
                  to="/create-event"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  <FiCalendar />
                  Create Event
                </Link>
              </div>
            ) : (
              <table className="min-w-full">
                <thead className="bg-purple-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-900 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-900 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-900 uppercase tracking-wider">
                      Venue
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-900 uppercase tracking-wider">
                      Registrations
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-900 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {events.map((event, index) => {
                    const count = getRegistrationCount(event._id);
                    const percentage = getCapacityPercentage(event._id, event.maxParticipants);
                    const isPast = new Date(event.date) < now;
                    const registrationClosed = event.registrationClosesAt && new Date(event.registrationClosesAt) <= now;

                    return (
                      <tr
                        key={event._id}
                        className={`transition-all duration-200 hover:bg-gradient-to-r hover:from-amber-50 hover:to-yellow-50 hover:shadow-md ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gradient-to-r from-purple-50 to-indigo-50'
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12 rounded-lg overflow-hidden">
                              <img
                                src={`${BASE}/${event.image}`}
                                alt={event.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900">{event.title}</div>
                              <div className="text-xs text-gray-500">ID: {event._id.substring(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-700">
                            <FiCalendar className="mr-2 text-purple-500" />
                            {new Date(event.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <FiClock className="mr-1" />
                            {new Date(event.date).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-700">
                            <FiMapPin className="mr-2 text-indigo-500" />
                            {event.venue}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {count} / {event.maxParticipants}
                          </div>
                          <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className={`h-2 rounded-full ${
                                percentage >= 80
                                  ? 'bg-red-500'
                                  : percentage >= 50
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{percentage}%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isPast ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                              <FiCheckCircle className="mr-1" />
                              Completed
                            </span>
                          ) : registrationClosed ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                              <FiAlertCircle className="mr-1" />
                              Reg. Closed
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              <FiCheckCircle className="mr-1" />
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/event/${event._id}`}
                              className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                              title="View Event"
                            >
                              <FiEye />
                            </Link>
                            <Link
                              to={`/events/edit/${event._id}`}
                              className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                              title="Edit Event"
                            >
                              <FiEdit />
                            </Link>
                            {count > 0 && (
                              <div className="relative group">
                                <button
                                  className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                  title="Export Registrations"
                                >
                                  <FiDownload />
                                </button>
                                <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-lg border border-gray-200 hidden group-hover:block z-10 min-w-[140px]">
                                  <button
                                    onClick={() => exportEventCSV(event._id, event.title)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2"
                                  >
                                    <FiDownload className="text-green-600" />
                                    Export CSV
                                  </button>
                                  <button
                                    onClick={() => exportEventPDF(event._id, event.title)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2 border-t"
                                  >
                                    <FiDownload className="text-red-600" />
                                    Export PDF
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Link
            to="/organizer/events"
            className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-300"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                <FiCalendar className="text-purple-600 text-3xl" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-800">Manage Events</h4>
                <p className="text-sm text-gray-600">View and edit all events</p>
              </div>
            </div>
          </Link>

          <Link
            to="/events/create"
            className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-indigo-300"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-indigo-100 rounded-xl group-hover:bg-indigo-200 transition-colors">
                <FiActivity className="text-indigo-600 text-3xl" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-800">Create New Event</h4>
                <p className="text-sm text-gray-600">Start planning your next event</p>
              </div>
            </div>
          </Link>

          <div className="group bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 text-white">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
                <FiAward className="text-white text-3xl" />
              </div>
              <div>
                <h4 className="text-lg font-bold">Your Impact</h4>
                <p className="text-sm text-white/90">{stats.totalRegistrations} students reached</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default OrganizerDashboard;
