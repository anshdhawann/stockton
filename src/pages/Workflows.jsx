import React, { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Workflow, AlertCircle } from 'lucide-react'
import { fetchN8nWorkflows, getN8nConfig } from '../utils/n8n'

function Workflows() {
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  const config = getN8nConfig()

  useEffect(() => {
    loadWorkflows()
  }, [])

  async function loadWorkflows() {
    try {
      setLoading(true)
      setError('')

      const latestConfig = getN8nConfig()
      const list = await fetchN8nWorkflows(latestConfig)
      setWorkflows(list)
    } catch (err) {
      console.error('Error loading workflows:', err)
      const raw = String(err?.message || '')
      const isNetworkOrCors = raw.includes('Failed to fetch') || raw.includes('NetworkError')
      setError(
        isNetworkOrCors
          ? 'Browser could not reach n8n API (likely CORS). Allow CORS for this site or use a backend proxy.'
          : raw || 'Failed to load workflows from n8n',
      )
      setWorkflows([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return workflows
    return workflows.filter((wf) => {
      const name = String(wf.name || '').toLowerCase()
      const id = String(wf.id || '').toLowerCase()
      return name.includes(q) || id.includes(q)
    })
  }, [query, workflows])

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Workflows</h2>
          <p className="text-sm sm:text-base text-gray-500 mt-1">All workflows from your n8n instance</p>
        </div>
        <button onClick={loadWorkflows} className="btn-secondary flex items-center justify-center gap-2" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="card p-4 sm:p-5 space-y-3">
        <p className="text-sm text-gray-600">
          Connected n8n: <span className="font-medium text-gray-900">{config.baseUrl || 'Proxy mode (n8n.anshdhawan.cloud)'}</span>
        </p>
        <input
          className="input"
          placeholder="Search workflows by name or ID..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && (
        <div className="card p-4 border-red-200 bg-red-50">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">Could not load workflows</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <p className="text-xs text-red-600 mt-2">Set n8n URL and API key in Settings, then retry.</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <Workflow className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">No workflows found</p>
          <p className="text-sm text-gray-500 mt-1">Try changing search text or refreshing.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-600 px-4 py-3">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-600 px-4 py-3">ID</th>
                  <th className="text-left text-xs font-semibold text-gray-600 px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-600 px-4 py-3">Updated</th>
                  <th className="text-left text-xs font-semibold text-gray-600 px-4 py-3">Tags</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((wf) => (
                  <tr key={wf.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{wf.name || 'Unnamed workflow'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{wf.id}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${wf.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {wf.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{formatDate(wf.updatedAt || wf.updated_at)}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {Array.isArray(wf.tags) && wf.tags.length > 0
                        ? wf.tags.map((tag) => tag?.name || tag).filter(Boolean).join(', ')
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

export default Workflows
