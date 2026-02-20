import React, { useEffect, useMemo, useState } from 'react'
import { Clock3, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { createCronJob, deleteCronJob, getAgents, getCronJobs, supabase, updateCronJob } from '../utils/supabase'

const SCHEDULE_PRESETS = [
  { label: 'Every 5 min', value: '*/5 * * * *' },
  { label: 'Every 15 min', value: '*/15 * * * *' },
  { label: 'Hourly', value: '0 * * * *' },
  { label: 'Daily 9:00', value: '0 9 * * *' },
]

function Cron() {
  const [jobs, setJobs] = useState([])
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    schedule: '*/15 * * * *',
    command: '',
    description: '',
    created_by: '',
    enabled: true,
  })

  useEffect(() => {
    loadData()

    const subscription = supabase
      .channel('cron-jobs-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cron_jobs' }, () => {
        loadJobsOnly()
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      setError('')
      const [jobsData, agentsData] = await Promise.all([getCronJobs(), getAgents()])
      setJobs(jobsData || [])
      setAgents(agentsData || [])
      setForm((prev) => ({ ...prev, created_by: prev.created_by || agentsData?.[0]?.id || 'ramon' }))
    } catch (err) {
      console.error('Error loading cron data:', err)
      setError(err?.message || 'Failed to load cron jobs')
    } finally {
      setLoading(false)
    }
  }

  async function loadJobsOnly() {
    try {
      const jobsData = await getCronJobs()
      setJobs(jobsData || [])
    } catch (err) {
      console.error('Error refreshing cron jobs:', err)
    }
  }

  async function handleCreate(event) {
    event.preventDefault()
    if (!form.name.trim() || !form.schedule.trim() || !form.command.trim()) {
      setError('Name, cron schedule, and command are required.')
      return
    }

    try {
      setSaving(true)
      setError('')
      await createCronJob({
        name: form.name.trim(),
        schedule: form.schedule.trim(),
        command: form.command.trim(),
        description: form.description.trim() || null,
        created_by: form.created_by || null,
        enabled: form.enabled,
      })
      setForm((prev) => ({
        ...prev,
        name: '',
        command: '',
        description: '',
      }))
      await loadJobsOnly()
    } catch (err) {
      console.error('Error creating cron job:', err)
      setError(err?.message || 'Failed to create cron job')
    } finally {
      setSaving(false)
    }
  }

  async function toggleEnabled(job) {
    try {
      await updateCronJob(job.id, { enabled: !job.enabled })
      await loadJobsOnly()
    } catch (err) {
      console.error('Error updating cron job:', err)
      setError(err?.message || 'Failed to update cron job')
    }
  }

  async function removeJob(job) {
    const ok = window.confirm(`Delete cron job "${job.name}"?`)
    if (!ok) return
    try {
      await deleteCronJob(job.id)
      await loadJobsOnly()
    } catch (err) {
      console.error('Error deleting cron job:', err)
      setError(err?.message || 'Failed to delete cron job')
    }
  }

  const activeCount = useMemo(() => jobs.filter((job) => job.enabled).length, [jobs])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Cron Jobs</h2>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Set up recurring jobs for your agents</p>
        </div>
        <button className="btn-secondary flex items-center gap-2" onClick={loadData}>
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Metric label="Total Jobs" value={jobs.length} />
        <Metric label="Active Jobs" value={activeCount} />
        <Metric label="Disabled Jobs" value={jobs.length - activeCount} />
      </div>

      {error && (
        <div className="card p-4 border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="card space-y-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Create Cron Job</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="input"
            placeholder="Job name (e.g., Agent Health Check)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <select
            className="input"
            value={form.created_by}
            onChange={(e) => setForm({ ...form, created_by: e.target.value })}
          >
            <option value="">Select agent</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="input"
            placeholder="Cron schedule (e.g., */15 * * * *)"
            value={form.schedule}
            onChange={(e) => setForm({ ...form, schedule: e.target.value })}
          />
          <select
            className="input"
            value=""
            onChange={(e) => e.target.value && setForm({ ...form, schedule: e.target.value })}
          >
            <option value="">Quick presets</option>
            {SCHEDULE_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label} - {preset.value}
              </option>
            ))}
          </select>
        </div>

        <input
          className="input"
          placeholder="Command (e.g., check_agent_status())"
          value={form.command}
          onChange={(e) => setForm({ ...form, command: e.target.value })}
        />

        <textarea
          className="input min-h-[88px]"
          placeholder="Description (optional)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
          />
          Enable immediately
        </label>

        <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
          <Plus className="w-4 h-4" />
          {saving ? 'Creating...' : 'Create Job'}
        </button>
      </form>

      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Existing Jobs</h3>
        </div>
        {jobs.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No cron jobs found.</div>
        ) : (
          <div className="divide-y divide-border">
            {jobs.map((job) => (
              <div key={job.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{job.name}</p>
                    <p className="text-xs text-gray-500 mt-1">ID: {job.id} • Agent: {job.created_by || 'Unassigned'}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${job.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {job.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-700">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="w-4 h-4" />
                    {job.schedule}
                  </span>
                  <span className="font-mono text-xs bg-gray-50 border border-border rounded px-2 py-1">{job.command}</span>
                </div>

                {job.description && <p className="text-sm text-gray-600">{job.description}</p>}

                <div className="text-xs text-gray-500">
                  Last run: {formatDate(job.last_run_at)} • Next run: {formatDate(job.next_run_at)}
                </div>

                <div className="flex items-center gap-2">
                  <button className="btn-secondary text-xs" onClick={() => toggleEnabled(job)}>
                    {job.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button className="btn-secondary text-xs flex items-center gap-1" onClick={() => removeJob(job)}>
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  )
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

export default Cron
