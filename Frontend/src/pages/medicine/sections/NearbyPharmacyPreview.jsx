import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  HiOutlineArrowRight,
  HiOutlineMapPin,
  HiOutlinePhone,
} from 'react-icons/hi2'
import { MdLocalPharmacy } from 'react-icons/md'

import Badge from '../../../components/ui/Badge'
import { ROUTES } from '../../../constants/routes'
import kendraService from '../../../services/kendraService'

const SEARCH_RADIUS_KM = 50

const STOCK = {
  in_stock: { variant: 'success', label: 'In stock' },
  low_stock: { variant: 'warning', label: 'Low stock' },
  out_of_stock: { variant: 'danger', label: 'Out of stock' },
}

const NO_GEO = 'Location is not supported by this browser.'

function Shell({ title, right, children }) {
  return (
    <section
      aria-labelledby="nearby-pharmacy-heading"
      className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
            <MdLocalPharmacy size={19} />
          </span>
          <h2
            id="nearby-pharmacy-heading"
            className="text-lg font-bold text-slate-900"
          >
            {title}
          </h2>
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

function NearbyPharmacyPreview({ pmbiCode }) {
  const hasGeo = typeof navigator !== 'undefined' && !!navigator.geolocation
  const [location, setLocation] = useState(null)
  const [locationError, setLocationError] = useState(hasGeo ? '' : NO_GEO)
  const [isLocating, setIsLocating] = useState(hasGeo)

  useEffect(() => {
    if (!hasGeo) return
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setLocationError('')
        setIsLocating(false)
      },
      (error) => {
        let message = 'Unable to get your location.'
        if (error.code === error.PERMISSION_DENIED) {
          message =
            'Location permission was denied. Allow location access to find nearby Kendras.'
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = 'Your current location is unavailable.'
        } else if (error.code === error.TIMEOUT) {
          message = 'Getting your location took too long.'
        }
        setLocationError(message)
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }, [hasGeo])

  const {
    data: availability,
    isLoading: isLoadingKendras,
    isError: isKendraError,
    refetch,
  } = useQuery({
    queryKey: [
      'medicine-nearby-kendras',
      pmbiCode,
      location?.latitude,
      location?.longitude,
    ],
    queryFn: async () => {
      const { data } = await kendraService.findMedicineNearby(
        pmbiCode,
        location.latitude,
        location.longitude,
        SEARCH_RADIUS_KM,
        true,
      )
      return data
    },
    enabled: Boolean(pmbiCode && location?.latitude && location?.longitude),
  })

  const nearest = Array.isArray(availability) ? availability[0] : undefined

  if (isLocating || isLoadingKendras) {
    return (
      <Shell title="Nearest Kendra">
        <div className="flex items-center justify-center rounded-xl bg-slate-50 p-8">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-100 border-t-primary-600" />
            <p className="mt-3 text-sm text-slate-500">
              Finding Kendras near you…
            </p>
          </div>
        </div>
      </Shell>
    )
  }

  if (locationError) {
    return (
      <Shell title="Location needed">
        <div className="rounded-xl border border-accent-200 bg-accent-50 p-4">
          <p className="text-sm text-slate-800">{locationError}</p>
          <p className="mt-2 text-xs text-slate-600">
            Click the location icon in your browser address bar, choose Allow,
            and refresh the page.
          </p>
        </div>
      </Shell>
    )
  }

  if (isKendraError) {
    return (
      <Shell title="Nearby Kendras">
        <div className="rounded-xl bg-red-50 p-4 text-center">
          <p className="text-sm text-red-700">
            Unable to load nearby Kendra availability.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white"
          >
            Try again
          </button>
        </div>
      </Shell>
    )
  }

  if (!nearest) {
    return (
      <Shell title="Nearby availability">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-sm font-semibold text-slate-700">
            No nearby Kendra currently has this medicine.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            We searched within {SEARCH_RADIUS_KM} km of your location.
          </p>
        </div>
      </Shell>
    )
  }

  const stock = STOCK[nearest.status] || STOCK.in_stock
  const distance = Number(nearest.distance_km).toFixed(2)
  const mapUrl =
    `https://www.google.com/maps/search/?api=1&query=` +
    `${nearest.latitude},${nearest.longitude}`
  const batch = nearest.batches?.[0] || null
  const expiry = batch?.expiry_date
    ? new Date(batch.expiry_date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Not available'
  const nearbyPageUrl =
    `${ROUTES.USER.NEARBY_PHARMACIES}` +
    `?medicine=${encodeURIComponent(pmbiCode)}` +
    `&lat=${location.latitude}&lng=${location.longitude}`

  return (
    <Shell
      title="Nearest Kendra"
      right={
        <Badge variant={stock.variant} dot size="sm">
          {stock.label}
        </Badge>
      }
    >
      <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900">
              {nearest.kendra_name}
            </h3>
            <div className="mt-1 flex items-start gap-1 text-xs text-slate-500">
              <HiOutlineMapPin size={12} className="mt-0.5 shrink-0" />
              <span>{nearest.address}</span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-lg font-extrabold text-primary-700">
              {distance} km
            </p>
            <p className="text-xs text-slate-500">Qty: {nearest.total_qty}</p>
          </div>
        </div>

        {nearest.phone && (
          <a
            href={`tel:${nearest.phone.replace(/\s/g, '')}`}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-primary-700"
          >
            <HiOutlinePhone size={12} />
            {nearest.phone}
          </a>
        )}

        {batch && (
          <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-3 text-xs">
            {[
              ['Batch number', batch.batch_number],
              ['Batch quantity', batch.quantity],
              ['Manufacturer', batch.manufacturer],
              ['Expiry date', expiry],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0">
                <p className="text-slate-400">{label}</p>
                <p className="mt-0.5 break-words font-medium text-slate-700">
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <a
          href={mapUrl}
          target="_blank"
          rel="noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-800"
        >
          <HiOutlineMapPin size={15} />
          View on map
        </a>
        <Link
          to={nearbyPageUrl}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-primary-200 px-4 py-2.5 text-sm font-semibold text-primary-700 hover:bg-primary-50"
        >
          Find more Kendras
          <HiOutlineArrowRight size={14} />
        </Link>
      </div>
    </Shell>
  )
}

export default NearbyPharmacyPreview