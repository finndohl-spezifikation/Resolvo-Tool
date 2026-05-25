# Resolvo Tool — Discord Ticket Bot

Ein öffentlicher Discord-Ticket-Bot mit Live-Web-Dashboard.

## Features

- 🎫 Slash-Commands: `/ticket`, `/panel`, `/setup`, `/stats`, `/premium`
- 📊 Ticket-Management mit Prioritäten und Status
- ⭐ Staff-Bewertungen (1–5 Sterne)
- 💜 Stimmungsanalyse bei Tickets
- 📈 Öffentliche Server-Statistiken
- 💳 Stripe-Premium für 5,99€ (einmalig, dauerhaft)

## Deployment auf Railway

### 1. Umgebungsvariablen setzen

| Variable | Beschreibung |
|---|---|
| `DISCORD_TOKEN` | Bot-Token aus dem Discord Dev Portal |
| `DISCORD_CLIENT_ID` | Application ID aus dem Discord Dev Portal |
| `DISCORD_PUBLIC_KEY` | Public Key aus dem Discord Dev Portal |
| `DATABASE_URL` | PostgreSQL Connection String (Railway stellt diesen bereit) |
| `STRIPE_SECRET_KEY` | Stripe Secret Key |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Secret |
| `DASHBOARD_URL` | Deine Railway-Domain (z.B. `https://resolvo-tool.up.railway.app`) |
| `PORT` | Wird von Railway automatisch gesetzt |

### 2. Discord konfigurieren

Im Discord Developer Portal → deine App → General Information:

- **Interactions Endpoint URL:** `https://deine-domain/api/interactions`
- **Terms of Service URL:** `https://deine-domain/api/terms`
- **Privacy Policy URL:** `https://deine-domain/api/privacy`

### 3. Slash-Commands registrieren

Nach dem ersten erfolgreichen Deploy im Railway-Terminal:

```bash
node src/commands/register.js
```

## Lokale Entwicklung

```bash
npm install
PORT=8080 DATABASE_URL=... DISCORD_TOKEN=... node src/index.js
```
