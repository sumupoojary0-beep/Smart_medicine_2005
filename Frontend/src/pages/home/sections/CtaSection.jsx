/**
 * Component: CtaSection
 *
 * Purpose:
 *   Full-width call-to-action banner encouraging visitors to start
 *   using the platform. Placed at the bottom of the Home page before
 *   the Footer.
 *
 * Responsibilities:
 *   - Display conversion headline and supporting copy
 *   - Render primary CTA (Search Medicines) and secondary CTA (Register)
 *   - Provide a visually distinct, high-contrast section break
 *
 * Dependencies:
 *   - Button (components/ui)
 *   - ROUTES (constants/routes)
 *   - React Router Link
 *   - React Icons (hi2)
 */

import { Link } from 'react-router-dom'
import { HiOutlineMagnifyingGlass, HiOutlineUserPlus } from 'react-icons/hi2'
import { ROUTES } from '../../../constants/routes'

function CtaSection() {
  return (
    <section
      aria-labelledby="cta-heading"
      className="relative overflow-hidden bg-primary-800 py-20"
    >
      {/* Subtle pattern overlay */}
      <div aria-hidden="true" className="absolute inset-0 bg-blister" />

      <div className="container-app relative text-center">
        <span className="inline-block px-3 py-1 rounded-full bg-accent-400 text-primary-900 text-xs font-semibold tracking-wider uppercase mb-4">
          Get Started Today
        </span>
        <h2
          id="cta-heading"
          className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-snug max-w-2xl mx-auto"
        >
          Start your affordable healthcare journey now
        </h2>
        <p className="mt-4 text-white/80 text-base max-w-xl mx-auto leading-relaxed">
          Search medicines, discover generic alternatives, and locate nearby pharmacies —
          all free, all in one place.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to={ROUTES.USER.SEARCH}
            className="inline-flex items-center gap-2 rounded-xl bg-accent-400 px-7 py-3.5 text-base font-semibold text-primary-900 shadow-lg hover:bg-accent-300"
          >
            <HiOutlineMagnifyingGlass size={18} aria-hidden="true" />
            Search Medicines
          </Link>
          <Link
            to={ROUTES.REGISTER}
            className="inline-flex items-center gap-2 rounded-xl border border-white/50 px-7 py-3.5 text-base font-semibold text-white hover:bg-white/10"
          >
            <HiOutlineUserPlus size={18} aria-hidden="true" />
            Create Free Account
          </Link>
        </div>
      </div>
    </section>
  )
}

export default CtaSection