import { Users, CheckCircle, AlertCircle, Activity, Zap } from 'lucide-react';
import { agents, tasks, completedToday, project, recentActivity } from './data/staticData';

function App() {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getLoadColor = (load) => {
    if (load <= 3) return 'text-green-400';
    if (load <= 6) return 'text-yellow-400';
    if (load <= 8) return 'text-orange-400';
    return 'text-red-400';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 2: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Zap className="w-8 h-8 text-yellow-400" />
              Apex Collective
            </h1>
            <p className="text-gray-400 mt-1">Mission Control Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-gray-900 rounded-lg px-4 py-2 border border-gray-800">
              <span className="text-gray-400 text-sm">Project: </span>
              <span className="text-white font-medium">{project.name}</span>
            </div>
            <div className="bg-gray-900 rounded-lg px-4 py-2 border border-gray-800">
              <span className="text-gray-400 text-sm">Phase: </span>
              <span className="text-green-400 font-medium">{project.phase}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Agents</p>
              <p className="text-2xl font-bold text-white">{project.activeAgents}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending Tasks</p>
              <p className="text-2xl font-bold text-white">{tasks.filter(t => t.status === 'pending').length}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Completed Today</p>
              <p className="text-2xl font-bold text-green-400">{completedToday.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Blockers</p>
              <p className="text-2xl font-bold text-red-400">{project.blockers}</p>
            </div>
            <Activity className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Agents Column */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Available Agents
          </h2>
          <div className="space-y-3">
            {agents.map(agent => (
              <div key={agent.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{agent.emoji}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{agent.name}</h3>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                    </div>
                    <p className="text-sm text-gray-400">{agent.role}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-gray-500 truncate max-w-[150px]">{agent.currentTask}</p>
                      <span className={`text-sm font-medium ${getLoadColor(agent.load)}`}>
                        {agent.load}/10
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-gray-800 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${agent.load > 8 ? 'bg-red-500' : agent.load > 5 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${agent.load * 10}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks Column */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            Task Queue
          </h2>
          <div className="space-y-3">
            {tasks.map(task => (
              <div key={task.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-mono text-gray-500">{task.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                    P{task.priority}
                  </span>
                </div>
                <h3 className="font-medium text-white mb-1">{task.title}</h3>
                <p className="text-sm text-gray-400 mb-3">{task.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {task.assignee ? (
                      <>
                        <span className="text-lg">{agents.find(a => a.id === task.assignee)?.emoji}</span>
                        <span className="text-sm text-gray-400">{agents.find(a => a.id === task.assignee)?.name}</span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500 italic">Unassigned</span>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    task.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    task.status === 'in-progress' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Column */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-400" />
            Completed Today
          </h2>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-6">
            <div className="space-y-3">
              {completedToday.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-white">{item.task}</p>
                    <p className="text-xs text-gray-500">
                      {agents.find(a => a.id === item.agent)?.emoji} {agents.find(a => a.id === item.agent)?.name} • {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Recent Activity
          </h2>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="space-y-3">
              {recentActivity.map(activity => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="text-lg">{agents.find(a => a.id === activity.agent)?.emoji}</div>
                  <div className="flex-1">
                    <p className="text-sm text-white">
                      <span className="font-medium">{agents.find(a => a.id === activity.agent)?.name}</span>
                      {' '}{activity.action}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
