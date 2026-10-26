/** Short medical notice at the end of the medicine page. */
function HealthcareDisclaimer() {
  return (
    <aside
      aria-label="Healthcare disclaimer"
      role="note"
      className="rounded-xl bg-white border border-slate-200 border-l-4 border-l-accent-400 px-4 py-3"
    >
      <p className="text-sm text-slate-600 max-w-[80ch]">
        This information helps you compare medicines and prices. It is not medical advice.
        Ask your doctor or pharmacist before you switch to a different medicine.
      </p>
    </aside>
  )
}

export default HealthcareDisclaimer