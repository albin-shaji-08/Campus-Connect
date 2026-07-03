import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { FiMail, FiLock } from 'react-icons/fi';

function UnifiedLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const BASE = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';

  // Dev-only credential store (persisted in localStorage)
  const DEV_CREDS_KEY = 'devCredentials';
  const isDev = !!import.meta.env.DEV;
  const [devCreds, setDevCreds] = useState([]);
  const [devName, setDevName] = useState('');
  const [devEmail, setDevEmail] = useState('');
  const [devPassword, setDevPassword] = useState('');
  const [selectedCredIndex, setSelectedCredIndex] = useState(-1);
  const [devHelperOpen, setDevHelperOpen] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axios.post(
        `${BASE}/api/auth/login`,
        { email, password, remember },
        { withCredentials: true }
      );
      if (res.status === 200) {
        login(res.data.role);
        // If backend returned token in JSON (useful in dev when cookies/SameSite block cookies), set Authorization header
        if (res.data.token && import.meta.env.DEV) {
          axios.defaults.headers.common.Authorization = `Bearer ${res.data.token}`;
          // persist token for this session or permanently based on remember
          if (remember) {
            localStorage.setItem('token', res.data.token);
          } else {
            sessionStorage.setItem('token', res.data.token);
          }
        }
        toast.success('Login successful!');
        setTimeout(() => {
          if (res.data.role === 'admin') {
            navigate('/admin/dashboard');
          } else if (res.data.role === 'organizer') {
            navigate('/dashboard');
          } else {
            navigate('/');
          }
        }, 500);
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.emailVerified === false) {
        toast.error(err.response.data.msg, { duration: 5000 });
        setShowResendButton(true);
        setUnverifiedEmail(err.response.data.email);
      } else {
        toast.error(err.response?.data?.msg || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setResending(true);
      await axios.post(`${BASE}/api/auth/resend-verification`, { email: unverifiedEmail });
      toast.success('Verification email sent! Please check your inbox.', { duration: 5000 });
      setShowResendButton(false);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    if (!isDev) return;
    try {
      const raw = localStorage.getItem(DEV_CREDS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setDevCreds(parsed);
    } catch (e) {
      // ignore malformed localStorage
    }
  }, []);

  const persistDevCreds = (next) => {
    setDevCreds(next);
    try {
      localStorage.setItem(DEV_CREDS_KEY, JSON.stringify(next));
    } catch (e) {
      // ignore storage errors
    }
  };

  const addDevCred = () => {
    if (!devEmail || !devPassword) return;
    const pair = { name: devName || devEmail, email: devEmail, password: devPassword };
    const next = [...devCreds, pair];
    persistDevCreds(next);
    setDevName('');
    setDevEmail('');
    setDevPassword('');
  };

  const removeDevCred = (index) => {
    const next = devCreds.filter((_, i) => i !== index);
    persistDevCreds(next);
    if (selectedCredIndex === index) {
      setSelectedCredIndex(-1);
      setEmail('');
      setPassword('');
    }
  };

  const autofillSelected = () => {
    if (selectedCredIndex < 0 || selectedCredIndex >= devCreds.length) return;
    const c = devCreds[selectedCredIndex];
    setEmail(c.email);
    setPassword(c.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-center">
            <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
            <p className="text-purple-100 mt-1">Sign in to your account</p>
          </div>
          <div className="p-6 sm:p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
                {/* Dev helper disabled */}
                {false && isDev && (
                  <div className="border-t pt-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setDevHelperOpen((s) => !s)}
                      className="w-full flex items-center justify-between text-sm text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-50"
                    >
                      <span>Dev credential helper (dev only)</span>
                      <svg
                        className={`w-4 h-4 transform transition-transform ${devHelperOpen ? 'rotate-180' : ''}`}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {devHelperOpen && (
                      <div className="mt-3">
                        <div className="flex gap-2 items-center mb-2">
                          <select
                            value={selectedCredIndex}
                            onChange={(e) => {
                              const idx = Number(e.target.value);
                              setSelectedCredIndex(idx);
                              if (idx >= 0 && idx < devCreds.length) {
                                const c = devCreds[idx];
                                setEmail(c.email);
                                setPassword(c.password);
                              } else {
                                setEmail('');
                                setPassword('');
                              }
                            }}
                            className="flex-1 py-2 px-3 border rounded-lg"
                          >
                            <option value={-1}>-- select saved credential --</option>
                            {devCreds.map((c, i) => (
                              <option key={i} value={i}>{c.name} — {c.email}</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-3 gap-2 items-end mb-2">
                          <input
                            placeholder="Label (optional)"
                            value={devName}
                            onChange={(e) => setDevName(e.target.value)}
                            className="col-span-1 py-2 px-3 border rounded-lg"
                          />
                          <input
                            placeholder="Email"
                            value={devEmail}
                            onChange={(e) => setDevEmail(e.target.value)}
                            className="col-span-1 py-2 px-3 border rounded-lg"
                          />
                          <input
                            placeholder="Password"
                            value={devPassword}
                            onChange={(e) => setDevPassword(e.target.value)}
                            className="col-span-1 py-2 px-3 border rounded-lg"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={addDevCred} className="py-2 px-3 bg-green-600 text-white rounded-lg">Add</button>
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedCredIndex >= 0) removeDevCred(selectedCredIndex);
                            }}
                            className="py-2 px-3 bg-red-600 text-white rounded-lg"
                          >
                            Remove Selected
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCredIndex(-1);
                              setEmail('');
                              setPassword('');
                            }}
                            className="py-2 px-3 bg-gray-200 rounded-lg"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-medium shadow-md hover:from-purple-700 hover:to-indigo-700 transition-all"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </motion.button>

              {/* Resend Verification Email Button */}
              {showResendButton && (
                <motion.button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resending}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-yellow-500 text-white py-3 rounded-lg font-medium shadow-md hover:bg-yellow-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resending ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </div>
                  ) : (
                    '📧 Resend Verification Email'
                  )}
                </motion.button>
              )}
            </form>
            <div className="mt-3 flex items-center">
              <input id="remember" type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="mr-2" />
              <label htmlFor="remember" className="text-sm text-gray-600">Remember me on this device</label>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default UnifiedLogin;
