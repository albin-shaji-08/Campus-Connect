import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiUsers,
  FiCalendar,
  FiTrendingUp,
  FiActivity,
  FiUserCheck,
  FiUserPlus,
  FiAward,
  FiClock,
  FiMessageSquare,
  FiAlertCircle,
  FiCheckCircle,
  FiTarget,
  FiBarChart2,
  FiPieChart,
  FiEye,
  FiEdit,
  FiMapPin,
  FiTrendingDown,
  FiZap,
  FiLayers,
} from 'react-icons/fi';

function AdminDashboardMain() {
  const { role, currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalOrganizers: 0,
    totalEvents: 0,
    totalRegistrations: 0,
    upcomingEvents: 0,
    pastEvents: 0,
    activeRegistrations: 0,
    averageEventCapacity: 0,
    topOrganizer: null,
    topEvent: null,
    recentStudents: [],
    recentOrganizers: [],
  });
  const [events, setEvents] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [students, setStudents] = useState([]);
  const [registrationData, setRegistrationData] = useState([]);
  const BASE = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all data in parallel
      const [eventsRes, studentsRes, organizersRes] = await Promise.all([
        axios.get(`${BASE}/api/events`, { withCredentials: true }),
        axios.get(`${BASE}/api/users?role=student`, { withCredentials: true }),
        axios.get(`${BASE}/api/users?role=organizer`, { withCredentials: true }),
      ]);

      const eventsData = eventsRes.data;
      const studentsData = studentsRes.data;
      const organizersData = organizersRes.data;

      setEvents(eventsData);
      setStudents(studentsData);
      setOrganizers(organizersData);

      // Fetch registration counts for all events
      const regPromises = eventsData.map(async (event) => {
        try {
          const regRes = await axios.get(`${BASE}/api/registrations/event/${event._id}/count`);
          return { 
            eventId: event._id, 
            count: regRes.data.count || 0,
            eventTitle: event.title,
            organizerId: event.created_by?._id || event.created_by,
            maxParticipants: event.maxParticipants,
          };
        } catch (err) {
          return { 
            eventId: event._id, 
            count: 0,
            eventTitle: event.title,
            organizerId: event.created_by?._id || event.created_by,
            maxParticipants: event.maxParticipants,
          };
        }
      });

      const regCounts = await Promise.all(regPromises);
      setRegistrationData(regCounts);

      // Calculate statistics
      const now = new Date();
      const upcoming = eventsData.filter((e) => new Date(e.date) >= now);
      const past = eventsData.filter((e) => new Date(e.date) < now);
      const totalRegs = regCounts.reduce((sum, item) => sum + item.count, 0);
      
      // Active registrations (for upcoming events only)
      const activeRegs = regCounts
        .filter(reg => {
          const event = eventsData.find(e => e._id === reg.eventId);
          return event && new Date(event.date) >= now;
        })
        .reduce((sum, item) => sum + item.count, 0);

      // Calculate average capacity
      const avgCapacity = eventsData.length > 0
        ? Math.round(
            regCounts.reduce((sum, reg) => {
              return sum + (reg.maxParticipants > 0 ? (reg.count / reg.maxParticipants) * 100 : 0);
            }, 0) / eventsData.length
          )
        : 0;

      // Find top event by registrations
      const topEventData = regCounts.reduce((max, item) =>
        item.count > (max?.count || 0) ? item : max,
        regCounts[0]
      );
      const topEvent = eventsData.find((e) => e._id === topEventData?.eventId);

      // Find top organizer by total registrations across their events
      const organizerStats = {};
      regCounts.forEach(reg => {
        const orgId = reg.organizerId?.toString() || reg.organizerId;
        if (orgId) {
          if (!organizerStats[orgId]) {
            organizerStats[orgId] = { count: 0, events: 0 };
          }
          organizerStats[orgId].count += reg.count;
          organizerStats[orgId].events += 1;
        }
      });

      let topOrgId = null;
      let maxRegs = 0;
      Object.keys(organizerStats).forEach(orgId => {
        if (organizerStats[orgId].count > maxRegs) {
          maxRegs = organizerStats[orgId].count;
          topOrgId = orgId;
        }
      });

      const topOrganizer = topOrgId 
        ? organizersData.find(o => o._id === topOrgId) || null
        : null;

      // Get recent students and organizers (last 5)
      const recentStudents = studentsData
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      const recentOrganizers = organizersData
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      setStats({
        totalStudents: studentsData.length,
        totalOrganizers: organizersData.length,
        totalEvents: eventsData.length,
        totalRegistrations: totalRegs,
        upcomingEvents: upcoming.length,
        pastEvents: past.length,
        activeRegistrations: activeRegs,
        averageEventCapacity: avgCapacity,
        topOrganizer: topOrganizer,
        topOrganizerStats: topOrgId ? organizerStats[topOrgId] : null,
        topEvent: topEvent,
        topEventRegistrations: topEventData?.count || 0,
        recentStudents,
        recentOrganizers,
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

  if (role !== 'admin') {
    return <Navigate to="/" />;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600 font-semibold">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const upcomingEvents = events.filter((e) => new Date(e.date) >= now).slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50">
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
                Platform Overview
              </h1>
              <p className="text-gray-600 mt-2">
                Complete insights and analytics, <span className="font-semibold text-purple-600">{currentUser?.email}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/admin/create-organizer"
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex-shrink-0"
              >
                <FiUserPlus />
                <span className="font-semibold">Add Organizer</span>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Top Statistics Grid - 4 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Students */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-all cursor-pointer"
          >
            <Link to="/admin/users" className="block">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FiUsers className="text-blue-600 text-2xl" />
                </div>
                <FiTrendingUp className="text-green-500 text-xl" />
              </div>
              <h3 className="text-gray-600 text-sm font-semibold mb-1">Total Students</h3>
              <p className="text-3xl font-bold text-gray-800">{stats.totalStudents}</p>
              <p className="text-xs text-gray-500 mt-2">
                {stats.recentStudents.length} new this month
              </p>
            </Link>
          </motion.div>

          {/* Total Organizers */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-all cursor-pointer"
          >
            <Link to="/admin/organizers" className="block">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FiUserCheck className="text-purple-600 text-2xl" />
                </div>
                <FiActivity className="text-purple-500 text-xl" />
              </div>
              <h3 className="text-gray-600 text-sm font-semibold mb-1">Total Organizers</h3>
              <p className="text-3xl font-bold text-gray-800">{stats.totalOrganizers}</p>
              <p className="text-xs text-gray-500 mt-2">
                Active clubs & societies
              </p>
            </Link>
          </motion.div>

          {/* Total Events */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-indigo-500 hover:shadow-xl transition-all cursor-pointer"
          >
            <Link to="/admin/events" className="block">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <FiCalendar className="text-indigo-600 text-2xl" />
                </div>
                <FiZap className="text-indigo-500 text-xl" />
              </div>
              <h3 className="text-gray-600 text-sm font-semibold mb-1">Total Events</h3>
              <p className="text-3xl font-bold text-gray-800">{stats.totalEvents}</p>
              <p className="text-xs text-gray-500 mt-2">
                {stats.upcomingEvents} upcoming · {stats.pastEvents} completed
              </p>
            </Link>
          </motion.div>

          {/* Total Registrations */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <FiTarget className="text-white text-2xl" />
              </div>
              <FiTrendingUp className="text-white text-xl" />
            </div>
            <h3 className="text-white/90 text-sm font-semibold mb-1">Total Registrations</h3>
            <p className="text-3xl font-bold">{stats.totalRegistrations}</p>
            <p className="text-xs text-white/80 mt-2">
              {stats.activeRegistrations} for upcoming events
            </p>
          </motion.div>
        </div>

        {/* Secondary Statistics - 2 Highlighted Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Organizer */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-lg">
                  <FiAward className="text-white text-3xl" />
                </div>
                <div>
                  <h3 className="text-white/90 text-sm font-semibold">Top Performing Organizer</h3>
                  <p className="text-xs text-white/70">Most engaging events</p>
                </div>
              </div>
            </div>
            {stats.topOrganizer ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mt-4">
                <p className="text-2xl font-bold mb-2">{stats.topOrganizer.name}</p>
                <p className="text-sm text-white/80 mb-3">{stats.topOrganizer.email}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <FiCalendar />
                    {stats.topOrganizerStats?.events || 0} Events
                  </span>
                  <span className="flex items-center gap-1">
                    <FiUsers />
                    {stats.topOrganizerStats?.count || 0} Registrations
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-white/80 text-sm">No organizer data available</p>
            )}
          </motion.div>

          {/* Top Event */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-lg">
                  <FiTrendingUp className="text-white text-3xl" />
                </div>
                <div>
                  <h3 className="text-white/90 text-sm font-semibold">Most Popular Event</h3>
                  <p className="text-xs text-white/70">Highest registrations</p>
                </div>
              </div>
            </div>
            {stats.topEvent ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mt-4">
                <p className="text-2xl font-bold mb-2 line-clamp-1">{stats.topEvent.title}</p>
                <div className="flex items-center gap-2 text-sm text-white/80 mb-3">
                  <FiMapPin />
                  <span>{stats.topEvent.venue}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <FiUsers />
                    {stats.topEventRegistrations} Registered
                  </span>
                  <Link
                    to={`/event/${stats.topEvent._id}`}
                    className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <FiEye />
                    View
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-white/80 text-sm">No event data available</p>
            )}
          </motion.div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Platform Health */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <FiActivity className="text-purple-600 text-xl" />
              <h3 className="text-lg font-bold text-gray-800">Platform Health</h3>
            </div>
            <div className="space-y-4">
              {/* Event Activity */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Event Activity</span>
                  <span className="text-sm font-bold text-green-600">
                    {stats.upcomingEvents > 0 ? 'Active' : 'Low'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${stats.totalEvents > 0 ? Math.min((stats.upcomingEvents / stats.totalEvents) * 200, 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Student Engagement */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Student Engagement</span>
                  <span className="text-sm font-bold text-blue-600">
                    {stats.totalStudents > 0 && stats.totalRegistrations > 0
                      ? `${Math.round((stats.totalRegistrations / stats.totalStudents) * 10) / 10}`
                      : '0'} avg
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        stats.totalStudents > 0
                          ? ((stats.totalRegistrations / stats.totalStudents) * 100) / 3
                          : 0,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Capacity Utilization */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Avg. Capacity</span>
                  <span className="text-sm font-bold text-purple-600">{stats.averageEventCapacity}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-400 to-indigo-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${stats.averageEventCapacity}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <FiClock className="text-indigo-600 text-xl" />
              <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Students */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FiUsers className="text-blue-500" />
                  New Students
                </h4>
                <div className="space-y-2">
                  {stats.recentStudents.length === 0 ? (
                    <p className="text-sm text-gray-400">No recent students</p>
                  ) : (
                    stats.recentStudents.map((student, idx) => (
                      <motion.div
                        key={student._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9 + idx * 0.05 }}
                        className="flex items-center gap-3 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
                          {student.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{student.name}</p>
                          <p className="text-xs text-gray-500 truncate">{student.email}</p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Organizers */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FiUserCheck className="text-purple-500" />
                  New Organizers
                </h4>
                <div className="space-y-2">
                  {stats.recentOrganizers.length === 0 ? (
                    <p className="text-sm text-gray-400">No recent organizers</p>
                  ) : (
                    stats.recentOrganizers.map((organizer, idx) => (
                      <motion.div
                        key={organizer._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9 + idx * 0.05 }}
                        className="flex items-center gap-3 p-2 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold text-sm flex-shrink-0">
                          {organizer.name?.charAt(0).toUpperCase() || 'O'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{organizer.name}</p>
                          <p className="text-xs text-gray-500 truncate">{organizer.email}</p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Upcoming Events Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8"
        >
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FiCalendar />
              Upcoming Events
            </h3>
            <Link
              to="/admin/events"
              className="text-white text-sm hover:text-purple-200 transition-colors flex items-center gap-1"
            >
              View All
              <FiTrendingUp />
            </Link>
          </div>
          <div className="overflow-x-auto">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-12 px-4">
                <FiCalendar className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No upcoming events</p>
              </div>
            ) : (
              <table className="min-w-full">
                <thead className="bg-purple-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-900 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-900 uppercase tracking-wider">
                      Organizer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-900 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-900 uppercase tracking-wider">
                      Registrations
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingEvents.map((event, index) => {
                    const count = getRegistrationCount(event._id);
                    const percentage = getCapacityPercentage(event._id, event.maxParticipants);

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
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <FiMapPin />
                                {event.venue}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {event.created_by?.name || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {event.created_by?.role === 'admin' ? 'Admin' : 'Organizer'}
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
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link
                            to={`/event/${event._id}`}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                          >
                            <FiEye />
                            View
                          </Link>
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
          transition={{ delay: 1.0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <Link
            to="/admin/users"
            className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-300"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                <FiUsers className="text-blue-600 text-3xl" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-800">Students</h4>
                <p className="text-sm text-gray-600">Manage users</p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/organizers"
            className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-300"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                <FiUserCheck className="text-purple-600 text-3xl" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-800">Organizers</h4>
                <p className="text-sm text-gray-600">Manage clubs</p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/events"
            className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-indigo-300"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-indigo-100 rounded-xl group-hover:bg-indigo-200 transition-colors">
                <FiCalendar className="text-indigo-600 text-3xl" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-800">Events</h4>
                <p className="text-sm text-gray-600">View all events</p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/messages"
            className="group bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 text-white"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
                <FiMessageSquare className="text-white text-3xl" />
              </div>
              <div>
                <h4 className="text-lg font-bold">Messages</h4>
                <p className="text-sm text-white/90">User inquiries</p>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

export default AdminDashboardMain;
