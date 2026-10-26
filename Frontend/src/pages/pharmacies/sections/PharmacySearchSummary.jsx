import { HiOutlineBuildingStorefront, HiOutlineMapPin } from 'react-icons/hi2'
import { MdMedication } from 'react-icons/md'

function formatCoordinate(value) {
  const c = Number(value)
  return Number.isFinite(c) ? c.toFixed(4) : null
}

function Stat({ icon: Icon, label, value, note }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-white/10 p-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-400 text-primary-900">
        <Icon size={20} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">{label}</p>
        <p className="truncate text-sm font-bold text-white">{value}</p>
        {note && <p className="truncate text-xs text-white/60">{note}</p>}
      </div>
    </div>
  )
}

function PharmacySearchSummary({
  medicine = {},
  pharmacyCount = 0,
  location = null,
  radiusKm = 50,
  isRanked = false,
}) {
  const { name = 'All Jan Aushadhi Kendras', genericName = '' } = medicine
  const lat = formatCoordinate(location?.lat)
  const lng = formatCoordinate(location?.lng)

  return (
    <section
      aria-labelledby="pharmacy-summary-heading"
      className="relative overflow-hidden rounded-3xl bg-primary-800 text-white"
    >
      <div className="absolute inset-0 bg-blister" aria-hidden="true" />
      <div className="relative p-6 sm:p-8">
        <p className="text-sm font-medium text-accent-300">
          {isRanked ? 'Best Kendras for' : 'Jan Aushadhi Kendras'}
        </p>
        <h1
          id="pharmacy-summary-heading"
          className="mt-1 font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl"
        >
          {isRanked ? name : 'Kendras near you'}
        </h1>
        {isRanked && genericName && (
          <p className="mt-1 text-sm text-white/70">{genericName}</p>
        )}

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat
            icon={MdMedication}
            label={isRanked ? 'Medicine' : 'Showing'}
            value={isRanked ? name : 'All Kendras'}
            note={isRanked ? 'Ranked on your preferences' : 'Sorted by distance'}
          />
          <Stat
            icon={HiOutlineMapPin}
            label="Your location"
            value={lat && lng ? `${lat}, ${lng}` : 'Getting your location…'}
            note={lat && lng ? 'Latitude, longitude' : 'Permission may be needed'}
          />
          <Stat
            icon={HiOutlineBuildingStorefront}
            label={isRanked ? 'Kendras with stock' : 'Kendras found'}
            value={`${pharmacyCount} found`}
            note={`Within ${radiusKm} km`}
          />
        </div>
      </div>
    </section>
  )
}

export default PharmacySearchSummary