import React, { useEffect, useMemo, useState } from 'react'
import { Bot, Clock3, Plus, RefreshCw, Trash2 } from 'lucide-react'
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
  const [copilotPrompt, setCopilotPrompt] = useState('')
  const [agentFilter, setAgentFilter] = useState('all')
  const [editingJobId, setEditingJobId] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '',
    schedule: '',
    command: '',
    description: '',
    created_by: '',
    enabled: true,
  })

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

  function startEdit(job) {
    setEditingJobId(job.id)
    setEditForm({
      name: job.name || '',
      schedule: job.schedule || '',
      command: job.command || '',
      description: job.description || '',
      created_by: job.created_by || '',
      enabled: !!job.enabled,
    })
  }

  function cancelEdit() {
    setEditingJobId(null)
    setEditForm({
      name: '',
      schedule: '',
      command: '',
      description: '',
      created_by: '',
      enabled: true,
    })
  }

  async function saveEdit(jobId) {
    if (!editForm.name.trim() || !editForm.schedule.trim() || !editForm.command.trim()) {
      setError('Name, cron schedule, and command are required.')
      return
    }

    try {
      setSaving(true)
      setError('')
      await updateCronJob(jobId, {
        name: editForm.name.trim(),
        schedule: editForm.schedule.trim(),
        command: editForm.command.trim(),
        description: editForm.description.trim() || null,
        created_by: editForm.created_by || null,
        enabled: editForm.enabled,
      })
      await loadJobsOnly()
      cancelEdit()
    } catch (err) {
      console.error('Error editing cron job:', err)
      setError(err?.message || 'Failed to edit cron job')
    } finally {
      setSaving(false)
    }
  }

  const activeCount = useMemo(() => jobs.filter((job) => job.enabled).length, [jobs])
  const filteredJobs = useMemo(
    () => (agentFilter === 'all' ? jobs : jobs.filter((job) => String(job.created_by || '') === agentFilter)),
    [jobs, agentFilter],
  )

  function runCopilot() {
    const suggestion = parseCronPrompt(copilotPrompt, agents)
    setForm((prev) => ({ ...prev, ...suggestion }))
  }

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

      <div className="card space-y-3">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Bot className="w-4 h-4" />
          Cron Copilot
        </h3>
        <textarea
          className="input min-h-[88px]"
          placeholder="Example: Every 2 hours run health check for @andrej and save summary"
          value={copilotPrompt}
          onChange={(e) => setCopilotPrompt(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <button type="button" className="btn-secondary" onClick={runCopilot}>
            Fill Form From Prompt
          </button>
          <p className="text-xs text-gray-500">Keeps agent selection + schedule editable after fill.</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="card space-y-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Create Cron Job</h3>

        <div className="grid grid-cols-1 gap-3">
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
            type="number"
            min="1"
            className="input"
            placeholder="Number"
            value={cronToParts(form.schedule).count}
            onChange={(e) => {
              const count = Math.max(1, Number(e.target.value || 1))
              const unit = cronToParts(form.schedule).unit
              setForm({ ...form, schedule: partsToCron(count, unit) })
            }}
          />
          <select
            className="input"
            value={cronToParts(form.schedule).unit}
            onChange={(e) => {
              const count = cronToParts(form.schedule).count
              setForm({ ...form, schedule: partsToCron(count, e.target.value) })
            }}
          >
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
            <option value="days">Days</option>
          </select>
        </div>
        <p className="text-xs text-gray-500">Schedule preview: {humanizeCron(form.schedule)} ({form.schedule})</p>

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
        <div className="px-4 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Existing Jobs</h3>
          <select
            className="input text-sm sm:w-[280px]"
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
          >
            <option value="all">All agents</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>
        {filteredJobs.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No cron jobs found.</div>
        ) : (
          <div className="divide-y divide-border">
            {filteredJobs.map((job) => (
              <div key={job.id} className="p-4 flex flex-col gap-3">
                {editingJobId === job.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      <input
                        className="input"
                        value={editForm.name}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                      />
                      <select
                        className="input"
                        value={editForm.created_by}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, created_by: e.target.value }))}
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
                        type="number"
                        min="1"
                        className="input"
                        placeholder="Number"
                        value={cronToParts(editForm.schedule).count}
                        onChange={(e) => {
                          const count = Math.max(1, Number(e.target.value || 1))
                          const unit = cronToParts(editForm.schedule).unit
                          setEditForm((prev) => ({ ...prev, schedule: partsToCron(count, unit) }))
                        }}
                      />
                      <select
                        className="input"
                        value={cronToParts(editForm.schedule).unit}
                        onChange={(e) => {
                          const count = cronToParts(editForm.schedule).count
                          setEditForm((prev) => ({ ...prev, schedule: partsToCron(count, e.target.value) }))
                        }}
                      >
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                    <p className="text-xs text-gray-500">
                      Schedule preview: {humanizeCron(editForm.schedule)} ({editForm.schedule})
                    </p>
                    <input
                      className="input"
                      value={editForm.command}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, command: e.target.value }))}
                    />
                    <textarea
                      className="input min-h-[88px]"
                      value={editForm.description}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                    />
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={editForm.enabled}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, enabled: e.target.checked }))}
                      />
                      Enabled
                    </label>
                    <div className="flex items-center gap-2">
                      <button className="btn-primary text-xs" onClick={() => saveEdit(job.id)} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button className="btn-secondary text-xs" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
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
                        {humanizeCron(job.schedule)}
                      </span>
                      <span className="font-mono text-xs bg-gray-50 border border-border rounded px-2 py-1">{job.schedule}</span>
                      <span className="font-mono text-xs bg-gray-50 border border-border rounded px-2 py-1">{job.command}</span>
                    </div>

                    {job.description && <p className="text-sm text-gray-600">{job.description}</p>}

                    <div className="text-xs text-gray-500">
                      Last run: {formatDate(job.last_run_at)} • Next run: {formatDate(job.next_run_at)}
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="btn-secondary text-xs" onClick={() => startEdit(job)}>
                        Edit
                      </button>
                      <button className="btn-secondary text-xs" onClick={() => toggleEnabled(job)}>
                        {job.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button className="btn-secondary text-xs flex items-center gap-1" onClick={() => removeJob(job)}>
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </>
                )}
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

function parseCronPrompt(prompt, agents) {
  const text = String(prompt || '').trim()
  if (!text) return {}

  const lower = text.toLowerCase()
  const byId = detectAgentById(lower, agents)
  const byName = detectAgentByName(lower, agents)
  const createdBy = byId || byName || ''
  const schedule = detectSchedule(lower)
  const command = detectCommand(lower)

  return {
    created_by: createdBy,
    schedule,
    command,
    name: toJobName(command),
    description: text,
  }
}

function detectAgentById(lower, agents) {
  const mention = lower.match(/@([a-z0-9_-]+)/)
  if (!mention) return ''
  const id = mention[1]
  const found = (agents || []).find((a) => String(a.id || '').toLowerCase() === id)
  return found?.id || ''
}

function detectAgentByName(lower, agents) {
  const found = (agents || []).find((agent) => lower.includes(String(agent.name || '').toLowerCase()))
  return found?.id || ''
}

function detectSchedule(lower) {
  let match = lower.match(/every\s+(\d+)\s*(minute|min|minutes|mins)\b/)
  if (match) return `*/${Math.max(1, Number(match[1]))} * * * *`

  match = lower.match(/every\s+(\d+)\s*(hour|hours|hr|hrs)\b/)
  if (match) return `0 */${Math.max(1, Number(match[1]))} * * *`

  if (lower.includes('hourly')) return '0 * * * *'
  if (lower.includes('daily')) return '0 9 * * *'
  if (lower.includes('weekly')) return '0 9 * * 1'
  if (lower.includes('weekdays')) return '0 9 * * 1-5'
  if (lower.includes('every 15')) return '*/15 * * * *'
  if (lower.includes('every 5')) return '*/5 * * * *'
  return '*/15 * * * *'
}

function detectCommand(lower) {
  if (lower.includes('health')) return 'check_agent_status()'
  if (lower.includes('report') || lower.includes('summary')) return 'generate_daily_report()'
  if (lower.includes('backup')) return 'run_backup()'
  if (lower.includes('sync')) return 'run_sync()'
  return 'run_agent_task()'
}

function toJobName(command) {
  return String(command || 'agent_job')
    .replace(/\(\)/g, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase())
}

function cronToParts(cron) {
  const value = String(cron || '').trim()
  let match = value.match(/^\*\/(\d+)\s+\*\s+\*\s+\*\s+\*$/)
  if (match) return { count: Math.max(1, Number(match[1])), unit: 'minutes' }

  match = value.match(/^0\s+\*\/(\d+)\s+\*\s+\*\s+\*$/)
  if (match) return { count: Math.max(1, Number(match[1])), unit: 'hours' }

  match = value.match(/^0\s+0\s+\*\/(\d+)\s+\*\s+\*$/)
  if (match) return { count: Math.max(1, Number(match[1])), unit: 'days' }

  if (value === '0 * * * *') return { count: 1, unit: 'hours' }
  return { count: 15, unit: 'minutes' }
}

function partsToCron(count, unit) {
  const safeCount = Math.max(1, Number(count || 1))
  if (unit === 'hours') return `0 */${safeCount} * * *`
  if (unit === 'days') return `0 0 */${safeCount} * *`
  return `*/${safeCount} * * * *`
}

function humanizeCron(cron) {
  const value = String(cron || '').trim()
  if (!value) return 'Not set'

  if (value === '0 * * * *') return 'Every hour'
  if (value === '0 9 * * *') return 'Daily at 9:00'
  if (value === '0 9 * * 1') return 'Weekly on Monday at 9:00'
  if (value === '0 9 * * 1-5') return 'Weekdays at 9:00'

  let match = value.match(/^\*\/(\d+)\s+\*\s+\*\s+\*\s+\*$/)
  if (match) return `Every ${match[1]} minute${match[1] === '1' ? '' : 's'}`

  match = value.match(/^0\s+\*\/(\d+)\s+\*\s+\*\s+\*$/)
  if (match) return `Every ${match[1]} hour${match[1] === '1' ? '' : 's'}`

  match = value.match(/^0\s+0\s+\*\/(\d+)\s+\*\s+\*$/)
  if (match) return `Every ${match[1]} day${match[1] === '1' ? '' : 's'}`

  return value
}

export default Cron
