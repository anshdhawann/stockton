# Stockton Dashboard

Real-time dashboard for tasks, agents, cron jobs, workflows, and chat.

## Stack

- React 18
- Vite
- Tailwind CSS
- Supabase (data + realtime)
- n8n (chat ingress + automation)

## Local Development

```bash
npm install
npm run dev
```

## Chat Send Flow

The `/chat` Send button now writes through n8n (not direct Supabase insert):

- Frontend `POST` -> `https://n8n.anshdhawan.cloud/webhook/stockton-chat-input`
- n8n inserts into `public.chat_arena`
- existing DB triggers route `@agent` mentions

This keeps chat writes consistent with your n8n agent orchestration.

## Optional Environment Variables

Create `.env` (or `.env.local`) to override the webhook:

```bash
VITE_STOCKTON_CHAT_WEBHOOK_URL=https://n8n.anshdhawan.cloud/webhook/stockton-chat-input
```

If unset, the app defaults to that URL.

## Build

```bash
npm run build
```
