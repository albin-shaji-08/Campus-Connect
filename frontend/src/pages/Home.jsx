

import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import HeroCarousel from '../components/common/HeroCarousel'
import EventsGrid from './EventsGrid'

export default function Home() {
  const { role, logout } = useAuth();

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 py-6">

      </div>
      <HeroCarousel/>
      <EventsGrid/>
    </div>
  )
}
