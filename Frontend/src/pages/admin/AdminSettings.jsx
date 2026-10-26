/**
 * Component: AdminSettings
 *
 * Only settings that really take effect are shown:
 *   - Open registrations: when off, POST /auth/register is refused (403).
 *   - Maintenance mode: when on, every API call except sign-in is refused
 *     with 503 and your message; admins keep full access.
 * GET/PUT /admin/settings. Every change is written to the activity log.
 */

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HiOutlineCog6Tooth, HiOutlineUserPlus, HiOutlineWrenchScrewdriver } from 'react-icons/hi2'
import Toggle from '../../components/forms/Toggle'
import Button from '../../components/ui/Button'
import adminManageService from '../../services/adminManageService'

const fmt = (v) => (v ? new Date(v).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null)

function Card({ icon: Icon, title, children }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200/70 shadow-card p-5">
      <p className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1 border-b border-slate-100 pb-3">
        <Icon size={16} className="text-primary-600" aria-hidden="true" />{title}
      </p>
      {children}
    </section>
  )
}

function Row({ label, description, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5 max-w-md">{description}</p>
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  )
}

function AdminSettings() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => (await adminManageService.getSettings()).data,
  })
  const [draft, setDraft] = useState({})   // only what the admin has changed
  const [notice, setNotice] = useState(null)
  const saved = query.data && {
    registration_open: query.data.registration_open,
    maintenance_mode: query.data.maintenance_mode,
    maintenance_message: query.data.maintenance_message ?? '',
  }
  const form = saved && { ...saved, ...draft }
  const dirty = form && Object.keys(draft).some((k) => draft[k] !== saved[k])
  const set = (patch) => { setNotice(null); setDraft((d) => ({ ...d, ...patch })) }

  const save = useMutation({
    mutationFn: () => adminManageService.saveSettings(form),
    onSuccess: () => {
      setDraft({})
      setNotice({ ok: true, text: 'Settings saved. They are in effect now.' })
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
    },
    onError: (e) => setNotice({ ok: false, text: e?.response?.data?.detail ?? 'Could not save the settings.' }),
  })

  return (
    <article aria-label="Platform settings" className="flex flex-col gap-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold text-primary-900 flex items-center gap-2">
          <HiOutlineCog6Tooth size={22} className="text-slate-600" aria-hidden="true" />
          Platform Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">Every setting here is enforced by the server and recorded in Activity Logs.</p>
      </div>

      {query.isLoading && <p className="py-10 text-center text-sm text-slate-400" role="status">Loading settings…</p>}
      {query.isError && <p role="alert" className="py-10 text-center text-sm text-danger-700">{query.error?.response?.data?.detail ?? 'Could not load settings.'}</p>}

      {form && (
        <>
          <Card icon={HiOutlineUserPlus} title="Registrations">
            <Row label="Open registrations" description="When switched off, new people cannot create an account. Existing users can still sign in.">
              <Toggle size="md" checked={form.registration_open} onChange={(v) => set({ registration_open: v })} label={form.registration_open ? 'Open' : 'Closed'} />
            </Row>
            {!form.registration_open && (
              <p className="text-xs text-warning-700 bg-warning-50 border border-warning-200 rounded-lg px-3 py-2 mb-2">New sign-ups are closed once you save.</p>
            )}
          </Card>

          <Card icon={HiOutlineWrenchScrewdriver} title="Maintenance mode">
            <Row label="Maintenance mode" description="Blocks the app for everyone except administrators. Sign-in stays open so you can get back in and switch it off.">
              <Toggle size="md" checked={form.maintenance_mode} onChange={(v) => set({ maintenance_mode: v })} label={form.maintenance_mode ? 'On' : 'Off'} />
            </Row>
            <div className="pb-2">
              <label htmlFor="maint-msg" className="text-xs font-semibold text-slate-700">Message shown to users</label>
              <textarea id="maint-msg" rows={2} maxLength={200} className="input-base mt-1 w-full" value={form.maintenance_message}
                onChange={(e) => set({ maintenance_message: e.target.value })}
                placeholder="Smart Medicine is under maintenance. Please try again shortly." />
              <p className="text-[11px] text-slate-400 mt-1">{form.maintenance_message.length}/200. Leave empty to use the default message.</p>
            </div>
            {form.maintenance_mode && (
              <p className="text-xs text-danger-700 bg-danger-50 border border-danger-200 rounded-lg px-3 py-2 mt-2" role="alert">
                Maintenance mode will lock out all patients and pharmacy owners once you save. You will stay signed in.
              </p>
            )}
          </Card>

          {notice && (
            <p role={notice.ok ? 'status' : 'alert'} className={`text-sm rounded-lg p-3 border ${notice.ok ? 'bg-success-50 border-success-200 text-success-700' : 'bg-danger-50 border-danger-200 text-danger-700'}`}>
              {notice.text}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button variant={form.maintenance_mode ? 'danger' : 'primary'} loading={save.isPending} disabled={!dirty} onClick={() => save.mutate()}>
              Save settings
            </Button>
            {dirty && <Button variant="ghost" onClick={() => { setNotice(null); setDraft({}) }}>Discard changes</Button>}
            {query.data.updated_by && (
              <p className="text-[11px] text-slate-400">Last changed by {query.data.updated_by}{fmt(query.data.updated_at) ? `, ${fmt(query.data.updated_at)}` : ''}</p>
            )}
          </div>
        </>
      )}
    </article>
  )
}

export default AdminSettings
