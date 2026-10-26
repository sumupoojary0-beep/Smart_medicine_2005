/**
 * "Where you save the most": real medicines with the biggest gap between the
 * brand price and the Jan Aushadhi price. Data: GET /api/v1/medicines/top-savings.
 * The first three are shown as price tags in the hero, so this list starts after them.
 */
import { useQuery } from '@tanstack/react-query'
import medicineService from '../../../services/medicineService'
import { categoryStyle } from '../../../utils/categoryStyle'

const rupee = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

function PopularMedicinesSection({ onSearch, total = 0 }) {
  const { data } = useQuery({
    queryKey: ['medicines', 'top-savings'],
    queryFn: async () => (await medicineService.getTopSavings(12)).data,
    staleTime: 10 * 60 * 1000,
  })
  const items = (data?.results ?? []).slice(3)
  if (!items.length) return null

  return (
    <section aria-labelledby="savings-heading" className="pt-12">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="savings-heading" className="text-2xl font-bold text-slate-900">Where you save the most</h2>
          <p className="mt-1 text-sm text-slate-600">
            Brand prices are the average market price.
            {total > 0 && ` We list ${total.toLocaleString('en-IN')} medicines from the official Jan Aushadhi list.`}
          </p>
        </div>
      </div>

      <ul className="mt-5 pl-0 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((m) => {
          const name = m.brand_name || m.generic_name
          const { Icon, tile } = categoryStyle(m.category)
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onSearch?.(name)}
                className="w-full h-full text-left bg-white border border-slate-200 rounded-2xl p-4 shadow-card hover:shadow-card-hover transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <span className="flex items-start gap-3">
                  <span className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${tile}`} aria-hidden="true">
                    <Icon size={20} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display font-bold text-slate-900 truncate">{name}</span>
                    <span className="block text-xs text-slate-500 truncate">{m.composition || m.generic_name}</span>
                  </span>
                </span>
                <span className="mt-4 flex items-end justify-between">
                  <span>
                    <span className="block text-xs text-slate-500">Brand <span className="line-through">{rupee(m.branded_avg_mrp)}</span></span>
                    <span className="block font-display text-2xl font-extrabold text-primary-700 leading-tight">{rupee(m.jan_aushadhi_mrp)}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-accent-400 text-slate-900 text-sm font-bold">
                    {Math.round(m.saving_pct)}% less
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default PopularMedicinesSection