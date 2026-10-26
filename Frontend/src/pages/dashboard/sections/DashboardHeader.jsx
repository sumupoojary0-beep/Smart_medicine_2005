/** Dashboard welcome card: real name, greeting and date. */
import { HiOutlineCalendar } from 'react-icons/hi2'
import Avatar from '../../../components/ui/Avatar'
import { useAuth } from '../../../contexts/AuthContext'

function DashboardHeader() {
  const { currentUser } = useAuth()
  const name = currentUser?.name ?? 'there'
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <section aria-labelledby="dashboard-welcome" className="relative overflow-hidden rounded-3xl bg-primary-800 text-white">
      <div className="absolute inset-0 bg-blister" aria-hidden="true" />
      <div className="relative flex items-center gap-4 p-6 sm:p-8">
        <span className="rounded-full ring-4 ring-accent-400/80">
          <Avatar name={name} size="xl" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-accent-300">{greeting}</p>
          <h1 id="dashboard-welcome" className="truncate font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl">{name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-white/70">
            <HiOutlineCalendar size={13} aria-hidden="true" />
            {today}
          </p>
        </div>
      </div>
    </section>
  )
}

export default DashboardHeader