import React, { useState, useEffect } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import { 
  Zap, 
  CheckSquare, 
  Clock, 
  Workflow, 
  Users, 
  Settings,
  MessageCircle,
  Menu,
  X
} from 'lucide-react'
import { subscribeToAgents, subscribeToTasks } from './utils/supabase'

// Pages
import Home from './pages/Home'
import Tasks from './pages/Tasks'
import Cron from './pages/Cron'
import Workflows from './pages/Workflows'
import Agents from './pages/Agents'
import SettingsPage from './pages/Settings'
import ChatArena from './pages/ChatArena'

// Components
import ChatWidget from './components/ChatWidget'

function App() {
  const [agents, setAgents] = useState([])
  const [tasks, setTasks] = useState([])
  const [chatOpen, setChatOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const agentsSubscription = subscribeToAgents((payload) => {
      console.log('Agent change:', payload)
    })

    const tasksSubscription = subscribeToTasks((payload) => {
      console.log('Task change:', payload)
    })

    return () => {
      agentsSubscription.unsubscribe()
      tasksSubscription.unsubscribe()
    }
  }, [])

  // Navigation items - Stats removed, Home is implicit
  const navItems = [
    { path: '/tasks', label: 'Tasks', icon: CheckSquare },
    { path: '/cron', label: 'Cron', icon: Clock },
    { path: '/workflows', label: 'Workflows', icon: Workflow },
    { path: '/agents', label: 'Agents', icon: Users },
    { path: '/chat', label: 'Chat', icon: MessageCircle },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - clicking goes to Home */}
            <NavLink to="/" className="flex items-center gap-2 sm:gap-3">
              <div className="bg-primary text-white p-1.5 sm:p-2 rounded-lg">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Stockton</h1>
                <p className="hidden sm:block text-xs text-gray-500">Agent Swarm Control</p>
                <p className="hidden sm:block text-xs text-gray-500">A Claw Enterprise</p>
              </div>
            </NavLink>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setChatOpen(!chatOpen)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-400 transition-colors text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Talk</span>
              </button>
              
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `hidden sm:flex p-2 rounded-lg transition-colors ${
                    isActive ? 'bg-primary-50 text-primary' : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <Settings className="w-5 h-5" />
              </NavLink>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden bg-white border-t border-border animate-slide-in">
            <div className="px-4 py-2 space-y-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </NavLink>
              ))}
              <NavLink
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <Settings className="w-5 h-5" />
                Settings
              </NavLink>
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/cron" element={<Cron />} />
          <Route path="/workflows" element={<Workflows />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/chat" element={<ChatArena />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>

      {/* Chat Widget */}
      <ChatWidget isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}

export default App
