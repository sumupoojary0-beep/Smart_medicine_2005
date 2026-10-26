/**
 * Component: SearchResultCard
 * One medicine in the search results. Shows only what is known: the Jan Aushadhi
 * price, the brand price when one is on record, and the saving. Save is real.
 */
import { HiOutlineBookmark, HiBookmark, HiOutlineBuildingOffice2 } from 'react-icons/hi2'
import { categoryStyle } from '../../utils/categoryStyle'
import useSavedMedicines from '../../hooks/useSavedMedicines'

const rupee = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

function SearchResultCard({ medicine = {}, onView, isBestValue = false, layout = 'grid' }) {
  const { isSaved, toggle, isToggling } = useSavedMedicines()
  const {
    name = 'Medicine', genericName = '', composition = '', manufacturer = '',
    category = '', price, mrp, pmbiCode,
  } = medicine

  const { Icon, tile } = categoryStyle(category)
  const hasBrand = Number(mrp) > Number(price) && Number(price) > 0
  const pct = hasBrand ? Math.round(((mrp - price) / mrp) * 100) : 0
  const saved = isSaved(pmbiCode)
  const list = layout === 'list'

  return (
    <article
      aria-label={name}
      onClick={onView}
      className={[
        'relative bg-white border rounded-2xl cursor-pointer shadow-card hover:shadow-card-hover',
        'transition-shadow duration-200 focus-within:ring-2 focus-within:ring-primary-500',
        isBestValue ? 'border-accent-400' : 'border-slate-200',
        list ? 'flex items-center gap-4 p-4' : 'flex flex-col gap-4 p-5',
      ].join(' ')}
    >
      {isBestValue && (
        <span className="absolute -top-2.5 left-5 px-2 py-0.5 rounded-md bg-accent-400 text-slate-900 text-xs font-bold">
          Biggest saving here
        </span>
      )}

      <div className={`flex items-start gap-3 min-w-0 ${list ? 'flex-1' : ''}`}>
        <span className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 ${tile}`} aria-hidden="true">
          <Icon size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-bold text-slate-900 leading-snug truncate">{name}</h3>
          {(composition || genericName) && (
            <p className="text-sm text-slate-600 truncate">{composition || genericName}</p>
          )}
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
            {category && <span className="truncate">{category}</span>}
          </p>
          {manufacturer && !list && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400 truncate">
              <HiOutlineBuildingOffice2 size={12} aria-hidden="true" />
              <span className="truncate">{manufacturer}</span>
            </p>
          )}
        </div>
        {!list && (
          <button
            type="button"
            disabled={isToggling || !pmbiCode}
            onClick={(e) => { e.stopPropagation(); toggle(pmbiCode) }}
            aria-pressed={saved}
            aria-label={saved ? `Remove ${name} from saved` : `Save ${name}`}
            className={`shrink-0 p-1.5 rounded-lg transition-colors ${saved ? 'text-primary-600 bg-primary-50' : 'text-slate-400 hover:text-primary-600 hover:bg-primary-50'}`}
          >
            {saved ? <HiBookmark size={20} aria-hidden="true" /> : <HiOutlineBookmark size={20} aria-hidden="true" />}
          </button>
        )}
      </div>

      <div className={`flex items-end justify-between gap-3 rounded-xl bg-primary-50 px-4 py-3 ${list ? 'w-72 shrink-0' : ''}`}>
        <div>
          <p className="text-xs text-primary-800/80">Jan Aushadhi price</p>
          <p className="font-display text-2xl font-extrabold text-primary-700 leading-none mt-1">
            {price !== undefined && price !== null ? rupee(price) : '—'}
          </p>
        </div>
        {hasBrand ? (
          <div className="text-right">
            <p className="text-xs text-slate-500">
              Brand <span className="line-through">{rupee(mrp)}</span>
            </p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-accent-400 text-slate-900 text-sm font-bold">
              {pct}% less
            </span>
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-right max-w-[9rem]">No brand price on record</p>
        )}
      </div>

      {list && (
        <button
          type="button"
          disabled={isToggling || !pmbiCode}
          onClick={(e) => { e.stopPropagation(); toggle(pmbiCode) }}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${name} from saved` : `Save ${name}`}
          className={`shrink-0 p-1.5 rounded-lg ${saved ? 'text-primary-600 bg-primary-50' : 'text-slate-400 hover:text-primary-600 hover:bg-primary-50'}`}
        >
          {saved ? <HiBookmark size={20} aria-hidden="true" /> : <HiOutlineBookmark size={20} aria-hidden="true" />}
        </button>
      )}
    </article>
  )
}

export default SearchResultCard