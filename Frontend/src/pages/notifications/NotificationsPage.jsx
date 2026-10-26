/**
 * Component: NotificationsPage
 *
 * Description:
 *   Full-page notification centre for the authenticated user.
 *   Connects the notification flow from dashboard → notification centre.
 *
 * Responsibilities:
 *   - Display all notifications grouped by type
 *   - Mark individual / all as read
 *   - Delete notifications
 *   - Navigate to the relevant page on notification click
 *
 * Route: /notifications  (ProtectedRoute → UserLayout)
 *
 * Backend: wired to real endpoints via notificationService.js —
 *   GET    /api/v1/users/me/notifications
 *   PATCH  /api/v1/notifications/:id/read
 *   DELETE /api/v1/notifications/:id
 *   PATCH  /api/v1/users/me/notifications/read-all
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { HiOutlineBell, HiOutlineCheckCircle, HiOutlineXMark } from 'react-icons/hi2'
import NotificationCard from '../../components/cards/NotificationCard'
import EmptyState from '../../components/feedback/EmptyState'
import notificationService from '../../services/notificationService'
import { formatTimeAgo } from '../../utils/formatters'

function NotificationsPage() {
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await notificationService.getMyNotifications()).data,
  })

  const items = (data?.results ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    description: n.description,
    time: formatTimeAgo(n.createdAt),
    type: n.type,
    isRead: n.isRead,
  }))
  const unread = data?.unread ?? 0

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notifications'] })

  const readMutation = useMutation({
    mutationFn: (id) => notificationService.markAsRead(id),
    onSuccess: invalidate,
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => notificationService.remove(id),
    onSuccess: invalidate,
  })
  const readAllMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: invalidate,
  })

  function handleRead(id) {
    readMutation.mutate(id)
  }

  function handleDelete(id) {
    deleteMutation.mutate(id)
  }

  function handleReadAll() {
    readAllMutation.mutate()
  }

  return (
    <article aria-label="Notification Centre" className="max-w-2xl mx-auto flex flex-col gap-5">

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-primary-800 text-white">
        <div className="absolute inset-0 bg-blister" aria-hidden="true" />
        <div className="relative flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-400 text-primary-900">
              <HiOutlineBell size={28} aria-hidden="true" />
            </span>
            <div>
              <h1 className="font-display text-3xl font-extrabold leading-tight text-white">Notifications</h1>
              <p className="mt-1 text-sm text-white/75">
                {items.length} {items.length === 1 ? "notification" : "notifications"} · {unread} unread
              </p>
            </div>
          </div>
          {unread > 0 && (
            <button
              type="button"
              onClick={handleReadAll}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
            >
              <HiOutlineCheckCircle size={16} aria-hidden="true" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Notification list */}
      {isLoading ? (
        <p className="text-center py-10 text-sm text-slate-400">Loading notifications…</p>
      ) : isError ? (
        <p className="text-center py-10 text-sm text-danger-600">Couldn't load notifications. Try refreshing.</p>
      ) : items.length === 0 ? (
        <EmptyState
          title="You're all caught up"
          description="No notifications at the moment. We'll let you know when something important happens."
          size="md"
        />
      ) : (
        <div
          className="space-y-2"
          aria-live="polite"
          aria-label="Notification list"
        >
          {items.map(n => (
            <div key={n.id} className="relative group">
              <NotificationCard
                notification={n}
                onRead={() => handleRead(n.id)}
                onClick={() => handleRead(n.id)}
              />
              <button
                type="button"
                onClick={() => handleDelete(n.id)}
                aria-label={`Delete notification: ${n.title}`}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 flex items-center justify-center w-6 h-6 rounded-md text-slate-300 hover:text-danger-500 hover:bg-danger-50 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-danger-400"
              >
                <HiOutlineXMark size={12} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

    </article>
  )
}

export default NotificationsPage