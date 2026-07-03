import axios from 'axios';

export const getEventRegistrations = async (eventId, BASE) => {
  // Assumes an endpoint exists: /api/tickets/event/:eventId
  const res = await axios.get(`${BASE}/api/tickets/event/${eventId}`, { withCredentials: true });
  return res.data; // Should be an array of users/students
};
