/**
 * Component: GenericRecommendationSection
 * Explains why the Jan Aushadhi medicine is the same as the brand and sends the
 * patient to the Kendras that stock it.
 */
import { Link } from 'react-router-dom'
import { HiOutlineMapPin, HiOutlineCheckCircle } from 'react-icons/hi2'
import { ROUTES } from '../../../constants/routes'

function GenericRecommendationSection({ generic = {} }) {
  const { pmbiCode = '', name = '', equivalentName = '', composition = '', manufacturer = '' } = generic

  const nearbyPageUrl =
    `${ROUTES.USER.NEARBY_PHARMACIES}` +
    `?medicine=${encodeURIComponent(pmbiCode)}` +
    `&name=${encodeURIComponent(name)}` +
    `&genericName=${encodeURIComponent(equivalentName)}`

  return (
    <section aria-labelledby="generic-rec-heading" className="bg-primary-50 rounded-2xl border border-primary-200 p-6">
      <h2 id="generic-rec-heading" className="text-xl font-bold text-primary-900">Get it from a Jan Aushadhi Kendra</h2>

      <ul className="mt-4 space-y-2 pl-0 text-sm text-slate-800">
        <li className="flex items-start gap-2">
          <HiOutlineCheckCircle size={18} className="mt-0.5 text-primary-600 shrink-0" aria-hidden="true" />
          <span>Same composition: <strong>{composition}</strong></span>
        </li>
        <li className="flex items-start gap-2">
          <HiOutlineCheckCircle size={18} className="mt-0.5 text-primary-600 shrink-0" aria-hidden="true" />
          <span>Sold under the PM Jan Aushadhi scheme{manufacturer ? `, made by ${manufacturer}` : ''}</span>
        </li>
      </ul>

      <Link
        to={nearbyPageUrl}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      >
        <HiOutlineMapPin size={18} aria-hidden="true" />
        Find Kendras that stock it
      </Link>
    </section>
  )
}

export default GenericRecommendationSection