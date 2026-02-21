import React, { useState, useEffect } from 'react'
import { getAgents, getTasks, getTokenUsage } from '../utils/supabase'
import { TrendingUp, CheckCircle, Clock, Zap, Users } from 'lucide-react'

function Stats() {
  const [stats, setStats] = useState({
    tokensToday: 0,
    tokensInToday: 0,
    tokensOutToday: 0,
    costTodayUsd: 0,
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

      const localDayStart = new Date()
      localDayStart.setHours(0, 0, 0, 0)
      const todayRows = (tokenUsage || []).filter((t) => {
        const created = new Date(t.created_at)
        return !Number.isNaN(created.getTime()) && created >= localDayStart
      })

      const tokensInToday = todayRows.reduce((sum, t) => sum + (Number(t.tokens_input) || 0), 0)
      const tokensOutToday = todayRows.reduce((sum, t) => sum + (Number(t.tokens_output) || 0), 0)
      const tokensToday = tokensInToday + tokensOutToday
      const costTodayUsd = todayRows.reduce((sum, t) => sum + (Number(t.cost_usd) || 0), 0)

      setStats({
        tokensToday,
        tokensInToday,
        tokensOutToday,
        costTodayUsd,
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
      title: 'Tokens Spent Today',
      value: stats.tokensToday.toLocaleString(),
      icon: Zap,
      color: 'text-primary',
      bgColor: 'bg-primary-50',
      subtitle: `In ${stats.tokensInToday.toLocaleString()} • Out ${stats.tokensOutToday.toLocaleString()} • $${stats.costTodayUsd.toFixed(4)}`,
    },
    {
      title: 'Pending',
      value: stats.tasksPending,
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
      subtitle: null,
    },
    {
      title: 'Completed',
      value: stats.tasksDone,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      subtitle: null,
    },
    {
      title: 'Active',
      value: stats.activeAgents,
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      subtitle: null,
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
        {statCards.map(({ title, value, subtitle, icon: Icon, color, bgColor }) => (
          <div key={title} className="card p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{value}</p>
                {subtitle && (
                  <p className="text-[11px] sm:text-xs text-gray-500 mt-1 sm:mt-2">{subtitle}</p>
                )}
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
