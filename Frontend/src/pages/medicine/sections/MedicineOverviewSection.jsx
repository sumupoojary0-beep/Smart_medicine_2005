/**
 * Component: MedicineOverviewSection
 * Top of the medicine page: name, composition, category, maker, pack size and
 * the Jan Aushadhi price with the brand price beside it when one is on record.
 * Only facts that exist in the catalogue are shown.
 */
import { categoryStyle } from '../../../utils/categoryStyle'

const rupee = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

function Fact({ label, value }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs text-white/60">{label}</dt>
      <dd className="text-sm font-medium text-white">{value}</dd>
    </div>
  )
}

function MedicineOverviewSection({ medicine = {} }) {
  const {
    name = 'Medicine', genericName = '', composition = '', category = '',
    manufacturer = '', type = '', strength = '', price = 0, mrp = 0,
  } = medicine

  const { Icon } = categoryStyle(category)
  const hasBrand = Number(mrp) > Number(price) && Number(price) > 0
  const pct = hasBrand ? Math.round(((mrp - price) / mrp) * 100) : 0

  return (
    <section aria-labelledby="medicine-overview-heading" className="relative overflow-hidden rounded-3xl bg-primary-800 text-white">
      <div className="absolute inset-0 bg-blister" aria-hidden="true" />
      <div className="relative grid grid-cols-[minmax(0,1fr)] gap-8 p-6 sm:p-9 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 pl-1.5 pr-3 py-1 text-sm text-white/90">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent-400 text-primary-900" aria-hidden="true">
              <Icon size={14} />
            </span>
            {category || 'Medicine'}
          </p>
          <h1 id="medicine-overview-heading" className="mt-4 font-display text-[2rem] sm:text-[2.6rem] leading-[1.08] font-extrabold text-white [text-wrap:balance]">
            {name}
          </h1>
          {composition && <p className="mt-2 text-lg text-white/85">{composition}</p>}
          {genericName && genericName !== name && <p className="mt-0.5 text-sm text-white/60">{genericName}</p>}

          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
            <Fact label="Strength" value={strength} />
            <Fact label="Pack" value={type} />
            <Fact label="Made by" value={manufacturer} />
          </dl>
        </div>

        <div className="rounded-2xl bg-white text-slate-900 p-5 shadow-xl md:min-w-[15rem]">
          <p className="text-sm text-slate-600">Jan Aushadhi price</p>
          <p className="font-display text-[2.6rem] font-extrabold text-primary-700 leading-none mt-1">
            {price ? rupee(price) : '—'}
          </p>
          {hasBrand ? (
            <div className="mt-3 flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <p className="text-sm text-slate-600">Brand <span className="line-through">{rupee(mrp)}</span></p>
              <span className="px-2 py-0.5 rounded-md bg-accent-400 text-slate-900 text-sm font-bold">{pct}% less</span>
            </div>
          ) : (
            <p className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500">
              No brand price on record for this medicine.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export default MedicineOverviewSection