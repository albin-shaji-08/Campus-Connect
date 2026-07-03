import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { toInputValue } from '../utils/date';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CreateEvent() {
  const BASE = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';
  const { role } = useAuth();
  const { id } = useParams();
  const [form, setForm] = useState({ title: '', description: '', venue: '', date: '', registrationClosesAt: '', maxParticipants: '', image: null, _id: null });
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        const res = await axios.get(`${BASE}/api/events/${id}`);
        const event = res.data;
        const copy = { ...event, image: null, _id: event._id };
        copy.date = toInputValue(event.date);
        copy.registrationClosesAt = toInputValue(event.registrationClosesAt);
        setForm(copy);
        setImagePreview(`${BASE}/${event.image}`);
      } catch (err) {
        toast.error('Failed to load event for editing');
        // Redirect based on role
        navigate(role === 'admin' ? '/admin/events' : '/organizer/events');
      }
    };
    fetch();
  }, [id, role]);

  const handleChange = (e) => {
    if (e.target.name === 'image') {
      const file = e.target.files[0];
      setForm({ ...form, image: file });
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
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
    try {
      const fd = new FormData();
      for (let key in form) {
        if (form[key]) fd.append(key, form[key]);
      }
      if (id || form._id) {
        const eid = id || form._id;
        await axios.put(`${BASE}/api/events/${eid}`, fd, { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Event updated');
      } else {
        await axios.post(`${BASE}/api/events`, fd, { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Event created');
      }
      // Redirect based on role
      navigate(role === 'admin' ? '/admin/events' : '/organizer/events');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-purple-600 to-indigo-600">
            <h2 className="text-xl font-bold text-white">{id || form._id ? 'Edit Event' : 'Create Event'}</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                  <input name="title" value={form.title} onChange={handleChange} placeholder="Enter event title" required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                  <input name="venue" value={form.venue} onChange={handleChange} placeholder="Enter venue" required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date & time</label>
                  <input name="date" type="datetime-local" value={form.date} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Closes At</label>
                  <input name="registrationClosesAt" type="datetime-local" value={form.registrationClosesAt} onChange={handleChange} max={form.date} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" />
                  <p className="text-xs text-gray-500 mt-1">Registration will close at this time</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Participants</label>
                  <input name="maxParticipants" type="number" min="1" value={form.maxParticipants} onChange={handleChange} placeholder="Enter max participants" required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" />
                  <p className="text-xs text-gray-500 mt-1">Maximum number of students who can register</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Image</label>
                  <input name="image" type="file" accept="image/*" onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition-all" />
                </div>
              </div>

              {imagePreview && (<div className="mt-2"><img src={imagePreview} alt="Preview" className="h-32 object-cover rounded-md" /></div>)}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} placeholder="Enter event description" rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                {(id || form._id) && (
                  <button 
                    type="button" 
                    onClick={() => navigate(`/event/${id || form._id}`)}
                    className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium shadow-sm hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                )}
                <button type="submit" className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-lg font-medium shadow-md hover:from-purple-700 hover:to-indigo-700 transition-all" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center justify-center"><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Processing...</span>
                  ) : (id || form._id ? 'Update Event' : 'Create Event')}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
