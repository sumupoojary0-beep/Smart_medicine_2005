/**
 * useGeolocation
 *
 * Wraps the browser Geolocation API. Falls back to a default location
 * (Mysuru city center, matching our seeded Kendra data) if the user
 * denies permission, the browser doesn't support it, or it times out —
 * so the page still shows something useful instead of a dead end.
 */
import { useState, useEffect } from 'react'

const FALLBACK_LOCATION = { lat: 12.3052, lng: 76.6551 } // Mysuru city center

const isSupported = () =>
  typeof navigator !== 'undefined' && 'geolocation' in navigator

export function useGeolocation() {
  // When the browser has no geolocation, start directly in the fallback
  // state (no setState needed inside the effect).
  const [location, setLocation] = useState(() =>
    isSupported() ? null : FALLBACK_LOCATION,
  )
  const [status, setStatus] = useState(() =>
    isSupported() ? 'locating' : 'fallback',
  ) // 'locating' | 'granted' | 'fallback'

  useEffect(() => {
    if (!isSupported()) return

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setStatus('granted')
      },
      () => {
        setLocation(FALLBACK_LOCATION)
        setStatus('fallback')
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    )
  }, [])

  return { location, status }
}
