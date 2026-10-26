/**
 * Auth Layout
 *
 * Wraps Login, Register, Verify OTP, Forgot / Reset Password.
 * Desktop: green brand panel on the left, form on the right.
 * Mobile: compact green header above the form.
 */

import { Link, Outlet } from 'react-router-dom'
import { MdMedication } from 'react-icons/md'
import { HiOutlineCheckCircle } from 'react-icons/hi2'
import { APP_NAME, APP_VERSION } from '../constants/app'
import { ROUTES } from '../constants/routes'

const POINTS = [
  'Find the Jan Aushadhi generic for any branded medicine',
  'See exactly how much you save on every pack',
  'Locate the nearest Kendra that has it in stock',
]

function Brand({ light = true }) {
  return (
    <Link
      to={ROUTES.HOME}
      className="group flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
      aria-label={`${APP_NAME} — home`}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-400 text-primary-900 shadow-md">
        <MdMedication size={22} aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-none">
        <span className={`text-base font-bold tracking-tight ${light ? 'text-white' : 'text-primary-800'}`}>
          Smart Medicine
        </span>
        <span className={`mt-0.5 text-[10px] uppercase tracking-widest ${light ? 'text-white/60' : 'text-slate-400'}`}>
          Janaushadhi System
        </span>
      </span>
    </Link>
  )
}

function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-base lg:flex-row">
      <a
        href="#auth-form"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to form
      </a>

      {/* Brand panel */}
      <aside className="relative overflow-hidden bg-primary-800 text-white lg:flex lg:w-[44%] lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-blister" aria-hidden="true" />
        <div className="relative px-6 py-6 lg:px-12 lg:py-10">
          <Brand />
        </div>
        <div className="relative hidden px-12 pb-16 lg:block">
          <h2 className="font-display text-4xl font-extrabold leading-[1.1] text-white [text-wrap:balance]">
            The same medicine, for a <span className="text-accent-400">fraction</span> of the price
          </h2>
          <ul className="mt-8 space-y-4 pl-0">
            {POINTS.map((p) => (
              <li key={p} className="flex list-none items-start gap-3 text-white/85">
                <HiOutlineCheckCircle size={22} className="mt-0.5 shrink-0 text-accent-400" aria-hidden="true" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative hidden px-12 pb-8 text-xs text-white/50 lg:block">
          Final-year engineering project · not an official Government of India website
        </p>
      </aside>

      {/* Form */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div
          id="auth-form"
          className="w-full max-w-md rounded-2xl border border-slate-200/70 bg-white p-8 shadow-card"
        >
          <Outlet />
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} {APP_NAME} · v{APP_VERSION}
        </p>
      </main>
    </div>
  )
}

export default AuthLayout