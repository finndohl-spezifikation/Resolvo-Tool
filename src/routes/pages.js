import { Router } from "express";
import { getSession } from "./auth.js";
import { getClient } from "../gateway.js";
import { getGuild, getPanelConfig, getStats } from "../db.js";

const router = Router();

const BASE_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0f; color: #e2e2e2; line-height: 1.6; min-height: 100vh; }
  nav { background: #111118; border-bottom: 1px solid #1e1e2e; position: sticky; top: 0; z-index: 100; }
  .nav-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; height: 64px; }
  .nav-brand { display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 1.25rem; color: #fff; text-decoration: none; }
  .nav-brand .logo { width: 36px; height: 36px; background: linear-gradient(135deg, #8b5cf6, #6d28d9); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .nav-links { display: flex; gap: 8px; align-items: center; }
  .nav-links a { color: #a1a1aa; text-decoration: none; font-size: 0.9rem; padding: 8px 14px; border-radius: 6px; transition: all .2s; }
  .nav-links a:hover { color: #fff; background: #1e1e2e; }
  .nav-links a.active { color: #fff; background: #27273a; }
  .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 0.9rem; text-decoration: none; border: none; cursor: pointer; transition: all .2s; }
  .btn-primary { background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: #fff; }
  .btn-primary:hover { filter: brightness(1.15); transform: translateY(-1px); }
  .btn-secondary { background: #1e1e2e; color: #fff; }
  .btn-secondary:hover { background: #27273a; }
  .btn-success { background: #22c55e; color: #fff; }
  .btn-success:hover { filter: brightness(1.1); }
  .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
  .hero { padding: 80px 0 60px; text-align: center; }
  .hero h1 { font-size: 3rem; color: #fff; margin-bottom: 16px; line-height: 1.2; }
  .hero p { font-size: 1.15rem; color: #a1a1aa; max-width: 600px; margin: 0 auto 32px; }
  .hero-btns { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
  .features { padding: 60px 0; }
  .features h2 { text-align: center; font-size: 1.8rem; color: #fff; margin-bottom: 40px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
  .card { background: #111118; border: 1px solid #1e1e2e; border-radius: 12px; padding: 28px; transition: all .2s; }
  .card:hover { border-color: #8b5cf6; transform: translateY(-2px); }
  .card-icon { font-size: 2rem; margin-bottom: 16px; }
  .card h3 { color: #fff; font-size: 1.1rem; margin-bottom: 8px; }
  .card p { color: #a1a1aa; font-size: 0.9rem; }
  .page-header { padding: 48px 0 32px; text-align: center; }
  .page-header h1 { font-size: 2.2rem; color: #fff; margin-bottom: 8px; }
  .page-header p { color: #a1a1aa; }
  .content { padding: 24px 0 60px; }
  .content h2 { color: #fff; font-size: 1.3rem; margin: 32px 0 12px; }
  .content p { color: #a1a1aa; margin-bottom: 16px; }
  .content ul { color: #a1a1aa; margin: 0 0 16px 24px; }
  .content li { margin-bottom: 6px; }
  .content a { color: #8b5cf6; text-decoration: none; }
  .server-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
  .server-card { background: #111118; border: 1px solid #1e1e2e; border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 16px; transition: all .2s; }
  .server-card:hover { border-color: #8b5cf6; }
  .server-icon { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #8b5cf6, #6d28d9); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: #fff; flex-shrink: 0; }
  .server-icon img { width: 56px; height: 56px; border-radius: 50%; }
  .server-info { flex: 1; }
  .server-name { color: #fff; font-weight: 600; font-size: 1rem; margin-bottom: 4px; }
  .server-meta { color: #71717a; font-size: 0.8rem; }
  .premium-card { max-width: 400px; margin: 0 auto; background: #111118; border: 1px solid #1e1e2e; border-radius: 16px; padding: 40px; text-align: center; }
  .premium-card h2 { color: #fff; font-size: 1.5rem; margin-bottom: 8px; }
  .price { font-size: 3rem; font-weight: 700; color: #fff; margin: 16px 0; }
  .price span { font-size: 1rem; color: #71717a; font-weight: 400; }
  .features-list { text-align: left; margin: 24px 0; }
  .features-list li { color: #a1a1aa; list-style: none; padding: 6px 0; padding-left: 28px; position: relative; }
  .features-list li::before { content: "\u2714"; position: absolute; left: 0; color: #22c55e; }
  .footer { background: #111118; border-top: 1px solid #1e1e2e; padding: 40px 0; margin-top: auto; }
  .footer-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
  .footer-links { display: flex; gap: 24px; }
  .footer-links a { color: #71717a; text-decoration: none; font-size: 0.85rem; }
  .footer-links a:hover { color: #a1a1aa; }
  .copyright { color: #52525b; font-size: 0.85rem; }
  .user-chip { display: flex; align-items: center; gap: 10px; }
  .user-chip img { width: 32px; height: 32px; border-radius: 50%; }
  .user-chip span { color: #e2e2e2; font-size: 0.9rem; font-weight: 500; }
  .empty { text-align: center; padding: 60px 20px; color: #71717a; }
  .empty-icon { font-size: 3rem; margin-bottom: 16px; }
`;

function layout(title, content, { session = null, activeNav = "" } = {}) {
  const isLoggedIn = !!session;
  const userHtml = isLoggedIn
    ? `<div class="user-chip"><img src="https://cdn.discordapp.com/avatars/${session.userId}/${session.avatar}.png" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'" alt=""><span>${session.username}</span><a href="/auth/logout" style="color:#a1a1aa;font-size:.8rem;margin-left:8px;">Abmelden</a></div>`
    : `<a href="/auth/login?redirect=${encodeURIComponent(activeNav === "servers" ? "/servers" : "/servers")}" class="btn btn-primary">Mit Discord anmelden</a>`;

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} \u2014 Resolvo Tool</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <nav>
    <div class="nav-inner">
      <a href="/" class="nav-brand"><div class="logo">\ud83c\udfab</div>Resolvo Tool</a>
      <div class="nav-links">
        <a href="/" class="${activeNav === "home" ? "active" : ""}">Startseite</a>
        <a href="/add">Hinzuf\u00fcgen</a>
        <a href="/servers" class="${activeNav === "servers" ? "active" : ""}">Meine Server</a>
        <a href="/premium" class="${activeNav === "premium" ? "active" : ""}">Premium</a>
        <a href="/terms">Nutzungsbedingungen</a>
        <a href="/privacy">Datenschutz</a>
        ${userHtml}
      </div>
    </div>
  </nav>
  ${content}
  <div style="flex:1"></div>
  <footer class="footer">
    <div class="footer-inner">
      <div class="copyright">\u00a9 ${new Date().getFullYear()} Resolvo Tool</div>
      <div class="footer-links">
        <a href="/terms">Nutzungsbedingungen</a>
        <a href="/privacy">Datenschutzerkl\u00e4rung</a>
      </div>
    </div>
  </footer>
</body>
</html>`;
}

// ── Homepage ───────────────────────────────────────────────────────────────────

router.get("/", (req, res) => {
  res.send(layout("Startseite`, `
    <div class="hero">
      <h1>Das modernste Ticket-System f\u00fcr Discord</h1>
      <p>Resolvo Tool verwaltet deine Support-Anfragen elegant. Mit interaktivem Panel, automatischen Transkripten und einem nahtlosen Premium-Erlebnis.</p>
      <div class="hero-btns">
        <a href="/add" class="btn btn-primary">Bot zu Discord hinzuf\u00fcgen</a>
        <a href="/premium" class="btn btn-secondary">Premium-Features entdecken</a>
      </div>
    </div>
    <div class="features container">
      <h2>Was Resolvo Tool kann</h2>
      <div class="grid">
        <div class="card">
          <div class="card-icon">\ud83d\udce1</div>
          <h3>Interaktives Ticket-Panel</h3>
          <p>Konfiguriere \u00fcber /panel alles: Channel, Farben, Text und Berechtigungen. Mit einem Klick ver\u00f6ffentlicht.</p>
        </div>
        <div class="card">
          <div class="card-icon">\ud83d\udccb</div>
          <h3>Automatische Transkripte</h3>
          <p>Beim Schlie\u00dfen eines Tickets wird der komplette Chat-Verlauf automatisch in einen festgelegten Channel gepostet.</p>
        </div>
        <div class="card">
          <div class="card-icon">\u2b50</div>
          <h3>Bewertungssystem</h3>
          <p>Deine Nutzer k\u00f6nnen den Support direkt nach dem Ticket bewerten. So verbesserst du deinen Service stetig.</p>
        </div>
        <div class="card">
          <div class="card-icon">\ud83d\udcca</div>
          <h3>Statistiken</h3>
          <p>Behalte den \u00dcberblick \u00fcber offene und geschlossene Tickets, Aufl\u00f6sungsraten und durchschnittliche Bewertungen.</p>
        </div>
        <div class="card">
          <div class="card-icon">\ud83c\udff7\ufe0f</div>
          <h3>Rollenbasierte Berechtigungen</h3>
          <p>Lege fest, welche Rollen Tickets sehen und bearbeiten d\u00fcrfen. Vollst\u00e4ndige Zugriffskontrolle.</p>
        </div>
        <div class="card">
          <div class="card-icon">\ud83d\ude80</div>
          <h3>Schnell & Zuverl\u00e4ssig</h3>
          <p>Resolvo Tool l\u00e4uft auf Hochleistungs-Servern mit 99,9% Verf\u00fcgbarkeit. Dein Support steht immer bereit.</p>
        </div>
      </div>
    </div>
  `, { activeNav: "home" }));
});

// ── Add Bot ─────────────────────────────────────────────────────────────────────

router.get("/add", (req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const perms = "MANAGE_CHANNELS+MANAGE_ROLES+SEND_MESSAGES+EMBED_LINKS+ATTACH_FILES+READ_MESSAGE_HISTORY+USE_APPLICATION_COMMANDS+MANAGE_THREADS";
  const scope = "bot+applications.commands";
  const redirect = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=${perms}&scope=${encodeURIComponent(scope)}`;
  res.redirect(redirect);
});

// ── My Servers ────────────────────────────────────────────────────────────────

router.get("/servers", (req, res) => {
  const session = getSession(req);
  if (!session) {
    res.redirect("/auth/login?redirect=/servers");
    return;
  }

  const client = getClient();
  const botGuildIds = client ? [...client.guilds.cache.keys()] : [];

  const userAdminGuilds = session.guilds?.filter(g => {
    const perms = BigInt(g.permissions || 0);
    return (perms & BigInt(0x0000000000000020)) !== 0n; // MANAGE_GUILD
  }) || [];

  const matching = userAdminGuilds.filter(g => botGuildIds.includes(g.id));

  let serversHtml;
  if (matching.length === 0) {
    serversHtml = `
      <div class="empty">
        <div class="empty-icon">\ud83d\udee1\ufe0f</div>
        <h3 style="color:#fff;margin-bottom:8px;">Keine Server gefunden</h3>
        <p style="margin-bottom:20px;">Der Bot ist noch auf keinem deiner Server installiert.</p>
        <a href="/add" class="btn btn-primary">Resolvo Tool hinzuf\u00fcgen</a>
      </div>
    `;
  } else {
    serversHtml = `<div class="server-grid">${matching.map(g => {
      const icon = g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null;
      const config = getPanelConfig(g.id);
      const stats = getStats(g.id);
      return `
        <div class="server-card">
          <div class="server-icon">${icon ? `<img src="${icon}" alt="">` : g.name.charAt(0)}</div>
          <div class="server-info">
            <div class="server-name">${g.name}</div>
            <div class="server-meta">
              ${config?.panel_channel_id ? "\u2705 Panel aktiv" : "\u274c Panel nicht konfiguriert"} \u00b7
              Offene Tickets: ${stats.open} \u00b7 Geschlossen: ${stats.closed}
            </div>
          </div>
        </div>
      `;
    }).join("")}</div>`;
  }

  res.send(layout("Meine Server", `
    <div class="page-header">
      <h1>Meine Server</h1>
      <p>Hier siehst du alle Server, auf denen Resolvo Tool installiert ist.</p>
    </div>
    <div class="content container">
      ${serversHtml}
    </div>
  `, { session, activeNav: "servers" }));
});

// ── Premium ─────────────────────────────────────────────────────────────────────

router.get("/premium", (req, res) => {
  res.send(layout("Premium", `
    <div class="page-header">
      <h1>\u2b50 Resolvo Tool Premium</h1>
      <p>Schalte alle Features frei \u2014 einmalig zahlen, dauerhaft genie\u00dfen.</p>
    </div>
    <div class="content">
      <div class="premium-card">
        <h2>Premium</h2>
        <p style="color:#a1a1aa;margin-bottom:4px;">Einmaliger Kauf</p>
        <div class="price">5,99\u20ac <span>/ einmalig</span></div>
        <ul class="features-list">
          <li>Erweiterte Server-Statistiken</li>
          <li>Unbegrenzte Ticket-Kategorien</li>
          <li>Staff-Leaderboard & Bewertungen</li>
          <li>Priorisierte Unterst\u00fctzung</li>
          <li>Fr\u00fcher Zugang zu neuen Features</li>
        </ul>
        <p style="color:#71717a;font-size:.85rem;margin:16px 0;">
          Um Premium zu kaufen, verwende den <code>/premium</code> Befehl in einem Server mit Resolvo Tool.
        </p>
        <a href="/servers" class="btn btn-primary" style="width:100%;justify-content:center;">Zu meinen Servern</a>
      </div>
    </div>
  `, { activeNav: "premium" }));
});

router.get("/premium/success", (req, res) => {
  res.send(layout("Premium aktiviert", `
    <div class="page-header">
      <h1>\u2705 Premium aktiviert!</h1>
      <p>Dein Server hat jetzt Zugriff auf alle Premium-Features.</p>
    </div>
    <div class="content container" style="text-align:center;">
      <p>Vielen Dank f\u00fcr deine Unterst\u00fctzung! Du kannst jetzt alle Premium-Features nutzen.</p>
      <a href="/servers" class="btn btn-primary" style="margin-top:20px;">Zu meinen Servern</a>
    </div>
  `));
});

router.get("/premium/cancel", (req, res) => {
  res.send(layout("Zahlung abgebrochen", `
    <div class="page-header">
      <h1>Zahlung abgebrochen</h1>
      <p>Die Zahlung wurde abgebrochen. Dein Server hat weiterhin den kostenlosen Zugriff.</p>
    </div>
    <div class="content container" style="text-align:center;">
      <a href="/premium" class="btn btn-primary" style="margin-top:20px;">Zur\u00fcck zu Premium</a>
    </div>
  `));
});

// ── Terms ───────────────────────────────────────────────────────────────────────

router.get("/terms", (req, res) => {
  res.send(layout("Nutzungsbedingungen", `
    <div class="page-header"><h1>Nutzungsbedingungen</h1></div>
    <div class="content container">
      <p class="subtitle" style="color:#71717a;margin-bottom:32px;">Zuletzt aktualisiert: ${new Date().toLocaleDateString("de-DE")}</p>
      <h2>1. Geltungsbereich</h2>
      <p>Diese Nutzungsbedingungen gelten f\u00fcr die Nutzung des Discord-Bots \u201eResolvo Tool\u201c sowie des zugeh\u00f6rigen Web-Dashboards. Mit der Installation des Bots oder der Nutzung des Dashboards stimmst du diesen Bedingungen zu.</p>
      <h2>2. Nutzung des Dienstes</h2>
      <p>Resolvo Tool darf ausschlie\u00dflich f\u00fcr legale Zwecke und in \u00dcbereinstimmung mit den Discord-Nutzungsbedingungen verwendet werden. Jeglicher Missbrauch ist untersagt.</p>
      <h2>3. Premium-Abonnement</h2>
      <p>Das Premium-Upgrade wird f\u00fcr eine einmalige Zahlung von 5,99\u20ac angeboten und gew\u00e4hrt dauerhaften Zugang zu Premium-Funktionen. Es besteht kein Anspruch auf R\u00fcckerstattung nach erfolgter Aktivierung, es sei denn, dies ist gesetzlich vorgeschrieben.</p>
      <h2>4. Datenspeicherung</h2>
      <p>Wir speichern Discord-Nutzer-IDs, Server-IDs und Ticket-Inhalte zur Bereitstellung des Dienstes. Weitere Informationen findest du in unserer <a href="/privacy">Datenschutzerkl\u00e4rung</a>.</p>
      <h2>5. Verf\u00fcgbarkeit</h2>
      <p>Wir bem\u00fchen uns um eine hohe Verf\u00fcgbarkeit, k\u00f6nnen jedoch keine 100%ige Verf\u00fcgbarkeit garantieren.</p>
      <h2>6. Haftungsbeschr\u00e4nkung</h2>
      <p>Resolvo Tool haftet nicht f\u00fcr Sch\u00e4den, die durch die Nutzung oder Nicht-Nutzung des Dienstes entstehen, soweit dies gesetzlich zul\u00e4ssig ist.</p>
      <h2>7. Kontakt</h2>
      <p>Bei Fragen erreichst du uns \u00fcber unseren Discord-Support.</p>
    </div>
  `));
});

// ── Privacy ──────────────────────────────────────────────────────────────────────

router.get("/privacy", (req, res) => {
  res.send(layout("Datenschutzerkl\u00e4rung", `
    <div class="page-header"><h1>Datenschutzerkl\u00e4rung</h1></div>
    <div class="content container">
      <p class="subtitle" style="color:#71717a;margin-bottom:32px;">Zuletzt aktualisiert: ${new Date().toLocaleDateString("de-DE")}</p>
      <h2>1. Verantwortlicher</h2>
      <p>Verantwortlich f\u00fcr die Datenverarbeitung ist der Betreiber von Resolvo Tool.</p>
      <h2>2. Welche Daten wir speichern</h2>
      <ul>
        <li>Discord Nutzer-ID und Nutzername</li>
        <li>Discord Server-ID und Servername</li>
        <li>Ticket-Inhalte und Nachrichten</li>
        <li>Bewertungen und Zeitstempel</li>
        <li>Zahlungsstatus (keine Zahlungsdaten \u2013 diese werden von Stripe verarbeitet)</li>
      </ul>
      <h2>3. Zweck der Datenverarbeitung</h2>
      <p>Die gespeicherten Daten werden ausschlie\u00dflich zur Bereitstellung des Ticket-Systems und der Premium-Funktionen verwendet.</p>
      <h2>4. Drittanbieter</h2>
      <p><strong>Stripe:</strong> Zahlungsabwicklung gem\u00e4\u00df <a href="https://stripe.com/de/privacy">Stripes Datenschutzerkl\u00e4rung</a>.</p>
      <p><strong>Discord:</strong> Nutzerdaten werden \u00fcber die Discord API abgerufen.</p>
      <h2>5. Datenl\u00f6schung</h2>
      <p>Du kannst jederzeit die L\u00f6schung deiner Daten beantragen. Kontaktiere uns \u00fcber unseren Support-Server.</p>
      <h2>6. Deine Rechte</h2>
      <ul>
        <li>Recht auf Auskunft \u00fcber gespeicherte Daten</li>
        <li>Recht auf Berichtigung und L\u00f6schung</li>
        <li>Recht auf Einschr\u00e4nkung der Verarbeitung</li>
      </ul>
      <h2>7. Datensicherheit</h2>
      <p>Alle Daten werden verschl\u00fcsselt \u00fcbertragen (HTTPS) und in einer lokalen SQLite-Datenbank gespeichert.</p>
    </div>
  `));
});

export default router;
