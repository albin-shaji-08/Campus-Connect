import axios from 'axios';

export const registerForEvent = async (eventId, BASE) => {
  return axios.post(
    `${BASE}/api/registrations/register`,
    { event_id: eventId },
    { withCredentials: true }
  );
};

export const getMyRegistrations = async (BASE) => {
  const res = await axios.get(`${BASE}/api/registrations/my`, { withCredentials: true });
  return res.data;
};

export const getEventRegistrations = async (eventId, BASE) => {
  const res = await axios.get(`${BASE}/api/registrations/event/${eventId}`, { withCredentials: true });
  return res.data;
};
