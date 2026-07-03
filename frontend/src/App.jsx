import React from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/common/Navbar'
import ProtectedRoute from './components/common/ProtectedRoute'
import UnifiedLogin from './components/common/UnifiedLogin'
import UserRegister from './components/user/UserRegister'
import Profile from './components/user/Profile'
import Home from './pages/Home'
import AdminUsers from './pages/AdminUsers'
import AdminBanner from './pages/AdminBanner'
import AdminTickets from './pages/AdminTickets'
import AdminMessages from './pages/AdminMessages'
import AdminEvents from './pages/AdminEvents'
import AdminDashboard from './pages/AdminDashboard'
import AdminDashboardMain from './pages/AdminDashboardMain'
import AdminCreateOrganizer from './pages/AdminCreateOrganizer'
import AdminOrganizers from './pages/AdminOrganizers'
import EventsGrid from './pages/EventsGrid'
import EventDetail from './pages/EventDetail'
import MyEvents from './pages/MyEvents'
import CreateEvent from './pages/CreateEvent'
import OrganizerEvents from './pages/OrganizerEvents'
import OrganizerDashboard from './pages/OrganizerDashboard'
import Footer from './components/common/Footer'
import Contact from './pages/Contact'
import VerifyEmail from './pages/VerifyEmail'

export default function App() {
  const location = useLocation();
  const showFooter = location.pathname === '/';

  return (
    <div>
      <Navbar />
      <Routes>
  {/* Admin Routes - Protected */}
    <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboardMain /></ProtectedRoute>} />
    <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
    <Route path="/admin/organizers" element={<ProtectedRoute allowedRoles={['admin']}><AdminOrganizers /></ProtectedRoute>} />
    <Route path="/admin/create-organizer" element={<ProtectedRoute allowedRoles={['admin']}><AdminCreateOrganizer /></ProtectedRoute>} />
        <Route path="/admin/banners" element={<ProtectedRoute allowedRoles={['admin']}><AdminBanner /></ProtectedRoute>} />
        <Route path="/admin/tickets" element={<ProtectedRoute allowedRoles={['admin']}><AdminTickets /></ProtectedRoute>} />
        <Route path="/admin/messages" element={<ProtectedRoute allowedRoles={['admin']}><AdminMessages /></ProtectedRoute>} />
        <Route path="/admin/events" element={<ProtectedRoute allowedRoles={['admin']}><AdminEvents /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />

  {/* Organizer Routes - Protected */}
  <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['organizer']}><OrganizerDashboard /></ProtectedRoute>} />
  <Route path="/events/create" element={<ProtectedRoute allowedRoles={['organizer', 'admin']}><CreateEvent /></ProtectedRoute>} />
  <Route path="/events/edit/:id" element={<ProtectedRoute allowedRoles={['organizer', 'admin']}><CreateEvent /></ProtectedRoute>} />
    <Route path="/organizer/events" element={<ProtectedRoute allowedRoles={['organizer']}><OrganizerEvents /></ProtectedRoute>} />

  {/* Student Routes - Protected */}
  <Route path="/my-events" element={<ProtectedRoute allowedRoles={['student']}><MyEvents /></ProtectedRoute>} />
  
  {/* User Routes - Protected (any logged in user) */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

  {/* Public Routes */}
  <Route path="/login" element={<UnifiedLogin />} />
        <Route path="/register" element={<UserRegister />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<EventsGrid />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
      {showFooter && <Footer />}
    </div>
  )
}