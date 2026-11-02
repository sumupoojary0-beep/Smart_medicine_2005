/**
 * Component: PharmacyDetailsPanel
 *
 * Description:
 *   Detailed information panel for the selected pharmacy including
 *   medicine availability, stock status, amenities, and actions.
 *
 * Backend readiness:
 *   - pharmacy → GET /api/v1/pharmacies/:id
 *   - availability → GET /api/v1/pharmacies/:id/inventory?medicine=...
 */

import { useQuery } from '@tanstack/react-query'
import {
  HiOutlineMapPin, HiOutlinePhone,
  HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineExclamationCircle,
} from 'react-icons/hi2'
import { MdLocalPharmacy } from 'react-icons/md'
import Badge from '../../../components/ui/Badge'
import kendraService from '../../../services/kendraService'
import medicineService from '../../../services/medicineService'


const STATUS_ICON = {
  available:   <HiOutlineCheckCircle   size={15} className="text-success-500" aria-hidden="true" />,
  limited:     <HiOutlineExclamationCircle size={15} className="text-warning-500" aria-hidden="true" />,
  unavailable: <HiOutlineXCircle       size={15} className="text-danger-500" aria-hidden="true" />,
}
const STATUS_CONFIG = {
  available:   { variant: 'success', label: 'In Stock'      },
  limited:     { variant: 'warning', label: 'Limited'       },
  unavailable: { variant: 'danger',  label: 'Out of Stock'  },
}
const BACKEND_STATUS_MAP = { in_stock: 'available', low_stock: 'limited', out_of_stock: 'unavailable' }

// =======================================================
// Pharmacy Details Panel
// =======================================================
function PharmacyDetailsPanel({ pharmacyId }) {
  const kendraQuery = useQuery({
    queryKey: ['kendra', pharmacyId],
    queryFn: async () => (await kendraService.getById(pharmacyId)).data,
    enabled: !!pharmacyId,
  })

  // Shared with InventoryPage/BillingPage — TanStack Query caches this once.
  const medicinesQuery = useQuery({
    queryKey: ['medicines', 'all-for-billing'],
    queryFn: async () => (await medicineService.getAll({ page: 1, page_size: 200 })).data.results,
    enabled: !!pharmacyId,
  })

  if (!pharmacyId) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
        <MdLocalPharmacy size={40} className="text-slate-200 mx-auto mb-3" aria-hidden="true" />
        <p className="text-sm font-semibold text-slate-500">Select a pharmacy from the list or map</p>
        <p className="text-xs text-slate-400 mt-1">Pharmacy details will appear here</p>
      </div>
    )
  }

  if (kendraQuery.isLoading || medicinesQuery.isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
        <p className="text-sm text-slate-400">Loading pharmacy details…</p>
      </div>
    )
  }

  if (kendraQuery.isError || !kendraQuery.data) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
        <p className="text-sm text-danger-600">Couldn't load this pharmacy's details.</p>
      </div>
    )
  }

  const k = kendraQuery.data
  const medicineMap = new Map((medicinesQuery.data ?? []).map((m) => [m.pmbi_code, m]))

  const pharmacy = {
    id: k.id,
    name: k.name,
    address: k.address,
    phone: k.phone,
    isJanAushadhi: true,
  }

  const availabilityRows = (k.stock ?? []).slice(0, 8).map((item) => {
    const med = medicineMap.get(item.pmbi_code)
    return {
      medicine: med ? `${med.brand_name} (${med.generic_name})` : item.pmbi_code,
      status: BACKEND_STATUS_MAP[item.status] ?? 'unavailable',
      batch: item.batches?.[0]?.batch_number ?? '—',
      expiry: item.batches?.[0]?.expiry_date
        ? new Date(item.batches[0].expiry_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
        : '—',
    }
  })

  return (
    <section aria-labelledby="pharmacy-details-heading">

      {/* =======================================================
          Pharmacy Details
         ======================================================= */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        <div className="p-5 space-y-4">
          {/* Name + badges */}
          <div>
            <h2 id="pharmacy-details-heading" className="text-base font-bold text-slate-900 mb-2">
              {pharmacy.name}
            </h2>
            <div className="flex flex-wrap gap-2">
              {pharmacy.isJanAushadhi && <Badge variant="info" size="sm">Jan Aushadhi</Badge>}
            </div>
          </div>

          {/* Info rows */}
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <HiOutlineMapPin size={13} className="text-secondary-500 mt-0.5 shrink-0" aria-hidden="true" />
              {pharmacy.address}
            </div>
            <div className="flex items-center gap-2">
              <HiOutlinePhone size={13} className="text-secondary-500 shrink-0" aria-hidden="true" />
              <a href={`tel:${pharmacy.phone?.replace(/\s/g,'')}`} className="hover:text-secondary-600 transition-colors">
                {pharmacy.phone}
              </a>
            </div>
          </div>

          {/* Medicine availability table */}
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">Medicine Availability</p>
            {availabilityRows.length === 0 ? (
              <p className="text-xs text-slate-400">No stock data available for this Kendra.</p>
            ) : (
              <div className="rounded-xl border border-slate-100 overflow-hidden">
                {availabilityRows.map((row) => {
                  const cfg = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.available
                  return (
                    <div key={row.medicine} className="flex items-center justify-between px-3 py-2.5 border-b border-slate-50 last:border-0 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {STATUS_ICON[row.status]}
                        <span className="truncate text-slate-700">{row.medicine}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-1.5">
              Availability is indicative. Confirm with pharmacy before visiting.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PharmacyDetailsPanel