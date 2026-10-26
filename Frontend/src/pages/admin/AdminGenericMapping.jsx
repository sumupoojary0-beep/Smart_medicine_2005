/**
 * Component: AdminGenericMapping
 *
 * The real brand -> ingredient table that powers "search a brand, get the
 * Jan Aushadhi generics" on the public search. GET/PUT/DELETE
 * /admin/generic-mappings. Built-in rows are read-only, but can be
 * overridden; admin rows can be edited or removed. "Try it" runs the same
 * resolver the public search uses.
 */

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { HiOutlineArrowRight, HiOutlinePencil, HiOutlinePlus, HiOutlineTrash, HiOutlineBeaker } from 'react-icons/hi2'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/dialogs/Modal'
import useDebounce from '../../hooks/useDebounce'
import adminManageService from '../../services/adminManageService'

const SOURCE = {
  builtin: { label: 'Built-in', variant: 'neutral' },
  custom: { label: 'Added by admin', variant: 'success' },
  override: { label: 'Admin override', variant: 'warning' },
}
const cap = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase())
const errText = (e, fallback) => {
  const d = e?.response?.data?.detail
  if (typeof d === 'string') return d
  if (Array.isArray(d) && d[0]?.msg) return String(d[0].msg).replace(/^Value error, /, '')
  return fallback
}

function AdminGenericMapping() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const q = useDebounce(search.trim(), 300)
  const [editor, setEditor] = useState(null)   // { brand, ingredients: string, isEdit }
  const [removing, setRemoving] = useState(null)
  const [notice, setNotice] = useState(null)
  const [modalError, setModalError] = useState('')
  const [tryQuery, setTryQuery] = useState('')
  const [tryResult, setTryResult] = useState(null)

  const list = useQuery({
    queryKey: ['admin-mappings', q],
    placeholderData: keepPreviousData,
    queryFn: async () => (await adminManageService.listMappings(q)).data,
  })
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-mappings'] })

  const save = useMutation({
    mutationFn: () => adminManageService.saveMapping({
      brand: editor.brand,
      ingredients: editor.ingredients.split(/[,+]/).map((s) => s.trim()).filter(Boolean),
    }),
    onSuccess: ({ data }) => {
      setEditor(null); setModalError('')
      setNotice({ ok: true, text: `Saved: ${cap(data.brand)} → ${data.ingredients.join(' + ')}. Public search uses it from now on.` })
      refresh()
    },
    onError: (e) => setModalError(errText(e, 'Could not save this mapping.')),
  })
  const remove = useMutation({
    mutationFn: () => adminManageService.deleteMapping(removing.brand),
    onSuccess: ({ data }) => {
      setNotice({ ok: true, text: data.reverted_to_builtin ? `Override removed. "${cap(data.brand)}" is back to the built-in mapping.` : `Mapping for "${cap(data.brand)}" removed.` })
      setRemoving(null); refresh()
    },
    onError: (e) => { setRemoving(null); setNotice({ ok: false, text: errText(e, 'Could not remove it.') }) },
  })
  const tryIt = useMutation({
    mutationFn: () => adminManageService.testMapping(tryQuery.trim()),
    onSuccess: ({ data }) => setTryResult(data),
    onError: (e) => setTryResult({ error: errText(e, 'Could not run the test.') }),
  })

  const rows = list.data?.items ?? []

  return (
    <article aria-label="Generic medicine mapping" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-900">Generic Medicine Mapping</h1>
          <p className="text-sm text-slate-500 mt-0.5 max-w-2xl">
            When someone searches a brand that is not in the Jan Aushadhi catalogue (for example &quot;Dolo&quot;), the search uses this table to find the active ingredient and shows the matching generics.
          </p>
        </div>
        <Button leftIcon={<HiOutlinePlus size={15} />} onClick={() => { setModalError(''); setEditor({ brand: '', ingredients: '', isEdit: false }) }}>Add mapping</Button>
      </div>

      <section className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card">
        <p className="text-sm font-bold text-slate-800 flex items-center gap-2"><HiOutlineBeaker size={16} className="text-primary-600" aria-hidden="true" />Try it</p>
        <p className="text-xs text-slate-500 mt-0.5">Type a brand the way a patient would. This runs the same lookup as the public search.</p>
        <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); if (tryQuery.trim()) tryIt.mutate() }}>
          <input aria-label="Brand to test" className="input-base flex-1" value={tryQuery} onChange={(e) => { setTryQuery(e.target.value); setTryResult(null) }} placeholder="e.g. Dolo 650" />
          <Button type="submit" variant="outline" loading={tryIt.isPending} disabled={!tryQuery.trim()}>Test</Button>
        </form>
        {tryResult && (
          <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs" role="status">
            {tryResult.error && <p className="text-danger-700">{tryResult.error}</p>}
            {!tryResult.error && !tryResult.resolved && <p className="text-slate-700">No mapping or close spelling found for this name. Patients searching it would see no results.</p>}
            {tryResult.resolved && (
              <>
                <p className="text-slate-800"><span className="font-semibold">{tryResult.ingredients.join(' + ')}</span> ({tryResult.matched_via === 'brand' ? 'brand mapping' : 'spelling match'}) · {tryResult.medicine_count} Jan Aushadhi medicine{tryResult.medicine_count === 1 ? '' : 's'}</p>
                <ul className="mt-1.5 space-y-0.5 text-slate-600">
                  {tryResult.medicines.map((m) => <li key={m.pmbi_code}>{m.name}</li>)}
                </ul>
              </>
            )}
          </div>
        )}
      </section>

      <input aria-label="Search mappings" className="input-base" placeholder="Search a brand or ingredient…" value={search} onChange={(e) => setSearch(e.target.value)} />

      {notice && (
        <p role={notice.ok ? 'status' : 'alert'} className={`text-sm rounded-lg p-3 border ${notice.ok ? 'bg-success-50 border-success-200 text-success-700' : 'bg-danger-50 border-danger-200 text-danger-700'}`}>{notice.text}</p>
      )}
      {list.isLoading && <p className="py-8 text-center text-sm text-slate-400" role="status">Loading mappings…</p>}
      {list.isError && <p role="alert" className="py-8 text-center text-sm text-danger-700">{errText(list.error, 'Could not load mappings.')}</p>}

      {list.data && (
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base" aria-label="Brand to generic mappings">
              <thead>
                <tr><th scope="col">Brand</th><th scope="col" aria-label="maps to" /><th scope="col">Active ingredient(s)</th><th scope="col">Source</th><th scope="col">Actions</th></tr>
              </thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={5} className="text-center text-xs text-slate-400 py-8">No mappings match.</td></tr>}
                {rows.map((r) => {
                  const src = SOURCE[r.source]
                  return (
                    <tr key={r.brand}>
                      <td className="text-xs font-semibold text-slate-900">{cap(r.brand)}</td>
                      <td><HiOutlineArrowRight size={14} className="text-slate-300" aria-hidden="true" /></td>
                      <td className="text-xs font-semibold text-success-700">{r.ingredients.map(cap).join(' + ')}
                        {r.source === 'override' && r.built_in_ingredients && <p className="text-[10px] font-normal text-slate-400">Built-in: {r.built_in_ingredients.map(cap).join(' + ')}</p>}
                      </td>
                      <td><Badge variant={src.variant} size="sm">{src.label}</Badge></td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <Button size="sm" variant="ghost" leftIcon={<HiOutlinePencil size={13} aria-hidden="true" />}
                            onClick={() => { setModalError(''); setEditor({ brand: r.brand, ingredients: r.ingredients.join(', '), isEdit: true }) }}>{r.source === 'builtin' ? 'Override' : 'Edit'}</Button>
                          {r.source !== 'builtin' && (
                            <Button size="sm" variant="ghost" leftIcon={<HiOutlineTrash size={13} aria-hidden="true" />} onClick={() => setRemoving(r)}>{r.source === 'override' ? 'Revert' : 'Remove'}</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="px-4 py-2.5 border-t border-slate-100 text-[11px] text-slate-400">{list.data.total} mapping{list.data.total === 1 ? '' : 's'}. The ingredient must exist in the Jan Aushadhi catalogue, otherwise the server rejects it.</p>
        </div>
      )}

      <Modal isOpen={editor !== null} onClose={() => setEditor(null)} size="sm"
        title={editor?.isEdit ? `Edit mapping: ${cap(editor.brand)}` : 'Add a brand mapping'}
        description="Use the brand name without strength (Dolo, not Dolo 650)."
        footer={editor && (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditor(null)}>Cancel</Button>
            <Button size="sm" loading={save.isPending} disabled={!editor.brand.trim() || !editor.ingredients.trim()} onClick={() => save.mutate()}>Save mapping</Button>
          </div>
        )}>
        {editor && (
          <div className="space-y-3">
            <div>
              <label htmlFor="map-brand" className="text-xs font-semibold text-slate-700">Brand name</label>
              <input id="map-brand" className="input-base mt-1 w-full" value={editor.brand} disabled={editor.isEdit} onChange={(e) => setEditor({ ...editor, brand: e.target.value })} placeholder="e.g. Dolo" />
            </div>
            <div>
              <label htmlFor="map-ing" className="text-xs font-semibold text-slate-700">Active ingredient(s)</label>
              <input id="map-ing" className="input-base mt-1 w-full" value={editor.ingredients} onChange={(e) => setEditor({ ...editor, ingredients: e.target.value })} placeholder="e.g. paracetamol  (separate several with commas)" />
              <p className="text-[11px] text-slate-400 mt-1">Without salts: &quot;amlodipine&quot;, not &quot;amlodipine besylate&quot;.</p>
            </div>
            {modalError && <p role="alert" className="text-xs text-danger-700 bg-danger-50 border border-danger-200 rounded-lg p-2.5">{modalError}</p>}
          </div>
        )}
      </Modal>

      <Modal isOpen={removing !== null} onClose={() => setRemoving(null)} size="sm"
        title={removing?.source === 'override' ? 'Revert to the built-in mapping?' : 'Remove this mapping?'}
        description={removing ? (removing.source === 'override' ? `"${cap(removing.brand)}" will use the built-in ingredient again.` : `Patients searching "${cap(removing.brand)}" will no longer be shown generics for it.`) : ''}
        footer={removing && (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setRemoving(null)}>Cancel</Button>
            <Button variant="danger" size="sm" loading={remove.isPending} onClick={() => remove.mutate()}>{removing.source === 'override' ? 'Revert' : 'Remove'}</Button>
          </div>
        )} />
    </article>
  )
}

export default AdminGenericMapping
