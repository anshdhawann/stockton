# Mission Control Dashboard

A real-time dashboard for monitoring the Apex Collective agent swarm.

## Features

- **Agent Status**: See all 5 agents (Ramon, Scales, Viper, Webber, Forge) with their current load and status
- **Task Queue**: View pending, in-progress, and completed tasks
- **Today's Progress**: Track what the team accomplished today
- **Project Overview**: Current phase, blockers, and recent decisions
- **Activity Feed**: Real-time updates from the agent swarm

## Tech Stack

- React 18
- Tailwind CSS
- Vite
- Lucide React (icons)

## Data Sources

The dashboard reads from the shared workspace:
- `project_master.md` - Project goals and phase
- `status_board.md` - Agent statuses and updates
- `work_queue.md` - Task backlog
- `decisions_log.md` - Recent decisions

## Development

```bash
npm install
npm run dev
```

## Deployment

```bash
npm run build
# Deploy dist/ to GitHub Pages
```
