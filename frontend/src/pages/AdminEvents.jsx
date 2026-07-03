import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEventRegistrations } from '../api/registration';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toInputValue } from '../utils/date';
import { FiEdit2, FiTrash2, FiCalendar, FiMapPin, FiDollarSign } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import { FaTicketAlt } from 'react-icons/fa';

function AdminEvents() {
  const BASE = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    venue: '',
    date: '',
    registrationClosesAt: '',
    maxParticipants: '',
    image: null,
    _id: null
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [showRegistrations, setShowRegistrations] = useState(null); // eventId or null
  const [registrations, setRegistrations] = useState([]);
  const [regLoading, setRegLoading] = useState(false);
  const navigate = useNavigate();

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${BASE}/api/events`);
      setEvents(res.data);
    } catch (err) {
      toast.error('Failed to fetch events');
    }
  };

  useEffect(() => {
    fetchEvents();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  const handleChange = (e) => {
    if (e.target.name === 'image') {
      const file = e.target.files[0];
      setForm({ ...form, image: file });

      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setImagePreview('');
      }
    } else if (e.target.name === 'date') {
      const newDate = e.target.value;
      // When date changes, update registrationClosesAt to match it if it's empty or exceeds new date
      const updates = { date: newDate };
      if (!form.registrationClosesAt || form.registrationClosesAt > newDate) {
        updates.registrationClosesAt = newDate;
      }
      setForm({ ...form, ...updates });
    } else if (e.target.name === 'registrationClosesAt') {
      const closingTime = e.target.value;
      // Validate that closing time doesn't exceed event date
      if (form.date && closingTime > form.date) {
        toast.error('Registration closing time cannot be after event time');
        return;
      }
      setForm({ ...form, [e.target.name]: closingTime });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate registration closing time
    if (form.registrationClosesAt && form.date && form.registrationClosesAt > form.date) {
      toast.error('Registration closing time must be before event time');
      return;
    }
    
    setLoading(true);

    const formData = new FormData();
    for (let key in form) {
      if (form[key]) formData.append(key, form[key]);
    }

    try {
      if (editing) {
        await axios.put(`${BASE}/api/events/${form._id}`, formData, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Event updated successfully');
      } else {
        await axios.post(`${BASE}/api/events`, formData, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Event created successfully');
      }

      resetForm();
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      venue: '',
      date: '',
      registrationClosesAt: '',
      maxParticipants: '',
      image: null,
      _id: null
    });
    setImagePreview('');
    setEditing(false);
  };

  const handleEdit = (event) => {
    setEditing(true);
    // convert stored ISO date to datetime-local input value
    const copy = { ...event, image: null };
    copy.date = toInputValue(event.date);
    copy.registrationClosesAt = toInputValue(event.registrationClosesAt);
    setForm(copy);
    setImagePreview(`${BASE}/${event.image}`);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await axios.delete(`${BASE}/api/events/${id}`, { withCredentials: true });
      toast.success('Event deleted successfully');
      fetchEvents();
    } catch (err) {
      toast.error('Failed to delete event');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Toaster position="top-center" />
      <div className="max-w-7xl mx-auto">
        {/* Event Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8 bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl"
        >
          <div className="p-6 bg-gradient-to-r from-purple-600 to-indigo-600">
            <h2 className="text-xl font-bold text-white">
              {editing ? 'Edit Event' : 'Create New Event'}
            </h2>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Enter event title"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                  <input
                    name="venue"
                    value={form.venue}
                    onChange={handleChange}
                    placeholder="Enter venue"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date & time</label>
                  <input
                    name="date"
                    type="datetime-local"
                    value={form.date}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Closes At</label>
                  <input
                    name="registrationClosesAt"
                    type="datetime-local"
                    value={form.registrationClosesAt}
                    onChange={handleChange}
                    max={form.date}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Registration will close at this time</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Participants</label>
                  <input
                    name="maxParticipants"
                    type="number"
                    min="1"
                    value={form.maxParticipants}
                    onChange={handleChange}
                    placeholder="Enter max participants"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum number of students who can register</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Image</label>
                  <input
                    name="image"
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition-all"
                  />
                </div>
              </div>

              {imagePreview && (
                <div className="mt-2">
                  <img src={imagePreview} alt="Preview" className="h-32 object-cover rounded-md" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Enter event description"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-lg font-medium shadow-md hover:from-purple-700 hover:to-indigo-700 transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    editing ? 'Update Event' : 'Create Event'
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Events List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          <div className="p-6 bg-gradient-to-r from-purple-600 to-indigo-600">
            <h3 className="text-xl font-bold text-white">All Events</h3>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden p-4">
            {events.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No events found</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {events.map((event) => (
                  <div key={event._id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/event/${event._id}`)}
                  >
                    <div className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <img
                            className="h-20 w-20 rounded-md object-cover"
                            src={`${BASE}/${event.image}`}
                            alt={event.title}
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{event.title}</h3>
                          <p className="text-sm text-gray-500">{event.venue}</p>

                          <div className="mt-2 space-y-1">
                            <div className="flex items-center text-sm text-gray-600">
                              <FiCalendar className="mr-2 text-purple-500" />
                              <span>{formatDate(event.date)}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                            </div>

                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end space-x-2">
                        <button
                          onClick={e => { e.stopPropagation(); handleEdit(event); }}
                          className="p-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(event._id); }}
                          className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                        <button
                          onClick={async e => {
                            e.stopPropagation();
                            setShowRegistrations(event._id);
                            setRegLoading(true);
                            try {
                              const regs = await getEventRegistrations(event._id, BASE);
                              setRegistrations(regs);
                            } catch {
                              setRegistrations([]);
                            }
                            setRegLoading(false);
                          }}
                          className="p-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                          title="Show Registrations"
                        >
                          <FaTicketAlt />
                        </button>
                      </div>
                      {showRegistrations === event._id && (
                        <div className="mt-4 bg-gray-50 border border-gray-200 rounded p-3">
                          <h4 className="font-semibold mb-2 text-gray-700">Registered Students</h4>
                          {regLoading ? (
                            <div className="text-gray-500">Loading...</div>
                          ) : registrations.length === 0 ? (
                            <div className="text-gray-400">No registrations</div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Name</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Email</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Department</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Student ID</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {registrations.map((reg, idx) => (
                                    <tr key={reg._id || reg.student_id?._id || idx} className="hover:bg-gray-50">
                                      <td className="px-3 py-2 text-gray-700">{reg.student_id?.name || 'Unknown'}</td>
                                      <td className="px-3 py-2 text-gray-600">{reg.student_id?.email || 'No email'}</td>
                                      <td className="px-3 py-2 text-gray-600">{reg.student_id?.dept || 'N/A'}</td>
                                      <td className="px-3 py-2 text-gray-600 font-mono">{reg.student_id?.student_id || 'N/A'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                          <button onClick={e => { e.stopPropagation(); setShowRegistrations(null); }} className="mt-2 text-xs text-purple-600 hover:underline">Close</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event) => (
                  <React.Fragment key={event._id}>
                  <tr
                    className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                    onClick={() => navigate(`/event/${event._id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-16 w-16">
                          <img
                            className="h-16 w-16 rounded-md object-cover"
                            src={`${BASE}/${event.image}`}
                            alt={event.title}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{event.title}</div>
                          <div className="text-sm text-gray-500">{event.venue}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center mb-1">
                          <FiCalendar className="mr-2 text-purple-500" />
                          {formatDate(event.date)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={e => { e.stopPropagation(); handleEdit(event); }}
                          className="p-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(event._id); }}
                          className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                        <button
                          onClick={async e => {
                            e.stopPropagation();
                            setShowRegistrations(event._id);
                            setRegLoading(true);
                            try {
                              const regs = await getEventRegistrations(event._id, BASE);
                              setRegistrations(regs);
                            } catch {
                              setRegistrations([]);
                            }
                            setRegLoading(false);
                          }}
                          className="p-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                          title="Show Registrations"
                        >
                          <FaTicketAlt />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {showRegistrations === event._id && (
                    <tr>
                      <td colSpan={3} className="bg-gray-50 border border-gray-200 rounded p-3">
                        <h4 className="font-semibold mb-2 text-gray-700">Registered Students</h4>
                        {regLoading ? (
                          <div className="text-gray-500">Loading...</div>
                        ) : registrations.length === 0 ? (
                          <div className="text-gray-400">No registrations</div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Name</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Email</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Department</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Student ID</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {registrations.map((reg, idx) => (
                                  <tr key={reg._id || reg.student_id?._id || idx} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 text-gray-700">{reg.student_id?.name || 'Unknown'}</td>
                                    <td className="px-3 py-2 text-gray-600">{reg.student_id?.email || 'No email'}</td>
                                    <td className="px-3 py-2 text-gray-600">{reg.student_id?.dept || 'N/A'}</td>
                                    <td className="px-3 py-2 text-gray-600 font-mono">{reg.student_id?.student_id || 'N/A'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        <button onClick={e => { e.stopPropagation(); setShowRegistrations(null); }} className="mt-2 text-xs text-purple-600 hover:underline">Close</button>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default AdminEvents;