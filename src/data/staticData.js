// Static data - in production this would be parsed from the markdown files
export const agents = [
  {
    id: 'ramon',
    name: 'Ramon',
    role: 'Founder/CEO',
    emoji: '🦍',
    status: 'active',
    load: 3,
    currentTask: 'Monitoring swarm',
    lastUpdate: '2026-02-19 11:45'
  },
  {
    id: 'scales',
    name: 'Scales',
    role: 'CTO/PM',
    emoji: '🦎',
    status: 'idle',
    load: 0,
    currentTask: 'Awaiting assignment',
    lastUpdate: '2026-02-19 11:45'
  },
  {
    id: 'viper',
    name: 'Viper',
    role: 'Backend Lead',
    emoji: '🐍',
    status: 'idle',
    load: 0,
    currentTask: 'Awaiting specs',
    lastUpdate: '2026-02-19 11:45'
  },
  {
    id: 'webber',
    name: 'Webber',
    role: 'Frontend Lead',
    emoji: '🕷️',
    status: 'idle',
    load: 0,
    currentTask: 'Awaiting specs',
    lastUpdate: '2026-02-19 11:45'
  },
  {
    id: 'forge',
    name: 'Forge',
    role: 'DevOps Lead',
    emoji: '🦀',
    status: 'idle',
    load: 0,
    currentTask: 'Awaiting specs',
    lastUpdate: '2026-02-19 11:45'
  }
];

export const tasks = [
  {
    id: 'W1',
    title: 'Interview Thin Air Labs about current setup',
    description: 'Understand Supabase schema, document n8n workflows, identify pain points',
    assignee: 'scales',
    priority: 1,
    status: 'pending'
  },
  {
    id: 'W2',
    title: 'Design system architecture',
    description: 'Create technical specification for Grant Match tool',
    assignee: null,
    priority: 2,
    status: 'unassigned'
  },
  {
    id: 'W3',
    title: 'Set up FastAPI project structure',
    description: 'Initialize backend project with proper structure',
    assignee: null,
    priority: 2,
    status: 'unassigned'
  },
  {
    id: 'W4',
    title: 'Set up React project structure',
    description: 'Initialize frontend dashboard project',
    assignee: null,
    priority: 2,
    status: 'unassigned'
  },
  {
    id: 'W5',
    title: 'Audit and optimize n8n workflows',
    description: 'Review existing workflows, suggest improvements',
    assignee: null,
    priority: 2,
    status: 'unassigned'
  }
];

export const completedToday = [
  {
    id: 1,
    task: 'Initial agent team setup',
    agent: 'ramon',
    time: '2026-02-19 11:30'
  },
  {
    id: 2,
    task: 'Shared workspace created',
    agent: 'ramon',
    time: '2026-02-19 11:45'
  },
  {
    id: 3,
    task: 'Agent configs updated',
    agent: 'ramon',
    time: '2026-02-19 11:51'
  }
];

export const project = {
  name: 'Grant Match Tool for Thin Air Labs',
  phase: 'Discovery',
  status: 'active',
  blockers: 0,
  activeAgents: 5,
  completedTasks: 3
};

export const recentActivity = [
  {
    id: 1,
    agent: 'ramon',
    action: 'Created shared workspace',
    time: '11:45',
    type: 'system'
  },
  {
    id: 2,
    agent: 'ramon',
    action: 'Updated agent configs',
    time: '11:51',
    type: 'system'
  },
  {
    id: 3,
    agent: 'scales',
    action: 'Awaiting assignment',
    time: '11:45',
    type: 'status'
  }
];
