/**
 * Search landing hero: headline, the search box (with voice, prescription photo
 * and nearby-Kendra shortcuts), the user's recent searches, and a stack of real
 * price tags taken from the medicines with the biggest savings.
 */
import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  HiOutlineMagnifyingGlass, HiOutlineMicrophone, HiOutlineCamera, HiOutlineMapPin, HiOutlineXMark,
} from 'react-icons/hi2'
import VoiceSearchModal from '../../../components/common/VoiceSearchModal'
import useRecentSearches from '../../../hooks/useRecentSearches'
import medicineService from '../../../services/medicineService'
import { ROUTES } from '../../../constants/routes'

const rupee = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

const pill =
  'inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/10 text-white text-sm font-medium ' +
  'hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400'

const TAG_POSE = ['-rotate-2 translate-x-2', 'rotate-1 -translate-x-3', '-rotate-1 translate-x-4']

function PriceTag({ medicine, pose, onPick }) {
  const name = medicine.brand_name || medicine.generic_name
  return (
    <button
      type="button"
      onClick={() => onPick(name)}
      className={`relative w-full text-left bg-white rounded-2xl pl-12 pr-4 py-4 shadow-xl text-slate-900 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 ${pose}`}
    >
      {/* string hole, like a price tag */}
      <span className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary-800 ring-4 ring-primary-100" aria-hidden="true" />
      <span className="flex items-center justify-between gap-3">
        <span className="min-w-0">
          <span className="block font-display font-bold truncate">{name}</span>
          <span className="block text-xs text-slate-500 truncate">{medicine.composition || medicine.generic_name}</span>
          <span className="block mt-1.5 text-xs text-slate-500">
            Brand <span className="line-through">{rupee(medicine.branded_avg_mrp)}</span>
          </span>
        </span>
        <span className="text-right shrink-0">
          <span className="block font-display text-2xl font-extrabold text-primary-700 leading-none">
            {rupee(medicine.jan_aushadhi_mrp)}
          </span>
          <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-accent-400 text-slate-900 text-xs font-bold">
            {Math.round(medicine.saving_pct)}% less
          </span>
        </span>
      </span>
    </button>
  )
}

function SearchHeroSection({ query = '', onQueryChange, onSearch, suggestions = null }) {
  const [voiceOpen, setVoiceOpen] = useState(false)
  const { items: recent, remove } = useRecentSearches()

  const { data } = useQuery({
    queryKey: ['medicines', 'top-savings'],
    queryFn: async () => (await medicineService.getTopSavings(12)).data,
    staleTime: 10 * 60 * 1000,
  })
  const tags = (data?.results ?? []).slice(0, 3)

  const handleVoiceResult = useCallback((text) => { onQueryChange?.(text); onSearch?.(text) }, [onQueryChange, onSearch])

  return (
    <section aria-labelledby="search-hero-title" className="relative overflow-hidden rounded-3xl bg-primary-800 text-white">
      <div className="absolute inset-0 bg-blister" aria-hidden="true" />

      <div className="relative grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-10 p-6 sm:p-10 lg:p-12 items-center">
        {/* Left: words + search */}
        <div>
          <h1 id="search-hero-title" className="font-display text-[2.4rem] sm:text-[3.1rem] leading-[1.04] font-extrabold text-white [text-wrap:balance]">
            The same medicine, for a fraction of the price
          </h1>
          <p className="mt-4 max-w-[48ch] text-base leading-relaxed text-white/80">
            Search any brand. We find the Jan Aushadhi version with the same composition,
            show what you save, and tell you which Kendra near you stocks it.
          </p>

          <div className="relative mt-7 max-w-xl">
            <form
              role="search"
              onSubmit={(e) => { e.preventDefault(); onSearch?.(query) }}
              className="flex items-center bg-white rounded-2xl p-1.5 shadow-xl focus-within:ring-4 focus-within:ring-accent-400/60"
            >
              <label htmlFor="medicine-search" className="sr-only">Search by brand, generic name or composition</label>
              <HiOutlineMagnifyingGlass size={22} className="ml-3 text-slate-400 shrink-0" aria-hidden="true" />
              <input
                id="medicine-search"
                type="search"
                autoComplete="off"
                value={query}
                onChange={(e) => onQueryChange?.(e.target.value)}
                placeholder="Medicine name"
                className="flex-1 min-w-0 h-12 px-3 text-base bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                className="h-12 px-6 rounded-xl bg-accent-400 text-slate-900 text-sm font-bold hover:bg-accent-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-800"
              >
                Search
              </button>
            </form>
            {suggestions && <div className="absolute left-0 right-0 top-full mt-2 z-30 text-slate-900">{suggestions}</div>}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={() => setVoiceOpen(true)} className={pill}>
              <HiOutlineMicrophone size={17} aria-hidden="true" /> Speak the name
            </button>
            <Link to={ROUTES.USER.PRESCRIPTION_SEARCH} className={pill}>
              <HiOutlineCamera size={17} aria-hidden="true" /> Photo of a prescription
            </Link>
            <Link to={ROUTES.USER.NEARBY_PHARMACIES} className={pill}>
              <HiOutlineMapPin size={17} aria-hidden="true" /> Kendras near me
            </Link>
          </div>

          {recent.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-white/60">You searched</span>
              {recent.slice(0, 4).map((q) => (
                <span key={q} className="inline-flex items-center rounded-full border border-white/25">
                  <button type="button" onClick={() => onSearch?.(q)} className="pl-3 pr-1.5 py-1 text-white hover:text-accent-300">{q}</button>
                  <button type="button" onClick={() => remove(q)} aria-label={`Remove ${q}`} className="pr-2 py-1 text-white/50 hover:text-white">
                    <HiOutlineXMark size={13} aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: real price tags */}
        {tags.length > 0 && (
          <div className="hidden lg:flex flex-col gap-3" aria-label="Examples of what people save">
            {tags.map((m, i) => (
              <PriceTag key={m.id} medicine={m} pose={TAG_POSE[i % TAG_POSE.length]} onPick={(n) => onSearch?.(n)} />
            ))}
          </div>
        )}
      </div>

      <VoiceSearchModal isOpen={voiceOpen} onClose={() => setVoiceOpen(false)} onResult={handleVoiceResult} />
    </section>
  )
}

export default SearchHeroSection