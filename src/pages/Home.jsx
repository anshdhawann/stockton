import React, { useState, useEffect } from 'react'
import { getAgents, getTasks, getTokenUsage } from '../utils/supabase'
import { TrendingUp, CheckCircle, Clock, Zap, Users } from 'lucide-react'

function Stats() {
  const [stats, setStats] = useState({
    tokensToday: 0,
    tasksPending: 0,
    tasksDone: 0,
    activeAgents: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const [agents, tasks, tokenUsage] = await Promise.all([
        getAgents(),
        getTasks(),
        getTokenUsage(),
      ])

      const today = new Date().toISOString().split('T')[0]
      const tokensToday = tokenUsage
        .filter(t => t.created_at.startsWith(today))
        .reduce((sum, t) => sum + (t.tokens_input || 0) + (t.tokens_output || 0), 0)

      setStats({
        tokensToday,
        tasksPending: tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
        tasksDone: tasks.filter(t => t.status === 'completed').length,
        activeAgents: agents.filter(a => a.status === 'active').length,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Tokens Today',
      value: stats.tokensToday.toLocaleString(),
      icon: Zap,
      color: 'text-primary',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'Pending',
      value: stats.tasksPending,
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Completed',
      value: stats.tasksDone,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Active',
      value: stats.activeAgents,
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
  ]

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
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm sm:text-base text-gray-500 mt-1">Real-time system stats</p>
      </div>

      {/* Stats Grid - 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {statCards.map(({ title, value, icon: Icon, color, bgColor }) => (
          <div key={title} className="card p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{value}</p>
              </div>
              <div className={`${bgColor} p-2 sm:p-3 rounded-lg`}>
                <Icon className={`w-4 h-4 sm:w-6 sm:h-6 ${color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions - Stack on mobile */}
      <div className="card">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button className="btn-primary flex items-center justify-center gap-2 py-3">
            <Zap className="w-4 h-4" />
            New Task
          </button>
          <button className="btn-secondary flex items-center justify-center gap-2 py-3">
            <Users className="w-4 h-4" />
            View Agents
          </button>
          <button className="btn-secondary flex items-center justify-center gap-2 py-3">
            <TrendingUp className="w-4 h-4" />
            Reports
          </button>
        </div>
      </div>
    </div>
  )
}

export default Stats
