import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xutzwqdrxyjpqsawwefd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1dHp3cWRyeHlqcHFzYXd3ZWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NzI2MDksImV4cCI6MjA3NTM0ODYwOX0.bDQVbRPDIicSgwdmfaknpUYw8-lxJ8AiSgc-V_kR30s'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Helper functions for common operations
export async function getAgents() {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data
}

export async function getTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, agents(name, emoji)')
    .order('priority', { ascending: true })
  
  if (error) throw error
  return data
}

export async function getCronJobs() {
  const { data, error } = await supabase
    .from('cron_jobs')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data
}

export async function getTokenUsage() {
  const { data, error } = await supabase
    .from('token_usage')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  
  if (error) throw error
  return data
}

export async function getChatMessages(sessionId) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*, agents(name, emoji)')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data
}

export async function sendChatMessage(sessionId, agentId, content, role = 'user') {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      agent_id: agentId,
      role,
      content,
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateAgentMd(agentId, field, content) {
  const { data, error } = await supabase
    .from('agents')
    .update({ [field]: content })
    .eq('id', agentId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
  
  if (error) throw error
  return data
}

// Realtime subscriptions
export function subscribeToAgents(callback) {
  return supabase
    .channel('agents-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, callback)
    .subscribe()
}

export function subscribeToTasks(callback) {
  return supabase
    .channel('tasks-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, callback)
    .subscribe()
}

export function subscribeToChat(sessionId, callback) {
  return supabase
    .channel(`chat-${sessionId}`)
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'chat_messages',
      filter: `session_id=eq.${sessionId}`
    }, callback)
    .subscribe()
}
