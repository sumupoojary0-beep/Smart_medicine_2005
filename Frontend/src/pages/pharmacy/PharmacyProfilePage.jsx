/**
 * Component: PharmacyProfilePage
 *
 * The pharmacy owner's page: the Kendra they run (read from the database),
 * the invoice details printed on bills, and their own account (name, phone,
 * password) using the same forms as the patient profile.
 *
 * Backend: GET /api/v1/kendras/:id, GET /api/v1/kendras/:id/billing-details
 */

import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { HiOutlineMapPin, HiOutlinePhone, HiOutlineReceiptPercent, HiOutlineExclamationTriangle } from 'react-icons/hi2'
import { MdLocalPharmacy } from 'react-icons/md'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../contexts/AuthContext'
import kendraService from '../../services/kendraService'
import ProfilePage from '../profile/ProfilePage'

const CARD = 'bg-white rounded-2xl border border-slate-200/70 shadow-card p-5'

function Row({ label, value, mono = false }) {
  return (
    <div className="py-2.5 border-b border-slate-100 last:border-0 grid grid-cols-[9rem_minmax(0,1fr)] gap-3">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className={`text-sm text-slate-900 break-words ${mono ? 'font-mono' : ''}`}>
        {value || <span className="text-slate-400">Not set</span>}
      </dd>
    </div>
  )
}

function PharmacyProfilePage() {
  const { currentUser } = useAuth()
  const kendraId = currentUser?.assignedKendraId ?? null

  const kendra = useQuery({
    queryKey: ['kendra', kendraId],
    enabled: Boolean(kendraId),
    queryFn: async () => (await kendraService.getById(kendraId)).data,
  })
  const billing = useQuery({
    queryKey: ['kendra', kendraId, 'billing-details'],
    enabled: Boolean(kendraId),
    queryFn: async () => (await kendraService.getBillingDetails(kendraId)).data,
  })

  const k = kendra.data
  const b = billing.data
  const code = k?.name?.match(/\(([A-Z0-9]+)\)/)?.[1]
  const units = k?.stock?.reduce((n, s) => n + (s.total_qty ?? 0), 0)
  const mapUrl = k ? `https://www.google.com/maps/search/?api=1&query=${k.latitude},${k.longitude}` : null

  return (
    <article aria-label="Pharmacy profile" className="max-w-3xl mx-auto flex flex-col gap-5">
      <header className="relative overflow-hidden rounded-3xl bg-primary-800 text-white">
        <div className="absolute inset-0 bg-blister" aria-hidden="true" />
        <div className="relative flex items-center gap-4 p-6 sm:p-8">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-400 text-primary-900">
            <MdLocalPharmacy size={28} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-accent-300">Your Jan Aushadhi Kendra</p>
            <h1 className="font-display text-2xl font-extrabold leading-tight text-white sm:text-3xl [text-wrap:balance]">
              {k?.name ?? (kendraId ? 'Loading…' : 'No Kendra linked')}
            </h1>
            {code && <p className="mt-1 text-sm text-white/70">Kendra code {code}</p>}
          </div>
        </div>
      </header>

      {!kendraId ? (
        <div className={`${CARD} flex items-start gap-3`}>
          <HiOutlineExclamationTriangle size={22} className="mt-0.5 shrink-0 text-warning-500" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-slate-800">No Kendra is linked to your account yet.</p>
            <p className="mt-1 text-sm text-slate-500">
              An admin links your account to your Kendra after approving your pharmacy request. Log out and in again once it is approved.
            </p>
          </div>
        </div>
      ) : kendra.isError ? (
        <p role="alert" className="text-sm text-danger-600">Could not load your Kendra details. Please refresh the page.</p>
      ) : (
        <>
          <section className={CARD} aria-labelledby="kendra-details-heading">
            <h2 id="kendra-details-heading" className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <HiOutlineMapPin size={16} className="text-primary-600" aria-hidden="true" /> Kendra details
            </h2>
            <dl>
              <Row label="Name" value={k?.name} />
              <Row label="Address" value={k?.address} />
              <Row label="Phone" value={k?.phone} />
              <Row label="Stock on hand" value={units != null ? `${units.toLocaleString('en-IN')} units in ${k.stock.length} medicines` : ''} />
            </dl>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {mapUrl && (
                <a href={mapUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary-700 hover:underline">
                  View on map
                </a>
              )}
              <span className="text-xs text-slate-400">Kendra name, address and location are managed by the administrator.</span>
            </div>
          </section>

          <section className={CARD} aria-labelledby="invoice-details-heading">
            <div className="flex items-center justify-between gap-3 mb-1">
              <h2 id="invoice-details-heading" className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HiOutlineReceiptPercent size={16} className="text-primary-600" aria-hidden="true" /> Invoice details
              </h2>
              <Link to={ROUTES.PHARMACY.BILLING} className="text-sm font-semibold text-primary-700 hover:underline">
                Edit on Billing
              </Link>
            </div>
            <dl>
              <Row label="GSTIN" value={b?.gstin} mono />
              <Row label="Drug licence no." value={b?.drug_license_no} mono />
              <Row label="Last bill number" value={b?.last_bill_number != null ? String(b.last_bill_number) : ''} />
            </dl>
            <p className="mt-2 text-xs text-slate-400">These are printed on every invoice you generate.</p>
          </section>
        </>
      )}

      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-3">Your account</h2>
        <ProfilePage embedded />
      </div>
    </article>
  )
}

export default PharmacyProfilePage