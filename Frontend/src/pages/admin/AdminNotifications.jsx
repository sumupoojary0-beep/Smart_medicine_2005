/**
 * Component: AdminNotifications
 *
 * Real broadcasts: POST /admin/notifications/broadcast creates one in-app
 * notification for every ACTIVE user in the chosen audience (it appears in
 * their Notifications page). History: GET /admin/notifications/broadcasts.
 */

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HiOutlineBell, HiOutlinePaperAirplane } from 'react-icons/hi2'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/dialogs/Modal'
import adminManageService from '../../services/adminManageService'

const AUDIENCES = [
  { value: 'all', label: 'Everyone' },
  { value: 'users', label: 'Patients / users' },
  { value: 'pharmacies', label: 'Pharmacy owners' },
]
const TYPES = [
  { value: 'info', label: 'Information' },
  { value: 'success', label: 'Good news' },
  { value: 'warning', label: 'Warning' },
  { value: 'alert', label: 'Urgent' },
]
const TYPE_VARIANT = { info: 'info', success: 'success', warning: 'warning', alert: 'danger' }
const fmt = (v) => (v ? new Date(v).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '')

function AdminNotifications() {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState('all')
  const [type, setType] = useState('info')
  const [confirm, setConfirm] = useState(false)
  const [notice, setNotice] = useState(null)

  const history = useQuery({
    queryKey: ['admin-broadcasts'],
    queryFn: async () => (await adminManageService.listBroadcasts()).data,
  })
  const count = history.data?.audience_counts?.[audience]

  const send = useMutation({
    mutationFn: () => adminManageService.sendBroadcast({ title: title.trim(), message: message.trim(), audience, type }),
    onSuccess: ({ data }) => {
      setConfirm(false)
      setNotice({ ok: true, text: `Sent to ${data.recipients} user${data.recipients === 1 ? '' : 's'}. It is now in their Notifications.` })
      setTitle(''); setMessage('')
      queryClient.invalidateQueries({ queryKey: ['admin-broadcasts'] })
    },
    onError: (e) => {
      setConfirm(false)
      const detail = e?.response?.data?.detail
      setNotice({ ok: false, text: typeof detail === 'string' ? detail : 'Could not send. Check the title and message.' })
    },
  })

  const valid = title.trim().length >= 3 && message.trim().length >= 3 && count !== 0
  const audienceLabel = AUDIENCES.find((a) => a.value === audience)?.label

  return (
    <article aria-label="Broadcast notifications" className="flex flex-col gap-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold text-primary-900 flex items-center gap-2">
          <HiOutlineBell size={20} className="text-warning-500" aria-hidden="true" />
          Broadcast Notifications
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">Send an in-app message to a group of users. Only active accounts receive it, and it cannot be recalled.</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); if (valid) setConfirm(true) }} noValidate
        className="bg-white rounded-2xl border border-slate-200/70 shadow-card p-5 space-y-4">
        <div>
          <label htmlFor="bc-title" className="text-xs font-semibold text-slate-700">Title</label>
          <input id="bc-title" className="input-base mt-1 w-full" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Scheduled maintenance on Sunday" />
        </div>
        <div>
          <label htmlFor="bc-msg" className="text-xs font-semibold text-slate-700">Message</label>
          <textarea id="bc-msg" rows={3} className="input-base mt-1 w-full" maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What do users need to know?" />
          <p className="text-[11px] text-slate-400 mt-1">{message.length}/500</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="bc-aud" className="text-xs font-semibold text-slate-700">Send to</label>
            <select id="bc-aud" className="input-base mt-1 w-full" value={audience} onChange={(e) => setAudience(e.target.value)}>
              {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}{history.data ? ` (${history.data.audience_counts[a.value]})` : ''}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="bc-type" className="text-xs font-semibold text-slate-700">Style</label>
            <select id="bc-type" className="input-base mt-1 w-full" value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
        {notice && (
          <p role={notice.ok ? 'status' : 'alert'} className={`text-sm rounded-lg p-3 border ${notice.ok ? 'bg-success-50 border-success-200 text-success-700' : 'bg-danger-50 border-danger-200 text-danger-700'}`}>{notice.text}</p>
        )}
        {count === 0 && <p className="text-xs text-warning-700">There are no active users in this group yet.</p>}
        <Button type="submit" variant="primary" disabled={!valid} leftIcon={<HiOutlinePaperAirplane size={15} />}>Review and send</Button>
      </form>

      <section>
        <p className="text-sm font-bold text-slate-800 mb-3">Sent broadcasts</p>
        {history.isLoading && <p className="text-sm text-slate-400" role="status">Loading…</p>}
        {history.isError && <p role="alert" className="text-sm text-danger-700">Could not load the history.</p>}
        {history.data && history.data.items.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">Nothing sent yet.</p>
        )}
        <div className="space-y-2">
          {history.data?.items.map((b) => (
            <div key={b.id} className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{b.title}</p>
                <Badge variant={TYPE_VARIANT[b.type] ?? 'neutral'} size="sm">{b.type}</Badge>
              </div>
              <p className="text-xs text-slate-600 mt-1">{b.message}</p>
              <p className="text-[11px] text-slate-400 mt-2">{b.audience_label} · {b.recipients} recipient{b.recipients === 1 ? '' : 's'} · {fmt(b.created_at)} · by {b.sent_by}</p>
            </div>
          ))}
        </div>
      </section>

      <Modal isOpen={confirm} onClose={() => setConfirm(false)} title="Send this notification?" size="sm"
        description={`"${title.trim()}" will be delivered to ${count ?? ''} ${audienceLabel?.toLowerCase()}. This cannot be undone.`}
        footer={(
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>Cancel</Button>
            <Button size="sm" loading={send.isPending} onClick={() => send.mutate()}>Send now</Button>
          </div>
        )} />
    </article>
  )
}

export default AdminNotifications
