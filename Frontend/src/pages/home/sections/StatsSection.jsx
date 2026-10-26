/**
 * StatsSection: PM Jan Aushadhi at a glance.
 * Only publicly reported national figures are shown, each with its source.
 * No platform-user counts are shown until a live endpoint exists.
 */
import { MdMedication } from 'react-icons/md'
import { HiOutlineBuildingStorefront, HiOutlineCurrencyRupee } from 'react-icons/hi2'

const STATS = [
  { icon: HiOutlineBuildingStorefront, value: '20,000+', label: 'Jan Aushadhi Kendras', note: 'Operational across India' },
  { icon: MdMedication, value: '2,100+', label: 'Medicines in the basket', note: 'Plus 300+ surgical and consumable items' },
  { icon: HiOutlineCurrencyRupee, value: '50–80%', label: 'Typically cheaper', note: 'Than comparable branded medicines' },
]

function StatsSection() {
  return (
    <section aria-labelledby="stats-heading" className="relative overflow-hidden bg-primary-900 py-16 text-white">
      <div className="absolute inset-0 bg-blister opacity-70" aria-hidden="true" />
      <div className="container-app relative">
        <div className="mb-10 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-accent-300">PM Jan Aushadhi at a glance</span>
          <h2 id="stats-heading" className="mt-2 font-display text-3xl font-extrabold text-white">
            A national network built for affordable medicines
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STATS.map(({ icon: Icon, value, label, note }) => (
            <div key={label} className="rounded-2xl bg-white/10 p-6 text-center backdrop-blur-sm">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent-400 text-primary-900">
                <Icon size={24} aria-hidden="true" />
              </span>
              <p className="mt-4 font-display text-4xl font-extrabold text-white">{value}</p>
              <p className="mt-1 text-sm font-semibold text-accent-200">{label}</p>
              <p className="mt-0.5 text-xs text-white/60">{note}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-white/55">
          Figures as publicly reported by the Government of India (2026) and change over time. See{' '}
          <a href="https://pmjanaushadhi.gov.in" target="_blank" rel="noopener noreferrer" className="font-medium text-accent-300 underline hover:text-accent-200">
            pmjanaushadhi.gov.in
          </a>{' '}
          for current numbers.
        </p>
      </div>
    </section>
  )
}

export default StatsSection