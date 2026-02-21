# Stockton Runbook

## Current Agent IDs (Canonical)

Use only these IDs in mentions, tasks, and workflow routing:

- `andrej`
- `ansh`
- `elon`
- `guillermo`
- `jeff`
- `kelsey`
- `medic`
- `moxie`
- `steve`
- `tobi`
- `wes`

## Deprecated Agent IDs (Do Not Use)

These IDs were merged and should not be used anymore:

- `ramon` -> `elon`
- `viper` -> `jeff`
- `scales` -> `tobi`
- `forge` -> `kelsey`
- `webber` -> `guillermo`

## Active Public Tables

- `agents`
- `chat_arena`
- `chat_messages`
- `cron_jobs`
- `credentials`
- `settings`
- `tasks`
- `token_usage`

## Chat Flow

1. Frontend `/chat` sends to:
   - `POST https://n8n.anshdhawan.cloud/webhook/stockton-chat-input`
2. n8n inserts into `public.chat_arena`.
3. Supabase triggers invoke mention routing and task worker workflows.

## Supabase Cleanup Backup

Backup schema created during cleanup:

- `backup_20260221`

Includes `*_pre_cleanup` tables for rollback/reference.

## Quick Validation Checklist

1. Send a message from `/chat` and confirm a row appears in `chat_arena`.
2. Mention one or more agents (e.g. `@elon @jeff`) and confirm agent replies are inserted.
3. Confirm no old IDs appear:
   - `ramon`, `viper`, `scales`, `forge`, `webber`.
4. Confirm task handoff still works (`tasks.assignee` uses canonical IDs only).
