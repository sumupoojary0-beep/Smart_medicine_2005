/**
 * Component: PriceComparisonSection
 * Two bars drawn to scale: what the brand charges and what Jan Aushadhi charges,
 * with the rupee amount saved. When no brand price is on record, a plain note.
 */
const rupee = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

function PriceComparisonSection({ prices = {} }) {
  const { brandName = 'Brand', brandPrice = 0, genericPrice = 0, priceSource = '' } = prices

  const hasComparison = brandPrice > genericPrice && genericPrice > 0
  const saved = Math.round((brandPrice - genericPrice) * 100) / 100
  const pct = hasComparison ? Math.round((saved / brandPrice) * 100) : 0
  const barPct = hasComparison ? Math.max(Math.round((genericPrice / brandPrice) * 100), 4) : 0

  return (
    <section aria-labelledby="price-comparison-heading" className="bg-white rounded-2xl border border-slate-200 shadow-card p-6">
      <h2 id="price-comparison-heading" className="text-xl font-bold text-slate-900">
        {hasComparison ? 'What you save' : 'Price'}
      </h2>

      {hasComparison ? (
        <>
          <div className="mt-5 space-y-4">
            <div>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-slate-600 truncate pr-3">{brandName}</span>
                <span className="font-display font-bold text-slate-700">{rupee(brandPrice)}</span>
              </div>
              <div className="mt-1.5 h-4 rounded-full bg-slate-300" role="img" aria-label={`Brand price ${rupee(brandPrice)}`} />
            </div>
            <div>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-slate-600">Jan Aushadhi</span>
                <span className="font-display font-bold text-primary-700">{rupee(genericPrice)}</span>
              </div>
              <div className="mt-1.5 h-4 rounded-full bg-slate-100 overflow-hidden" role="img" aria-label={`Jan Aushadhi price is ${barPct}% of the brand price`}>
                <div className="h-full rounded-full bg-primary-600" style={{ width: `${barPct}%` }} />
              </div>
            </div>
          </div>

          <p className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-accent-50 border border-accent-200 px-4 py-3 text-slate-900">
            <span className="px-2 py-0.5 rounded-md bg-accent-400 text-sm font-bold">{pct}% less</span>
            <span>
              You keep <strong className="font-display text-lg">{rupee(saved)}</strong> on every pack.
            </span>
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-slate-600 max-w-[60ch]">
          The official Jan Aushadhi price is <strong>{rupee(genericPrice)}</strong>. We do not have a
          verified brand price for this medicine yet, so we do not show a saving.
        </p>
      )}

      <p className="mt-4 text-xs text-slate-500 max-w-[70ch]">
        {priceSource
          ? `Brand price = ${priceSource}: the most any brand may charge for this medicine. Actual brand prices may be lower.`
          : 'Prices are indicative and may vary by pharmacy and location.'}
      </p>
    </section>
  )
}

export default PriceComparisonSection