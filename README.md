# Resolvo Tool

A professional Discord ticket bot with a live web dashboard, AI-powered suggestions, and premium features.

## Features

- 🎫 Discord ticket system with slash commands
- 📊 Real-time web dashboard
- 🤖 Sentiment analysis for incoming tickets
- ⭐ Staff rating system
- 📈 Public server transparency stats
- ⭐ Premium plan (€5.99 one-time) via Stripe

## Slash Commands

| Command | Description |
|---------|-------------|
| `/ticket create` | Create a new support ticket |
| `/ticket close` | Close the current ticket |
| `/ticket add @user` | Add a user to the ticket |
| `/ticket remove @user` | Remove a user from the ticket |
| `/panel` | Create a ticket panel in a channel |
| `/setup` | Configure the bot on your server |
| `/stats` | Show server support statistics |
| `/premium` | View and purchase premium features |

## Setup

### Environment Variables (Railway)

| Variable | Description |
|----------|-------------|
| `DISCORD_TOKEN` | Discord bot token |
| `DISCORD_CLIENT_ID` | Discord application ID |
| `DISCORD_PUBLIC_KEY` | Discord public key for interactions |
| `DATABASE_URL` | PostgreSQL connection string |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `DASHBOARD_URL` | Public URL of your deployment |
| `PORT` | Server port (Railway sets this automatically) |

### Discord Developer Portal

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Create a new application named **Resolvo Tool**
3. Under **Bot**: Reset and copy your token → `DISCORD_TOKEN`
4. Under **General Information**: Copy Application ID → `DISCORD_CLIENT_ID`
5. Under **General Information**: Copy Public Key → `DISCORD_PUBLIC_KEY`
6. Set **Interactions Endpoint URL** to: `https://YOUR_RAILWAY_DOMAIN/api/interactions`
7. Set **Terms of Service URL** to: `https://YOUR_RAILWAY_DOMAIN/api/terms`
8. Set **Privacy Policy URL** to: `https://YOUR_RAILWAY_DOMAIN/api/privacy`

### Register Slash Commands

After deployment, run once:

```bash
pnpm --filter @workspace/api-server run commands:register
```

### Invite Bot to Server

Use this URL (replace `CLIENT_ID`):
```
https://discord.com/oauth2/authorize?client_id=CLIENT_ID&scope=bot+applications.commands&permissions=8
```

## Tech Stack

- **Bot/API**: Node.js + Express + TypeScript
- **Dashboard**: React + Vite + Tailwind CSS
- **Database**: PostgreSQL + Drizzle ORM
- **Payments**: Stripe
- **Hosting**: Railway
- **CI/CD**: GitHub → Railway

## Development

```bash
pnpm install
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/dashboard run dev
```
