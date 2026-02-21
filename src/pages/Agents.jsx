import React, { useState, useEffect } from 'react'
import { Users, Activity, MessageSquare, Plus, Minus } from 'lucide-react'
import { getAgents, supabase, updateAgentMds } from '../utils/supabase'

function Agents() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [editorOpen, setEditorOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [editingAgent, setEditingAgent] = useState(null)
  const [mdForm, setMdForm] = useState({
    identity_md: '',
    soul_md: '',
    user_md: '',
    tools_md: '',
    agents_md: '',
  })

  useEffect(() => {
    loadAgents()
    
    const subscription = supabase
      .channel('agents-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, () => {
        loadAgents()
      })
      .subscribe()
    
    return () => subscription.unsubscribe()
  }, [])

  async function loadAgents() {
    try {
      const data = await getAgents()
      setAgents(data)
    } catch (error) {
      console.error('Error loading agents:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'idle': return 'bg-yellow-500'
      case 'busy': return 'bg-red-500'
      case 'offline': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  const getLoadColor = (load) => {
    if (load >= 9) return 'text-red-600 bg-red-50'
    if (load >= 7) return 'text-orange-600 bg-orange-50'
    if (load >= 4) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  const mdFields = [
    { key: 'identity_md', label: 'identity.md' },
    { key: 'soul_md', label: 'soul.md' },
    { key: 'user_md', label: 'user.md' },
    { key: 'tools_md', label: 'tools.md' },
    { key: 'agents_md', label: 'agents.md' },
  ]

  function openMdEditor(agent) {
    setEditingAgent(agent)
    setMdForm({
      identity_md: agent.identity_md || '',
      soul_md: agent.soul_md || '',
      user_md: agent.user_md || '',
      tools_md: agent.tools_md || '',
      agents_md: agent.agents_md || '',
    })
    setSaveError('')
    setEditorOpen(true)
  }

  function closeMdEditor() {
    if (saving) return
    setEditorOpen(false)
    setEditingAgent(null)
    setSaveError('')
  }

  async function saveMdEditor() {
    if (!editingAgent?.id) return
    try {
      setSaving(true)
      setSaveError('')
      await updateAgentMds(editingAgent.id, mdForm)
      setEditorOpen(false)
      setEditingAgent(null)
      await loadAgents()
    } catch (error) {
      console.error('Error saving md fields:', error)
      setSaveError(error?.message || 'Failed to save agent markdown files')
    } finally {
      setSaving(false)
    }
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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Agent Swarm</h2>
          <p className="text-sm text-gray-500 mt-1">{agents.filter(a => a.status === 'active').length} active agents</p>
        </div>
        <button className="btn-secondary flex items-center justify-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Chat Arena
        </button>
      </div>

      {/* Agents Grid - 1 col mobile, 2 cols tablet, 3 cols desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => (
          <div key={agent.id} className="card p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-3xl sm:text-4xl">{agent.emoji}</span>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-gray-900">{agent.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-500">{agent.role}</p>
                </div>
              </div>
              <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${getStatusColor(agent.status)}`} />
            </div>

            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-600">Status</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                  agent.status === 'active' ? 'bg-green-100 text-green-700' :
                  agent.status === 'idle' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}
                >
                  {agent.status}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-600">Load</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getLoadColor(agent.load)}`}>
                  {agent.load}/10
                </span>
              </div>

              <div>
                <span className="text-xs sm:text-sm text-gray-600">Current Task</span>
                <p className="text-xs sm:text-sm text-gray-900 mt-1 line-clamp-2">{agent.current_task || 'No active task'}</p>
              </div>

              {agent.load >= 9 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3">
                  <p className="text-xs sm:text-sm text-red-600 font-medium">⚠️ Overloaded!</p>
                  <button className="mt-1 sm:mt-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded">
                    Spawn Clone
                  </button>
                </div>
              )}
            </div>

            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 flex gap-2">
              <button className="flex-1 text-xs bg-primary-50 hover:bg-primary-100 text-primary py-2 rounded">
                Logs
              </button>
              <button
                onClick={() => openMdEditor(agent)}
                className="flex-1 text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded"
              >
                Edit .md
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Swarm Stats */}
      <div className="card">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Swarm Stats</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{agents.length}</p>
            <p className="text-xs sm:text-sm text-gray-500">Total</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
            <p className="text-xl sm:text-2xl font-bold text-green-600">{agents.filter(a => a.status === 'active').length}</p>
            <p className="text-xs sm:text-sm text-gray-500">Active</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg">
            <p className="text-xl sm:text-2xl font-bold text-yellow-600">{agents.filter(a => a.status === 'idle').length}</p>
            <p className="text-xs sm:text-sm text-gray-500">Idle</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg">
            <p className="text-xl sm:text-2xl font-bold text-red-600">{agents.filter(a => a.load >= 9).length}</p>
            <p className="text-xs sm:text-sm text-gray-500">Overload</p>
          </div>
        </div>
      </div>

      {editorOpen && editingAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4">
          <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-xl p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Edit Agent Markdown</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Agent: {editingAgent.name} ({editingAgent.id})
                </p>
              </div>
              <button
                type="button"
                onClick={closeMdEditor}
                className="px-3 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 text-gray-700"
                disabled={saving}
              >
                Close
              </button>
            </div>

            {mdFields.map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{field.label}</label>
                <textarea
                  value={mdForm[field.key]}
                  onChange={(e) => setMdForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  rows={6}
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
            ))}

            {saveError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{saveError}</div>
            ) : null}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeMdEditor}
                className="px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 text-gray-700"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveMdEditor}
                className="px-4 py-2 rounded-lg text-sm bg-primary text-white hover:bg-primary-700 disabled:opacity-60"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save to OpenClaw'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Agents
