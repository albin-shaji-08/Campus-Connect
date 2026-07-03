import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { registerForEvent } from '../api/registration';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiCalendar, FiMapPin, FiDollarSign, FiArrowLeft } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import { FaTicketAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { formatEventLong } from '../utils/date';

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
    // const [quantity, setQuantity] = useState(1); // Only 1 ticket allowed
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const BASE = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';
  const { role } = useAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [regsOpen, setRegsOpen] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [myTickets, setMyTickets] = useState([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showNotifySection, setShowNotifySection] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [sendingNotification, setSendingNotification] = useState(false);
  const [showUnregisterConfirm, setShowUnregisterConfirm] = useState(false);
  const [unregistering, setUnregistering] = useState(false);

  // Clear user data when role changes to null (logout)
  useEffect(() => {
    if (!role) {
      setCurrentUser(null);
      setIsOwner(false);
      setRegsOpen(false);
      setRegistrations([]);
      setMyTickets([]);
      setIsRegistered(false);
    }
  }, [role]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await axios.get(`${BASE}/api/events/${id}`);
        setEvent(res.data);
      } catch (err) {
        toast.error('Failed to load event details');
        navigate('/events');
      } finally {
        setLoading(false);
      }
    };

    // fetch event, then try to fetch current user (if authenticated) to determine ownership
    const fetchUser = async () => {
      // Only fetch user if there's a role (user is logged in)
      if (!role) {
        setCurrentUser(null);
        return;
      }
      
      try {
        const r = await axios.get(`${BASE}/api/auth/me`, { withCredentials: true });
        setCurrentUser(r.data);
      } catch (e) {
        // not authenticated or no token, clear user data
        setCurrentUser(null);
        setIsOwner(false);
      }
    };

    fetchEvent();
    fetchUser();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [id, role]);

  // update ownership when event or currentUser changes
  useEffect(() => {
    if (!event || !currentUser) return;
    try {
      // Admin has full access to all events
      // Organizer has access only to their own events
      if (currentUser.role === 'admin') {
        setIsOwner(true);
      } else {
        // event.created_by is an ObjectId string or object, currentUser.userId is Mongo _id (string)
        const creatorId = typeof event.created_by === 'object' ? event.created_by._id : event.created_by;
        setIsOwner(String(creatorId) === String(currentUser.userId));
      }
    } catch (e) {
      setIsOwner(false);
    }
  }, [event, currentUser]);

  // Fetch participant count for public display
  useEffect(() => {
    if (!event) return;
    const fetchCount = async () => {
      try {
        const res = await axios.get(`${BASE}/api/registrations/event/${id}/count`);
        setParticipantCount(res.data.count || 0);
      } catch (err) {
        // If error, set count to 0
        setParticipantCount(0);
      }
    };
    fetchCount();
  }, [event, id]);

  // Fetch user's tickets to check if already registered
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await axios.get(`${BASE}/api/registrations/my`, { withCredentials: true });
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
  }, [role, BASE]);

  // Check if user is registered for this event
  useEffect(() => {
    if (role === 'student' && event && myTickets.length > 0) {
      const registered = myTickets.some(ticket => 
        ticket.event_id && (ticket.event_id._id === event._id || ticket.event_id === event._id)
      );
      setIsRegistered(registered);
    } else {
      setIsRegistered(false);
    }
  }, [role, event, myTickets]);

  // registrations open only when organizer clicks the button

  const openRegistrations = async () => {
    try {
      setRegsOpen(true);
      const res = await axios.get(`${BASE}/api/registrations/event/${id}`, { withCredentials: true });
      if (Array.isArray(res.data)) {
        setRegistrations(res.data);
        setParticipantCount(res.data.length);
      }
      else setRegistrations([]);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to load registrations');
      setRegistrations([]);
    }
  };

  const exportCSV = async () => {
    try {
      toast.loading('Generating CSV...', { id: 'csv-export' });
      
      const url = `${BASE}/api/registrations/event/${id}/export/csv`;
      
      // Use fetch with credentials
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'text/csv'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download CSV');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${event.title}_registrations.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('CSV downloaded successfully!', { id: 'csv-export' });
    } catch (err) {
      console.error('CSV export error:', err);
      toast.error('Failed to export CSV', { id: 'csv-export' });
    }
  };

  const exportPDF = async () => {
    try {
      toast.loading('Generating PDF...', { id: 'pdf-export' });
      
      // Create a direct download URL with credentials
      const url = `${BASE}/api/registrations/event/${id}/export/pdf`;
      
      // Use fetch with credentials instead of axios to bypass some download managers
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/pdf'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${event.title}_registrations.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('PDF downloaded successfully!', { id: 'pdf-export' });
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to export PDF', { id: 'pdf-export' });
    }
  };

  const handleSendNotification = async () => {
    try {
      setSendingNotification(true);
      
      const response = await axios.post(
        `${BASE}/api/reminders/event/${id}`,
        { customMessage: notificationMessage },
        { withCredentials: true }
      );

      toast.success(`Notification sent to ${response.data.sent} participant(s)!`);
      
      if (response.data.failed > 0) {
        toast.error(`Failed to send to ${response.data.failed} participant(s)`);
      }

      // Clear and collapse
      setNotificationMessage('');
      setShowNotifySection(false);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to send notification');
    } finally {
      setSendingNotification(false);
    }
  };

  const handleCancelNotification = () => {
    setNotificationMessage('');
    setShowNotifySection(false);
  };

  const handleBooking = async () => {
    try {
      const role = localStorage.getItem('role');
      if (!role) {
        toast.error('Please login to register');
        return navigate('/login');
      }
      if (role !== 'student') {
        toast.error('Only students may register for events');
        return;
      }
      setBooking(true);
      await registerForEvent(id, BASE);
      toast.success('Registered successfully!');
      
      // Refresh tickets to update registration status
      const res = await axios.get(`${BASE}/api/registrations/my`, { withCredentials: true });
      setMyTickets(res.data);
      
      // Refresh participant count
      const countRes = await axios.get(`${BASE}/api/registrations/event/${id}/count`);
      setParticipantCount(countRes.data.count || 0);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to register');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setBooking(false);
    }
  };

  const handleUnregister = async () => {
    try {
      setUnregistering(true);
      await axios.delete(`${BASE}/api/registrations/unregister`, {
        data: { event_id: id },
        withCredentials: true
      });
      
      toast.success('Unregistered successfully');
      setShowUnregisterConfirm(false);
      
      // Refresh tickets to update registration status
      const res = await axios.get(`${BASE}/api/registrations/my`, { withCredentials: true });
      setMyTickets(res.data);
      
      // Refresh participant count
      const countRes = await axios.get(`${BASE}/api/registrations/event/${id}/count`);
      setParticipantCount(countRes.data.count || 0);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to unregister');
    } finally {
      setUnregistering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!event) return null;

  // Check if registration is closed
  const now = new Date();
  const registrationClosed = event.registrationClosesAt && new Date(event.registrationClosesAt) <= now;
  const eventFull = event.maxParticipants && participantCount >= event.maxParticipants;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-center" />
      <div className="max-w-4xl mx-auto">
        <motion.button
          onClick={() => navigate(-1)}
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center text-purple-600 mb-6"
        >
          <FiArrowLeft className="mr-2" /> Back to Events
        </motion.button>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          <div className="relative">
            <img
              src={`${BASE}/${event.image}`}
              alt={event.title}
              className="w-full h-64 sm:h-80 object-cover"
            />
            <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm">
              <FiCalendar className="inline mr-2" />
              {formatEventLong(event.date)}
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{event.title}</h1>

            {/* Display organizer info */}
            {event.created_by && typeof event.created_by === 'object' && (
              <div className="flex items-center text-gray-600 mb-3">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                </svg>
                <span className="text-sm">
                  <span className="font-medium">Organizer:</span>{' '}
                  {currentUser && currentUser.role === 'admin' 
                    ? (event.created_by.role === 'admin' ? 'Admin' : event.created_by.name)
                    : event.created_by.name
                  }
                </span>
              </div>
            )}

            <div className="flex items-center text-gray-600 mb-4">
              <FiMapPin className="mr-2" />
              <span>{event.venue}</span>
            </div>

            {/* Registration closing time */}
            {event.registrationClosesAt && (
              <div className="mb-4 space-y-2">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${registrationClosed || eventFull ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  <FiCalendar className="mr-2" />
                  {eventFull ? 'Event Full' : registrationClosed ? 'Registration Closed' : `Registration closes: ${formatEventLong(event.registrationClosesAt)}`}
                </div>
                {event.maxParticipants && (
                  <div className="text-sm text-gray-600">
                    <span className={`font-semibold ${eventFull ? 'text-red-600' : participantCount >= event.maxParticipants * 0.8 ? 'text-orange-600' : 'text-green-600'}`}>
                      {participantCount} / {event.maxParticipants}
                    </span> participants registered
                  </div>
                )}
              </div>
            )}

            {/* Ticket price removed */}

            <div className="prose max-w-none text-gray-700 mb-8">
              <p>{event.description}</p>
            </div>

            {(role === 'student' || !role) && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold mb-4">Register for Event</h3>
                {/* Only one ticket per user, no price or quantity UI */}

                {isRegistered ? (
                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
                      <p className="font-medium flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        You are registered for this event
                      </p>
                    </div>
                    
                    {!showUnregisterConfirm ? (
                      <motion.button
                        onClick={() => setShowUnregisterConfirm(true)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg shadow-md transition-all"
                      >
                        Unregister
                      </motion.button>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4"
                      >
                        <div className="flex items-start mb-3">
                          <svg className="w-6 h-6 text-yellow-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                          </svg>
                          <div>
                            <h4 className="font-semibold text-yellow-800 mb-1">Confirm Unregistration</h4>
                            <p className="text-sm text-yellow-700">
                              Are you sure you want to unregister from this event? This action cannot be undone.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setShowUnregisterConfirm(false)}
                            disabled={unregistering}
                            className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleUnregister}
                            disabled={unregistering}
                            className={`flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors ${unregistering ? 'opacity-70 cursor-not-allowed' : ''}`}
                          >
                            {unregistering ? (
                              <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Unregistering...
                              </span>
                            ) : 'Confirm Unregister'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : eventFull ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    <p className="font-medium">This event has reached its maximum capacity.</p>
                  </div>
                ) : registrationClosed ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    <p className="font-medium">Registration has closed for this event.</p>
                  </div>
                ) : (
                  <motion.button
                    onClick={() => {
                      // Guests see an alert then are redirected to login; students call handleBooking
                      if (!role) {
                        toast.error("You're not signed in — sign in to register");
                        // allow toast to be visible briefly before redirect
                        setTimeout(() => navigate('/login'), 650);
                        return;
                      }
                      if (role === 'student') return handleBooking();
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={booking}
                    className={`w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-3 px-6 rounded-lg shadow-md transition-all ${booking ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {booking ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <FaTicketAlt className="mr-2" />
                        Register
                      </span>
                    )}
                  </motion.button>
                )}
              </div>
            )}

            {/* Organizer/Admin-only: View Registrations */}
            {currentUser && (currentUser.role === 'organizer' || currentUser.role === 'admin') && isOwner && (
              <div className="border-t border-gray-200 pt-6">
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={openRegistrations}
                    className="w-full sm:w-auto mt-3 bg-white border border-purple-600 text-purple-600 font-medium py-2 px-4 rounded-lg hover:bg-purple-50 transition-all"
                  >
                    View Registrations
                  </button>
                  <button
                    onClick={() => setShowNotifySection(!showNotifySection)}
                    className="w-full sm:w-auto mt-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium py-2 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Notify Participants
                  </button>
                  <button
                    onClick={() => navigate(`/events/edit/${id}`)}
                    className="w-full sm:w-auto mt-3 bg-white border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    Edit Event
                  </button>
                </div>

                {/* Notification Section - Collapsible */}
                {showNotifySection && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200"
                  >
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      Send Notification to Participants
                    </h3>
                    
                    <div className="bg-white rounded-lg p-4 mb-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Notification will be sent to:</span>
                        <span className="text-2xl font-bold text-blue-600">{participantCount}</span>
                      </div>
                      <p className="text-xs text-gray-600">registered participant{participantCount !== 1 ? 's' : ''}</p>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Message (Optional)
                      </label>
                      <textarea
                        value={notificationMessage}
                        onChange={(e) => setNotificationMessage(e.target.value)}
                        placeholder="Add a custom message for participants (e.g., 'Please bring your student ID', 'Venue has been changed to...', etc.)"
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This message will be included in the notification email along with event details
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSendNotification}
                        disabled={sendingNotification || participantCount === 0}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {sendingNotification ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            Send Notification
                          </>
                        )}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCancelNotification}
                        disabled={sendingNotification}
                        className="flex-1 bg-white border-2 border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </motion.button>
                    </div>

                    {participantCount === 0 && (
                      <p className="text-sm text-amber-600 mt-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        No participants have registered for this event yet.
                      </p>
                    )}
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
      {/* Registrations table (organizer/admin only) */}
      {currentUser && (currentUser.role === 'organizer' || currentUser.role === 'admin') && isOwner && (
        <div id="registrations" className="max-w-7xl mx-auto p-4">
          <div className="mt-8 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-lg p-6 border border-purple-100">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Registered Students
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">View all student registrations</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <div className="text-white font-semibold">Total: {registrations.length}</div>
                  </div>
                  
                  {/* Export buttons */}
                  {registrations.length > 0 && (
                    <>
                      <button 
                        onClick={exportCSV} 
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all shadow-md"
                        title="Export as CSV"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export CSV
                      </button>
                      
                      <button 
                        onClick={exportPDF} 
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all shadow-md"
                        title="Export as PDF"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Export PDF
                      </button>
                    </>
                  )}
                  
                  <button onClick={openRegistrations} className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-purple-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 text-purple-600 font-semibold transition-all shadow-md">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl bg-white shadow-md">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-purple-600 to-indigo-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Student</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Dept</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Student ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Registered At</th>
                  </tr>
                </thead>

                <tbody className="bg-white">
                  {registrations.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <p className="text-base font-medium text-gray-600">No registrations yet</p>
                          <p className="text-sm text-gray-400 mt-1">Students will appear here once they register</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    registrations.map((r, index) => (
                      <tr 
                        key={r._id} 
                        className={`transition-all duration-200 hover:bg-gradient-to-r hover:from-amber-50 hover:to-yellow-50 hover:shadow-md ${
                          index % 2 === 0 
                            ? 'bg-white' 
                            : 'bg-gradient-to-r from-purple-50 to-indigo-50'
                        }`}
                      >
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="relative">
                                <img 
                                  className="h-12 w-12 rounded-full object-cover ring-2 ring-purple-200 shadow-sm" 
                                  src={r.student_id?.profilePic ? `${BASE}/${r.student_id.profilePic}` : `https://ui-avatars.com/api/?name=${r.student_id?.name || r.student_id?.email.split('@')[0]}&background=7e22ce&color=fff`} 
                                  alt="" 
                                />
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900">{r.student_id?.name || 'No name'}</div>
                              <div className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-0.5 rounded mt-1 inline-block">
                                {r.student_id?._id?.substring(0,8)}...
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="text-sm text-gray-700">{r.student_id?.email}</div>
                          </div>
                        </td>

                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 shadow-sm">
                            {r.student_id?.dept || 'N/A'}
                          </span>
                        </td>

                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-mono bg-gradient-to-r from-gray-50 to-purple-50 px-3 py-1.5 rounded-lg inline-block font-semibold shadow-sm">
                            {r.student_id?.student_id || 'N/A'}
                          </div>
                        </td>

                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-600">
                            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-700">
                                {new Date(r.createdAt).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(r.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventDetail;