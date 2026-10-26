/** Browse by category: coloured tiles with the real medicine count. Data: GET /medicines/filters. */
import { useQuery } from '@tanstack/react-query'
import medicineService from '../../../services/medicineService'
import { categoryStyle } from '../../../utils/categoryStyle'

function MedicineCategoriesSection({ onCategorySelect }) {
  const { data, isLoading } = useQuery({
    queryKey: ['medicines', 'filters'],
    queryFn: async () => (await medicineService.getFilters()).data,
    staleTime: 10 * 60 * 1000,
  })
  const categories = data?.categories ?? []
  if (!isLoading && !categories.length) return null

  return (
    <section aria-labelledby="categories-heading" className="pt-12">
      <h2 id="categories-heading" className="text-2xl font-bold text-slate-900">Browse by category</h2>

      {isLoading ? (
        <p className="mt-4 text-sm text-slate-400">Loading categories…</p>
      ) : (
        <ul className="mt-5 pl-0 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Medicine categories">
          {categories.map((cat) => {
            const { Icon, tile } = categoryStyle(cat.name)
            return (
              <li key={cat.name}>
                <button
                  type="button"
                  onClick={() => onCategorySelect?.(cat.name)}
                  className="group w-full flex items-center gap-3 p-3.5 bg-white border border-slate-200 rounded-2xl text-left shadow-card hover:border-primary-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <span className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 ${tile}`} aria-hidden="true">
                    <Icon size={22} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-900 group-hover:text-primary-700 leading-snug">{cat.name}</span>
                    <span className="block text-xs text-slate-500">{cat.count} medicines</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default MedicineCategoriesSection