/** Dashboard numbers: all real (saved medicines, recent searches, unread notifications). */
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { HiOutlineBookmark, HiOutlineMagnifyingGlass, HiOutlineBell } from 'react-icons/hi2'
import { ROUTES } from '../../../constants/routes'
import notificationService from '../../../services/notificationService'
import useSavedMedicines from '../../../hooks/useSavedMedicines'
import useRecentSearches from '../../../hooks/useRecentSearches'

function QuickStats() {
  const navigate = useNavigate()
  const { items: saved } = useSavedMedicines()
  const { items: searches } = useRecentSearches()
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await notificationService.getMyNotifications()).data,
  })
  const notifications = data?.results ?? []
  const unread = data?.unread ?? 0

  const stats = [
    { label: 'Medicines Saved', value: String(saved.length), variant: 'primary', icon: <HiOutlineBookmark size={18} />, subtitle: 'Your personal list', route: null },
    { label: 'Recent Searches', value: String(searches.length), variant: 'default', icon: <HiOutlineMagnifyingGlass size={18} />, subtitle: 'On this device', route: ROUTES.USER.SEARCH },
    { label: 'Notifications', value: String(notifications.length), variant: unread ? 'danger' : 'default', icon: <HiOutlineBell size={18} />, subtitle: `${unread} unread`, route: ROUTES.USER.NOTIFICATIONS },
  ]

  const tone = {
    primary: 'bg-primary-50 text-primary-700',
    default: 'bg-slate-100 text-slate-600',
    danger: 'bg-accent-100 text-accent-800',
  }

  return (
    <section aria-labelledby="quick-stats-heading">
      <h2 id="quick-stats-heading" className="sr-only">Dashboard statistics</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map((s) => {
          const Tag = s.route ? 'button' : 'div'
          return (
            <Tag
              key={s.label}
              type={s.route ? 'button' : undefined}
              onClick={s.route ? () => navigate(s.route) : undefined}
              className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-4 text-left shadow-card transition hover:shadow-card-hover"
            >
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tone[s.variant]}`}>
                {s.icon}
              </span>
              <span className="min-w-0">
                <span className="block font-display text-3xl font-extrabold leading-none text-slate-900">{s.value}</span>
                <span className="mt-1 block text-sm font-medium text-slate-700">{s.label}</span>
                <span className="block text-xs text-slate-500">{s.subtitle}</span>
              </span>
            </Tag>
          )
        })}
      </div>
    </section>
  )
}

export default QuickStats