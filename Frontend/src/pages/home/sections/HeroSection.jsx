/**
 * HeroSection: public landing hero.
 * Search box (text, voice, prescription scan, nearby Kendras) on a green blister-pack band.
 */
import { useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  HiOutlineMagnifyingGlass,
  HiOutlineMapPin,
  HiOutlineMicrophone,
  HiOutlineCamera,
  HiOutlineShieldCheck,
} from 'react-icons/hi2'
import { MdMedication } from 'react-icons/md'
import VoiceSearchModal from '../../../components/common/VoiceSearchModal'
import { ROUTES } from '../../../constants/routes'

const POPULAR_SEARCHES = ['Paracetamol', 'Dolo 650', 'Azithromycin', 'Cetirizine', 'Metformin', 'Atorvastatin']

const TRUST = [
  { icon: HiOutlineShieldCheck, text: 'WHO-GMP certified generics' },
  { icon: MdMedication, text: 'PM Jan Aushadhi network' },
  { icon: HiOutlineMapPin, text: 'Find the nearest Kendra' },
]

function HeroSection() {
  const [query, setQuery] = useState('')
  const [voiceOpen, setVoiceOpen] = useState(false)
  const navigate = useNavigate()

  const go = useCallback((term) => {
    const t = term.trim()
    if (t) navigate(`${ROUTES.USER.SEARCH_RESULTS}?q=${encodeURIComponent(t)}`)
  }, [navigate])

  const tools = [
    { label: 'Scan prescription', icon: HiOutlineCamera, to: ROUTES.USER.PRESCRIPTION_SEARCH },
    { label: 'Nearby Kendras', icon: HiOutlineMapPin, to: ROUTES.USER.NEARBY_PHARMACIES },
  ]

  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden bg-primary-800 text-white">
      <div className="absolute inset-0 bg-blister" aria-hidden="true" />
      <div className="container-app relative py-16 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent-300">
            <span className="h-2 w-2 rounded-full bg-accent-400" aria-hidden="true" />
            Built around PM Bhartiya Janaushadhi Pariyojana
          </p>

          <h1 id="hero-heading" className="mt-6 font-display text-4xl font-extrabold leading-[1.08] text-white sm:text-6xl [text-wrap:balance]">
            The same medicine, for a <span className="text-accent-400">fraction</span> of the price
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/80">
            Search any medicine, see its Jan Aushadhi generic alternative and what you save, then find the nearest Kendra that has it in stock.
          </p>

          <form
            onSubmit={(e) => { e.preventDefault(); go(query) }}
            role="search"
            className="mx-auto mt-9 flex max-w-2xl items-center gap-2 rounded-2xl bg-white p-2 shadow-xl"
          >
            <HiOutlineMagnifyingGlass size={22} className="ml-3 shrink-0 text-slate-400" aria-hidden="true" />
            <input
              id="hero-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a medicine, e.g. Dolo 650"
              aria-label="Search medicines"
              className="min-w-0 flex-1 bg-transparent px-2 py-3 text-base text-slate-900 outline-none placeholder:text-slate-400"
            />
            <button type="submit" className="shrink-0 rounded-xl bg-primary-700 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-800">
              Search
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setVoiceOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-3.5 py-1.5 text-sm text-white hover:bg-white/10"
            >
              <HiOutlineMicrophone size={16} aria-hidden="true" />
              Voice
            </button>
            {tools.map(({ label, icon: Icon, to }) => (
              <Link
                key={label}
                to={to}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-3.5 py-1.5 text-sm text-white hover:bg-white/10"
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </Link>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-white/60">Popular:</span>
            {POPULAR_SEARCHES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => go(t)}
                className="rounded-full bg-white/10 px-3 py-1 text-white/90 hover:bg-accent-400 hover:text-primary-900"
              >
                {t}
              </button>
            ))}
          </div>

          <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pl-0 text-sm text-white/80">
            {TRUST.map(({ icon: Icon, text }) => (
              <li key={text} className="flex list-none items-center gap-2">
                <Icon size={18} className="text-accent-400" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>

          <p className="mt-6 text-xs text-white/50">
            Independent project; not an official Government of India website.{' '}
            <Link to={ROUTES.REGISTER} className="underline hover:text-white">Create a free account</Link> to save medicines and set your ranking preferences.
          </p>
        </div>
      </div>

      <VoiceSearchModal isOpen={voiceOpen} onClose={() => setVoiceOpen(false)} onResult={(t) => go(t)} />
    </section>
  )
}

export default HeroSection