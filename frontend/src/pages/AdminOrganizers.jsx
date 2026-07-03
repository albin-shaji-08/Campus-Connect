import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiUser, FiMail, FiCalendar, FiTrash2, FiSearch } from 'react-icons/fi';
import { IoMdRefresh } from 'react-icons/io';
import toast from 'react-hot-toast';

export default function AdminOrganizers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 8;
  const BASE = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchUsers();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
  try {
  const res = await axios.get(`${BASE}/api/users?role=organizer`, { withCredentials: true });
  setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch organizers:', err.message);
      toast.error('Failed to load organizers');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this organizer?')) return;
    try {
      await axios.delete(`${BASE}/api/users/${id}`, { withCredentials: true });
      setUsers(users.filter((u) => u._id !== id));
      toast.success('Organizer deleted successfully');
    } catch (err) {
      toast.error('Failed to delete organizer');
    }
  };

  // Pagination
  const filteredUsers = users.filter(user => user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || user.email?.toLowerCase().includes(searchTerm.toLowerCase()));
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const openModal = () => setShowModal(true);
  const closeModal = () => {
    setShowModal(false); setName(''); setEmail(''); setPassword('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      await axios.post(`${BASE}/api/users/organizer`, { name, email, password }, { withCredentials: true });
      toast.success('Organizer created');
      await fetchUsers();
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to create organizer');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64 ">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
    </div>
  );

  return (
  <div className="p-4 md:p-6 bg-gray-50 max-w-7xl mx-auto relative">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Clubs / Organizers</h2>
        <div className="flex items-center space-x-3">
          <button onClick={openModal} className="px-4 py-2 bg-violet-600 text-white rounded">Add Organizer/Club</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-violet-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-violet-800 uppercase tracking-wider">Organizer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-violet-800 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-violet-800 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-violet-800 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentUsers.length > 0 ? (
                currentUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img className="h-10 w-10 rounded-full object-cover" src={user.profilePic ? `${BASE}/${user.profilePic}` : `https://ui-avatars.com/api/?name=${user.name || user.email.split('@')[0]}&background=7e22ce&color=fff`} alt="" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name || 'No name'}</div>
                          <div className="text-sm text-gray-500">ID: {user._id.substring(0,6)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center"><FiMail className="flex-shrink-0 mr-2 text-gray-400" /><div className="text-sm text-gray-900">{user.email}</div></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center"><FiCalendar className="flex-shrink-0 mr-2 text-gray-400" /><div className="text-sm text-gray-500">{formatDate(user.createdAt)}</div></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button className="text-red-600 hover:text-red-800" onClick={() => handleDelete(user._id)}><FiTrash2 className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No organizers available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <>
          {/* Backdrop: subtle dark + blur */}
          <div
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm"
            onClick={closeModal}
          />

          <div className="fixed top-12 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md">
            <div className="bg-white rounded-lg p-6 shadow-2xl border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium mb-4">Add Organizer / Club</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input value={name} onChange={e=>setName(e.target.value)} className="w-full p-2 border rounded" placeholder="Name" required />
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-2 border rounded" placeholder="Email" required />
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-2 border rounded" placeholder="Password" required />
              <div className="flex justify-end space-x-2 mt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" disabled={creating} className="px-4 py-2 bg-violet-600 text-white rounded">{creating ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
