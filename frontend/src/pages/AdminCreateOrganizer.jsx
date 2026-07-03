import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function AdminCreateOrganizer() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const BASE = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post(`${BASE}/api/users/organizer`, { name, email, password }, { withCredentials: true });
      toast.success('Organizer created');
      setName(''); setEmail(''); setPassword('');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to create organizer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Create Club / Organizer</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input value={name} onChange={e=>setName(e.target.value)} className="w-full p-2 border rounded" placeholder="Name" required />
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-2 border rounded" placeholder="Email" required />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-2 border rounded" placeholder="Password" required />
        <button disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded">{loading ? 'Creating...' : 'Create Organizer'}</button>
      </form>
    </div>
  );
}
