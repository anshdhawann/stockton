import React, { useEffect, useState } from 'react'
import { CheckCircle2, Clock3, PlayCircle, AlertCircle } from 'lucide-react'
import { getTasks, supabase } from '../utils/supabase'

function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTasks()

    const subscription = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        loadTasks()
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])

  async function loadTasks() {
    try {
      const data = await getTasks()
      setTasks(data || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentlyDoing = tasks
    .filter((task) => ['in_progress', 'in-progress', 'active'].includes(normalizeStatus(task.status)))
    .sort(sortByPriorityThenRecency)

  const completed = tasks
    .filter((task) => ['completed', 'done'].includes(normalizeStatus(task.status)))
    .sort((a, b) => getTaskTime(b) - getTaskTime(a))

  const queued = tasks
    .filter((task) => !currentlyDoing.includes(task) && !completed.includes(task))
    .sort(sortByPriorityThenRecency)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Tasks</h2>
        <p className="text-sm sm:text-base text-gray-500 mt-1">What agents are doing now, what is queued, and what was completed</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          label="Currently Doing"
          value={currentlyDoing.length}
          icon={PlayCircle}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <StatCard
          label="Queued Up"
          value={queued.length}
          icon={Clock3}
          color="text-amber-600"
          bg="bg-amber-50"
        />
        <StatCard
          label="Completed"
          value={completed.length}
          icon={CheckCircle2}
          color="text-green-600"
          bg="bg-green-50"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <Column
          title="Currently Doing"
          subtitle="In progress right now"
          icon={PlayCircle}
          iconColor="text-blue-600"
          tasks={currentlyDoing}
          emptyMessage="No tasks in progress"
        />
        <Column
          title="Queued Up"
          subtitle="Ready and waiting"
          icon={Clock3}
          iconColor="text-amber-600"
          tasks={queued}
          emptyMessage="No queued tasks"
        />
        <Column
          title="Completed"
          subtitle="Recently finished"
          icon={CheckCircle2}
          iconColor="text-green-600"
          tasks={completed}
          emptyMessage="No completed tasks yet"
        />
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`${bg} p-2 rounded-lg`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </div>
  )
}

function Column({ title, subtitle, icon: Icon, iconColor, tasks, emptyMessage }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-xs sm:text-sm text-gray-500 mb-4">{subtitle}</p>

      <div className="space-y-3">
        {tasks.length === 0 && (
          <div className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-4">{emptyMessage}</div>
        )}

        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  )
}

function TaskCard({ task }) {
  const agent = Array.isArray(task.agents) ? task.agents[0] : task.agents
  const status = normalizeStatus(task.status)

  return (
    <div className="border border-border rounded-lg p-3 bg-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-gray-500">{task.id}</p>
          <h4 className="text-sm sm:text-base font-semibold text-gray-900 mt-1">{task.title || 'Untitled task'}</h4>
        </div>
        <span className={`text-xs px-2 py-1 rounded border ${priorityBadgeClass(task.priority)}`}>
          P{task.priority ?? '-'}
        </span>
      </div>

      {task.description && (
        <p className="text-sm text-gray-600 mt-2">{task.description}</p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">{agent?.emoji || '👤'}</span>
          <span className="text-sm text-gray-700 truncate">{agent?.name || 'Unassigned'}</span>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${statusBadgeClass(status)}`}>
          {humanizeStatus(status)}
        </span>
      </div>

      <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
        <AlertCircle className="w-3.5 h-3.5" />
        <span>{formatTaskTime(task)}</span>
      </div>
    </div>
  )
}

function normalizeStatus(status) {
  return String(status || '').trim().toLowerCase().replace(/\s+/g, '_')
}

function humanizeStatus(status) {
  if (!status) return 'unknown'
  return status.replace(/_/g, ' ')
}

function getTaskTime(task) {
  return new Date(task.updated_at || task.created_at || 0).getTime()
}

function formatTaskTime(task) {
  const raw = task.updated_at || task.created_at
  if (!raw) return 'No timestamp'
  const date = new Date(raw)
  return `Updated ${date.toLocaleString()}`
}

function sortByPriorityThenRecency(a, b) {
  const aPriority = typeof a.priority === 'number' ? a.priority : 999
  const bPriority = typeof b.priority === 'number' ? b.priority : 999
  if (aPriority !== bPriority) return aPriority - bPriority
  return getTaskTime(b) - getTaskTime(a)
}

function priorityBadgeClass(priority) {
  if (priority === 1) return 'bg-red-50 text-red-700 border-red-200'
  if (priority === 2) return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-blue-50 text-blue-700 border-blue-200'
}

function statusBadgeClass(status) {
  if (['in_progress', 'in-progress', 'active'].includes(status)) return 'bg-blue-100 text-blue-700'
  if (['completed', 'done'].includes(status)) return 'bg-green-100 text-green-700'
  return 'bg-amber-100 text-amber-700'
}

export default Tasks
