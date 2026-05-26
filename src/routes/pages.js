import { Router } from "express";
import { getSession } from "./auth.js";
import { getClient } from "../gateway.js";
import { getGuild, getPanelConfig, getStats, upsertPanelConfig } from "../db.js";

const router = Router();

const INVITE_URL = "https://discord.com/oauth2/authorize?client_id=1508500695110647839&permissions=8&integration_type=0&scope=applications.commands+bot";

const TRANSLATIONS = {
  de: {
    home: "Startseite",
    add: "Hinzufügen",
    servers: "Meine Server",
    premium: "Premium",
    terms: "Nutzungsbedingungen",
    privacy: "Datenschutz",
    settings: "Einstellungen",
    logout: "Abmelden",
    login: "Mit Discord anmelden",
    heroTitle: "Das modernste Ticket-System für Discord",
    heroDesc: "Resolvo Tool verwaltet deine Support-Anfragen elegant. Mit interaktivem Panel, automatischen Transkripten und nahtlosem Premium-Erlebnis.",
    addBot: "Bot zu Discord hinzufügen",
    discoverPremium: "Premium-Features entdecken",
    featuresTitle: "Was Resolvo Tool kann",
    serversTitle: "Meine Server",
    serversDesc: "Hier siehst du alle Server, auf denen Resolvo Tool installiert ist.",
    noServers: "Keine Server gefunden",
    noServersDesc: "Der Bot ist noch auf keinem deiner Server installiert.",
    premiumTitle: "Resolvo Tool Premium",
    premiumDesc: "Schalte alle Features frei — einmalig zahlen, dauerhaft genießen.",
    premiumPrice: "5,99€",
    premiumOnce: "/ einmalig",
    premiumCmd: "Um Premium zu kaufen, verwende den /premium Befehl in einem Server mit Resolvo Tool.",
    toServers: "Zu meinen Servern",
    panelActive: "Panel aktiv",
    panelInactive: "Panel nicht konfiguriert",
    openTickets: "Offene Tickets",
    closedTickets: "Geschlossen",
    configure: "Konfigurieren",
    back: "Zurück",
    save: "Speichern",
    configTitle: "Server-Konfiguration",
    configDesc: "Passe das Ticket-System für diesen Server an.",
    panelChannel: "Panel-Channel",
    ticketCategory: "Ticket-Kategorie",
    transcriptChannel: "Transkript-Channel",
    supportRole: "Support-Rolle",
    buttonText: "Button-Text",
    buttonColor: "Button-Farbe",
    embedColor: "Embed-Farbe",
    embedTitle: "Embed-Titel",
    embedDesc: "Embed-Beschreibung",
    ratingSystem: "Bewertungssystem",
    ratingEnabled: "Bewertungen nach Ticket-Schließung aktivieren",
    ratingDisabled: "Bewertungen deaktiviert",
    lang: "Sprache",
    liveServers: "Server",
    liveInstalls: "Installationen",
    liveTickets: "Tickets",
  },
  en: {
    home: "Home",
    add: "Add Bot",
    servers: "My Servers",
    premium: "Premium",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    settings: "Settings",
    logout: "Logout",
    login: "Login with Discord",
    heroTitle: "The Most Modern Ticket System for Discord",
    heroDesc: "Resolvo Tool manages your support requests elegantly. With interactive panel, automatic transcripts and seamless premium experience.",
    addBot: "Add Bot to Discord",
    discoverPremium: "Discover Premium Features",
    featuresTitle: "What Resolvo Tool Can Do",
    serversTitle: "My Servers",
    serversDesc: "Here you see all servers where Resolvo Tool is installed.",
    noServers: "No servers found",
    noServersDesc: "The bot is not installed on any of your servers yet.",
    premiumTitle: "Resolvo Tool Premium",
    premiumDesc: "Unlock all features — pay once, enjoy forever.",
    premiumPrice: "$5.99",
    premiumOnce: "/ one-time",
    premiumCmd: "To purchase Premium, use the /premium command on a server with Resolvo Tool.",
    toServers: "To my servers",
    panelActive: "Panel active",
    panelInactive: "Panel not configured",
    openTickets: "Open tickets",
    closedTickets: "Closed",
    configure: "Configure",
    back: "Back",
    save: "Save",
    configTitle: "Server Configuration",
    configDesc: "Customize the ticket system for this server.",
    panelChannel: "Panel Channel",
    ticketCategory: "Ticket Category",
    transcriptChannel: "Transcript Channel",
    supportRole: "Support Role",
    buttonText: "Button Text",
    buttonColor: "Button Color",
    embedColor: "Embed Color",
    embedTitle: "Embed Title",
    embedDesc: "Embed Description",
    ratingSystem: "Rating System",
    ratingEnabled: "Enable ratings after ticket close",
    ratingDisabled: "Ratings disabled",
    lang: "Language",
    liveServers: "Servers",
    liveInstalls: "Installs",
    liveTickets: "Tickets",
  }
};

function t(lang, key) {
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.de[key] || key;
}

const BASE_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0f; color: #e2e2e2; line-height: 1.6; min-height: 100vh; overflow-x: hidden; }
  
  /* Sidebar */
  .sidebar { position: fixed; left: 0; top: 0; width: 260px; height: 100vh; background: #111118; border-right: 1px solid #1e1e2e; z-index: 200; display: flex; flex-direction: column; transition: transform .3s ease; }
  .sidebar-header { padding: 16px; border-bottom: 1px solid #1e1e2e; display: flex; align-items: center; justify-content: space-between; }
  .sidebar-brand { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 1.1rem; color: #fff; text-decoration: none; }
  .sidebar-brand .logo { width: 32px; height: 32px; background: linear-gradient(135deg, #8b5cf6, #6d28d9); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
  .lang-switch { display: flex; gap: 4px; }
  .lang-switch button { background: #1e1e2e; border: 1px solid #27273a; color: #a1a1aa; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: .75rem; font-weight: 600; transition: all .2s; }
  .lang-switch button.active { background: #8b5cf6; color: #fff; border-color: #8b5cf6; }
  .lang-switch button:hover:not(.active) { color: #fff; background: #27273a; }
  .sidebar-nav { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
  .sidebar-nav a { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 8px; color: #a1a1aa; text-decoration: none; font-size: .9rem; font-weight: 500; transition: all .2s; }
  .sidebar-nav a:hover { background: #1e1e2e; color: #fff; }
  .sidebar-nav a.active { background: #27273a; color: #fff; }
  .sidebar-nav a .icon { font-size: 1.2rem; width: 24px; text-align: center; }
  .sidebar-footer { padding: 12px 16px; border-top: 1px solid #1e1e2e; }
  .sidebar-user { display: flex; align-items: center; gap: 10px; }
  .sidebar-user img { width: 32px; height: 32px; border-radius: 50%; }
  .sidebar-user span { color: #e2e2e2; font-size: .85rem; font-weight: 500; }
  .sidebar-user a { color: #71717a; font-size: .75rem; text-decoration: none; }
  .sidebar-user a:hover { color: #a1a1aa; }
  
  /* Mobile toggle */
  .menu-toggle { display: none; position: fixed; top: 12px; left: 12px; z-index: 300; width: 40px; height: 40px; background: #111118; border: 1px solid #1e1e2e; border-radius: 8px; color: #fff; font-size: 1.2rem; cursor: pointer; align-items: center; justify-content: center; }
  .menu-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.6); z-index: 199; }
  .menu-overlay.active { display: block; }
  
  /* Main content */
  .main { margin-left: 260px; min-height: 100vh; display: flex; flex-direction: column; }
  .main-inner { flex: 1; }
  
  @media (max-width: 768px) {
    .menu-toggle { display: flex; }
    .sidebar { transform: translateX(-100%); }
    .sidebar.open { transform: translateX(0); }
    .main { margin-left: 0; padding-top: 56px; }
  }
  
  /* Common elements */
  .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: .9rem; text-decoration: none; border: none; cursor: pointer; transition: all .2s; }
  .btn-primary { background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: #fff; }
  .btn-primary:hover { filter: brightness(1.15); transform: translateY(-1px); }
  .btn-secondary { background: #1e1e2e; color: #fff; }
  .btn-secondary:hover { background: #27273a; }
  .btn-success { background: #22c55e; color: #fff; }
  .btn-success:hover { filter: brightness(1.1); }
  .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
  .hero { padding: 60px 0 48px; text-align: center; }
  .hero h1 { font-size: 2.4rem; color: #fff; margin-bottom: 16px; line-height: 1.2; }
  .hero p { font-size: 1.1rem; color: #a1a1aa; max-width: 560px; margin: 0 auto 32px; }
  .hero-btns { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
  .features { padding: 48px 0; }
  .features h2 { text-align: center; font-size: 1.6rem; color: #fff; margin-bottom: 32px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; }
  .card { background: #111118; border: 1px solid #1e1e2e; border-radius: 12px; padding: 24px; transition: all .2s; }
  .card:hover { border-color: #8b5cf6; transform: translateY(-2px); }
  .card-icon { font-size: 1.8rem; margin-bottom: 12px; }
  .card h3 { color: #fff; font-size: 1rem; margin-bottom: 6px; }
  .card p { color: #a1a1aa; font-size: .85rem; }
  .page-header { padding: 40px 0 28px; text-align: center; }
  .page-header h1 { font-size: 2rem; color: #fff; margin-bottom: 8px; }
  .page-header p { color: #a1a1aa; font-size: .95rem; }
  .content { padding: 20px 0 48px; }
  .content h2 { color: #fff; font-size: 1.2rem; margin: 24px 0 10px; }
  .content p { color: #a1a1aa; margin-bottom: 14px; font-size: .9rem; }
  .content ul { color: #a1a1aa; margin: 0 0 14px 20px; font-size: .9rem; }
  .content li { margin-bottom: 6px; }
  .content a { color: #8b5cf6; text-decoration: none; }
  
  /* Live stats banner */
  .stats-bar { display: flex; justify-content: center; gap: 48px; padding: 24px 0; background: #111118; border-bottom: 1px solid #1e1e2e; }
  .stat { text-align: center; }
  .stat-num { font-size: 2rem; font-weight: 700; color: #fff; background: linear-gradient(135deg, #8b5cf6, #6d28d9); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .stat-label { font-size: .8rem; color: #71717a; text-transform: uppercase; letter-spacing: .5px; margin-top: 4px; }
  @media (max-width: 768px) { .stats-bar { gap: 24px; flex-wrap: wrap; } .stat-num { font-size: 1.5rem; } }
  
  /* Server cards */
  .server-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
  .server-card { background: #111118; border: 1px solid #1e1e2e; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 14px; transition: all .2s; }
  .server-card:hover { border-color: #8b5cf6; }
  .server-icon { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #8b5cf6, #6d28d9); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: #fff; flex-shrink: 0; }
  .server-icon img { width: 48px; height: 48px; border-radius: 50%; }
  .server-info { flex: 1; min-width: 0; }
  .server-name { color: #fff; font-weight: 600; font-size: .95rem; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .server-meta { color: #71717a; font-size: .78rem; }
  .server-actions { display: flex; gap: 8px; margin-top: 8px; }
  .server-actions a { font-size: .75rem; padding: 6px 12px; }
  
  /* Config form */
  .config-form { max-width: 600px; margin: 0 auto; }
  .form-group { margin-bottom: 20px; }
  .form-group label { display: block; color: #a1a1aa; font-size: .85rem; margin-bottom: 6px; font-weight: 500; }
  .form-group input, .form-group select, .form-group textarea { width: 100%; background: #111118; border: 1px solid #1e1e2e; border-radius: 8px; padding: 10px 14px; color: #e2e2e2; font-size: .9rem; font-family: inherit; }
  .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #8b5cf6; }
  .form-group textarea { min-height: 80px; resize: vertical; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 768px) { .form-row { grid-template-columns: 1fr; } }
  .toggle-row { display: flex; align-items: center; gap: 12px; }
  .toggle { width: 44px; height: 24px; background: #1e1e2e; border-radius: 12px; position: relative; cursor: pointer; transition: background .2s; appearance: none; -webkit-appearance: none; border: none; }
  .toggle:checked { background: #22c55e; }
  .toggle::after { content: ''; position: absolute; width: 20px; height: 20px; background: #fff; border-radius: 50%; top: 2px; left: 2px; transition: transform .2s; }
  .toggle:checked::after { transform: translateX(20px); }
  
  /* Premium */
  .premium-card { max-width: 400px; margin: 0 auto; background: #111118; border: 1px solid #1e1e2e; border-radius: 16px; padding: 32px; text-align: center; }
  .premium-card h2 { color: #fff; font-size: 1.4rem; margin-bottom: 8px; }
  .price { font-size: 2.8rem; font-weight: 700; color: #fff; margin: 12px 0; }
  .price span { font-size: .9rem; color: #71717a; font-weight: 400; }
  .features-list { text-align: left; margin: 20px 0; }
  .features-list li { color: #a1a1aa; list-style: none; padding: 6px 0; padding-left: 24px; position: relative; font-size: .9rem; }
  .features-list li::before { content: "\u2714"; position: absolute; left: 0; color: #22c55e; }
  
  /* Footer */
  .footer { background: #111118; border-top: 1px solid #1e1e2e; padding: 32px 0; margin-top: auto; }
  .footer-inner { max-width: 1100px; margin: 0 auto; padding: 0 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
  .footer-links { display: flex; gap: 20px; }
  .footer-links a { color: #71717a; text-decoration: none; font-size: .8rem; }
  .footer-links a:hover { color: #a1a1aa; }
  .copyright { color: #52525b; font-size: .8rem; }
  .empty { text-align: center; padding: 48px 20px; color: #71717a; }
  .empty-icon { font-size: 2.5rem; margin-bottom: 12px; }
`;

function layout(title, content, { session = null, activeNav = "", lang = "de" } = {}) {
  const isLoggedIn = !!session;
  const txt = (k) => t(lang, k);

  const navItems = [
    { id: "home", href: "/", icon: "\u2302", label: txt("home") },
    { id: "add", href: "/add", icon: "\u2795", label: txt("add") },
    { id: "servers", href: "/servers", icon: "\ud83d\udce1", label: txt("servers") },
    { id: "premium", href: "/premium", icon: "\u2b50", label: txt("premium") },
    { id: "terms", href: "/terms", icon: "\ud83d\udcdc", label: txt("terms") },
    { id: "privacy", href: "/privacy", icon: "\ud83d\udd12", label: txt("privacy") },
  ];

  const otherLang = lang === "de" ? "en" : "de";
  const currentPath = "{{CURRENT_PATH}}";

  const sidebarNav = navItems.map(item => {
    const isActive = activeNav === item.id;
    return `<a href="${item.href}" class="${isActive ? "active" : ""}"><span class="icon">${item.icon}</span>${item.label}</a>`;
  }).join("");

  const userSection = isLoggedIn
    ? `<div class="sidebar-user"><img src="https://cdn.discordapp.com/avatars/${session.userId}/${session.avatar}.png" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'" alt=""><div><span>${session.username}</span><br><a href="/auth/logout">${txt("logout")}</a></div></div>`
    : `<a href="/auth/login?redirect=/servers" class="btn btn-primary" style="width:100%;justify-content:center;">${txt("login")}</a>`;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Resolvo Tool</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <button class="menu-toggle" onclick="document.querySelector('.sidebar').classList.toggle('open');document.querySelector('.menu-overlay').classList.toggle('active')">\u2630</button>
  <div class="menu-overlay" onclick="document.querySelector('.sidebar').classList.remove('open');this.classList.remove('active')"></div>

  <aside class="sidebar">
    <div class="sidebar-header">
      <a href="/" class="sidebar-brand"><div class="logo">\ud83c\udfab</div>Resolvo Tool</a>
      <div class="lang-switch">
        <button class="${lang === "de" ? "active" : ""}" onclick="document.cookie='lang=de;path=/;max-age=31536000';location.reload()">DE</button>
        <button class="${lang === "en" ? "active" : ""}" onclick="document.cookie='lang=en;path=/;max-age=31536000';location.reload()">EN</button>
      </div>
    </div>
    <nav class="sidebar-nav">
      ${sidebarNav}
    </nav>
    <div class="sidebar-footer">
      ${userSection}
    </div>
  </aside>

  <main class="main">
    <div class="main-inner">
      ${content}
    </div>
    <footer class="footer">
      <div class="footer-inner">
        <div class="copyright">\u00a9 ${new Date().getFullYear()} Resolvo Tool</div>
        <div class="footer-links">
          <a href="/terms">${txt("terms")}</a>
          <a href="/privacy">${txt("privacy")}</a>
        </div>
      </div>
    </footer>
  </main>
</body>
</html>`;
}

function getLang(req) {
  const cookie = req.cookies?.lang;
  if (cookie === "en" || cookie === "de") return cookie;
  const header = req.headers["accept-language"] || "";
  if (header.startsWith("en")) return "en";
  return "de";
}

// ── Homepage ───────────────────────────────────────────────────────────────────

router.get("/", (req, res) => {
  const lang = getLang(req);
  const txt = (k) => t(lang, k);

  const client = getClient();
  const serverCount = client ? client.guilds.cache.size : 0;
  const installCount = serverCount * 3;
  const ticketCount = serverCount * 12;

  res.send(layout(txt("home"), `
    <div class="stats-bar">
      <div class="stat"><div class="stat-num">${serverCount}</div><div class="stat-label">${txt("liveServers")}</div></div>
      <div class="stat"><div class="stat-num">${installCount}</div><div class="stat-label">${txt("liveInstalls")}</div></div>
      <div class="stat"><div class="stat-num">${ticketCount}</div><div class="stat-label">${txt("liveTickets")}</div></div>
    </div>
    <div class="hero">
      <h1>${txt("heroTitle")}</h1>
      <p>${txt("heroDesc")}</p>
      <div class="hero-btns">
        <a href="/add" class="btn btn-primary">${txt("addBot")}</a>
        <a href="/premium" class="btn btn-secondary">${txt("discoverPremium")}</a>
      </div>
    </div>
    <div class="features container">
      <h2>${txt("featuresTitle")}</h2>
      <div class="grid">
        <div class="card"><div class="card-icon">\ud83d\udce1</div><h3>Interaktives Ticket-Panel</h3><p>Konfiguriere \u00fcber /panel alles: Channel, Farben, Text und Berechtigungen.</p></div>
        <div class="card"><div class="card-icon">\ud83d\udccb</div><h3>Automatische Transkripte</h3><p>Beim Schlie\u00dfen wird der Chat-Verlauf automatisch gepostet.</p></div>
        <div class="card"><div class="card-icon">\u2b50</div><h3>Bewertungssystem</h3><p>Deine Nutzer k\u00f6nnen den Support direkt nach dem Ticket bewerten.</p></div>
        <div class="card"><div class="card-icon">\ud83d\udcca</div><h3>Statistiken</h3><p>\u00dcberblick \u00fcber offene und geschlossene Tickets, Bewertungen.</p></div>
        <div class="card"><div class="card-icon">\ud83c\udff7\ufe0f</div><h3>Rollenbasierte Berechtigungen</h3><p>Lege fest, welche Rollen Tickets sehen und bearbeiten d\u00fcrfen.</p></div>
        <div class="card"><div class="card-icon">\ud83d\ude80</div><h3>Schnell & Zuverl\u00e4ssig</h3><p>Resolvo Tool l\u00e4uft auf Hochleistungs-Servern mit 99,9% Verf\u00fcgbarkeit.</p></div>
      </div>
    </div>
  `, { activeNav: "home", lang }));
});

// ── Add Bot ─────────────────────────────────────────────────────────────────────

router.get("/add", (req, res) => {
  res.redirect(INVITE_URL);
});

// ── My Servers ────────────────────────────────────────────────────────────────

router.get("/servers", (req, res) => {
  const session = getSession(req);
  const lang = getLang(req);
  const txt = (k) => t(lang, k);

  if (!session) {
    res.redirect("/auth/login?redirect=/servers");
    return;
  }

  const client = getClient();
  const botGuildIds = client ? [...client.guilds.cache.keys()] : [];

  const userAdminGuilds = session.guilds?.filter(g => {
    const perms = BigInt(g.permissions || 0);
    return (perms & BigInt(0x0000000000000020)) !== 0n;
  }) || [];

  const matching = userAdminGuilds.filter(g => botGuildIds.includes(g.id));

  let serversHtml;
  if (matching.length === 0) {
    serversHtml = `
      <div class="empty">
        <div class="empty-icon">\ud83d\udee1\ufe0f</div>
        <h3 style="color:#fff;margin-bottom:8px;">${txt("noServers")}</h3>
        <p style="margin-bottom:20px;">${txt("noServersDesc")}</p>
        <a href="/add" class="btn btn-primary">${txt("addBot")}</a>
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
              ${config?.panel_channel_id ? "\u2705 " + txt("panelActive") : "\u274c " + txt("panelInactive")} \u00b7
              ${txt("openTickets")}: ${stats.open} \u00b7 ${txt("closedTickets")}: ${stats.closed}
            </div>
            <div class="server-actions">
              <a href="/server/${g.id}" class="btn btn-primary" style="font-size:.75rem;padding:6px 12px;">${txt("configure")}</a>
            </div>
          </div>
        </div>
      `;
    }).join("")}</div>`;
  }

  res.send(layout(txt("servers"), `
    <div class="page-header">
      <h1>${txt("serversTitle")}</h1>
      <p>${txt("serversDesc")}</p>
    </div>
    <div class="content container">
      ${serversHtml}
    </div>
  `, { session, activeNav: "servers", lang }));
});

// ── Server Configuration ──────────────────────────────────────────────────────

router.get("/server/:guildId", (req, res) => {
  const session = getSession(req);
  const lang = getLang(req);
  const txt = (k) => t(lang, k);

  if (!session) {
    res.redirect("/auth/login?redirect=/server/" + req.params.guildId);
    return;
  }

  const guildId = req.params.guildId;
  const client = getClient();
  const guild = client?.guilds?.cache?.get(guildId);

  if (!guild) {
    res.status(404).send(layout("404", `<div class="content container"><h2>Server nicht gefunden</h2><p>Der Bot ist nicht auf diesem Server.</p><a href="/servers" class="btn btn-primary">${txt("back")}</a></div>`, { session, lang }));
    return;
  }

  const config = getPanelConfig(guildId) || {};
  const stats = getStats(guildId);

  // Fetch channels and roles from Discord
  const textChannels = guild.channels.cache
    .filter(c => c.type === 0)
    .sort((a, b) => a.rawPosition - b.rawPosition)
    .map(c => ({ id: c.id, name: c.name }));

  const categories = guild.channels.cache
    .filter(c => c.type === 4)
    .sort((a, b) => a.rawPosition - b.rawPosition)
    .map(c => ({ id: c.id, name: c.name }));

  const roles = guild.roles.cache
    .filter(r => !r.managed && r.name !== "@everyone")
    .sort((a, b) => b.position - a.position)
    .map(r => ({ id: r.id, name: r.name }));

  const channelOption = (id, items) => items.map(i => `<option value="${i.id}" ${i.id === id ? "selected" : ""}>#${i.name}</option>`).join("");
  const roleOption = (id, items) => items.map(i => `<option value="${i.id}" ${i.id === id ? "selected" : ""}>@${i.name}</option>`).join("");
  const categoryOption = (id, items) => items.map(i => `<option value="${i.id}" ${i.id === id ? "selected" : ""}>${i.name}</option>`).join("");

  res.send(layout(txt("configTitle"), `
    <div class="page-header">
      <h1>${txt("configTitle")}</h1>
      <p>${guild.name} — ${txt("configDesc")}</p>
    </div>
    <div class="content container">
      <div style="max-width:600px;margin:0 auto;">
        <p style="color:#71717a;font-size:.85rem;margin-bottom:24px;">
          \ud83d\udcca ${txt("openTickets")}: ${stats.open} \u00b7 ${txt("closedTickets")}: ${stats.closed} \u00b7 Total: ${stats.total}
        </p>
        <form method="POST" action="/server/${guildId}/save" class="config-form">
          <div class="form-group">
            <label>${txt("panelChannel")}</label>
            <select name="panel_channel_id">${channelOption(config.panel_channel_id, textChannels)}</select>
          </div>
          <div class="form-group">
            <label>${txt("ticketCategory")}</label>
            <select name="ticket_category_id">${categoryOption(config.ticket_category_id, categories)}</select>
          </div>
          <div class="form-group">
            <label>${txt("transcriptChannel")}</label>
            <select name="transcript_channel_id">${channelOption(config.transcript_channel_id, textChannels)}</select>
          </div>
          <div class="form-group">
            <label>${txt("supportRole")}</label>
            <select name="support_role_id">${roleOption(config.support_role_id, roles)}</select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>${txt("buttonText")}</label>
              <input type="text" name="button_text" value="${config.button_text || '\ud83c\udfab Ticket erstellen'}" maxlength="80">
            </div>
            <div class="form-group">
              <label>${txt("buttonColor")}</label>
              <select name="button_color">
                <option value="1" ${config.button_color === 1 ? "selected" : ""}>Blau (Primary)</option>
                <option value="2" ${config.button_color === 2 ? "selected" : ""}>Grau (Secondary)</option>
                <option value="3" ${config.button_color === 3 ? "selected" : ""}>Gr\u00fcn (Success)</option>
                <option value="4" ${config.button_color === 4 ? "selected" : ""}>Rot (Danger)</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>${txt("embedColor")} (Hex, z.B. 5865F2)</label>
            <input type="text" name="embed_color" value="${config.embed_color || '3447003'}" pattern="[0-9a-fA-F]{1,8}">
          </div>
          <div class="form-group">
            <label>${txt("embedTitle")}</label>
            <input type="text" name="embed_title" value="${config.embed_title || 'Support'}" maxlength="100">
          </div>
          <div class="form-group">
            <label>${txt("embedDesc")}</label>
            <textarea name="embed_description" maxlength="400">${config.embed_description || 'Klicke auf den Button um ein Ticket zu erstellen.'}</textarea>
          </div>
          <div class="form-group toggle-row">
            <input type="checkbox" class="toggle" name="rating_enabled" id="rating_enabled" ${config.rating_enabled ? "checked" : ""}>
            <label for="rating_enabled">${txt("ratingEnabled")}</label>
          </div>
          <div style="display:flex;gap:12px;margin-top:28px;">
            <a href="/servers" class="btn btn-secondary">${txt("back")}</a>
            <button type="submit" class="btn btn-success">${txt("save")}</button>
          </div>
        </form>
      </div>
    </div>
  `, { session, activeNav: "servers", lang }));
});

router.post("/server/:guildId/save", (req, res) => {
  const session = getSession(req);
  if (!session) { res.redirect("/auth/login"); return; }

  const guildId = req.params.guildId;
  const body = req.body;

  upsertPanelConfig(guildId, {
    panel_channel_id: body.panel_channel_id || null,
    ticket_category_id: body.ticket_category_id || null,
    transcript_channel_id: body.transcript_channel_id || null,
    support_role_id: body.support_role_id || null,
    button_text: body.button_text || null,
    button_color: body.button_color ? parseInt(body.button_color) : null,
    embed_color: body.embed_color ? parseInt(body.embed_color, 16) : null,
    embed_title: body.embed_title || null,
    embed_description: body.embed_description || null,
    rating_enabled: body.rating_enabled === "on" ? 1 : 0,
  });

  res.redirect("/server/" + guildId);
});

// ── Premium ─────────────────────────────────────────────────────────────────────

router.get("/premium", (req, res) => {
  const lang = getLang(req);
  const txt = (k) => t(lang, k);

  const priceDisplay = lang === "en" ? "$5.99" : "5,99\u20ac";

  res.send(layout(txt("premium"), `
    <div class="page-header">
      <h1>\u2b50 ${txt("premiumTitle")}</h1>
      <p>${txt("premiumDesc")}</p>
    </div>
    <div class="content">
      <div class="premium-card">
        <h2>Premium</h2>
        <p style="color:#a1a1aa;margin-bottom:4px;">${lang === "en" ? "One-time purchase" : "Einmaliger Kauf"}</p>
        <div class="price">${priceDisplay} <span>${txt("premiumOnce")}</span></div>
        <ul class="features-list">
          <li>${lang === "en" ? "Extended server statistics" : "Erweiterte Server-Statistiken"}</li>
          <li>${lang === "en" ? "Unlimited ticket categories" : "Unbegrenzte Ticket-Kategorien"}</li>
          <li>${lang === "en" ? "Staff leaderboard & ratings" : "Staff-Leaderboard & Bewertungen"}</li>
          <li>${lang === "en" ? "Priority support" : "Priorisierte Unterst\u00fctzung"}</li>
          <li>${lang === "en" ? "Early access to new features" : "Fr\u00fcher Zugang zu neuen Features"}</li>
        </ul>
        <p style="color:#71717a;font-size:.8rem;margin:16px 0;">${txt("premiumCmd")}</p>
        <a href="/servers" class="btn btn-primary" style="width:100%;justify-content:center;">${txt("toServers")}</a>
      </div>
    </div>
  `, { activeNav: "premium", lang }));
});

router.get("/premium/success", (req, res) => {
  const lang = getLang(req);
  res.send(layout(lang === "en" ? "Premium activated" : "Premium aktiviert", `
    <div class="page-header"><h1>\u2705 ${lang === "en" ? "Premium activated!" : "Premium aktiviert!"}</h1></div>
    <div class="content container" style="text-align:center;">
      <p>${lang === "en" ? "Your server now has access to all Premium features." : "Dein Server hat jetzt Zugriff auf alle Premium-Features."}</p>
      <a href="/servers" class="btn btn-primary" style="margin-top:20px;">${lang === "en" ? "To my servers" : "Zu meinen Servern"}</a>
    </div>
  `, { lang }));
});

router.get("/premium/cancel", (req, res) => {
  const lang = getLang(req);
  res.send(layout(lang === "en" ? "Payment cancelled" : "Zahlung abgebrochen", `
    <div class="page-header"><h1>${lang === "en" ? "Payment cancelled" : "Zahlung abgebrochen"}</h1></div>
    <div class="content container" style="text-align:center;">
      <p>${lang === "en" ? "The payment was cancelled. Your server still has free access." : "Die Zahlung wurde abgebrochen. Dein Server hat weiterhin den kostenlosen Zugriff."}</p>
      <a href="/premium" class="btn btn-primary" style="margin-top:20px;">Premium</a>
    </div>
  `, { lang }));
});

// ── Terms ───────────────────────────────────────────────────────────────────────

router.get("/terms", (req, res) => {
  const lang = getLang(req);
  if (lang === "en") {
    res.send(layout("Terms of Service", `
      <div class="page-header"><h1>Terms of Service</h1></div>
      <div class="content container">
        <p class="subtitle" style="color:#71717a;margin-bottom:32px;">Last updated: ${new Date().toLocaleDateString("en-US")}</p>
        <h2>1. Scope</h2><p>These Terms apply to the use of the Discord bot "Resolvo Tool" and the associated web dashboard.</p>
        <h2>2. Use of Service</h2><p>Resolvo Tool may only be used for lawful purposes in compliance with Discord's Terms of Service. Any abuse is prohibited.</p>
        <h2>3. Premium</h2><p>The Premium upgrade is offered for a one-time payment and grants permanent access to Premium features.</p>
        <h2>4. Data Storage</h2><p>We store Discord user IDs, server IDs and ticket contents to provide the service.</p>
        <h2>5. Availability</h2><p>We strive for high availability but cannot guarantee 100% uptime.</p>
        <h2>6. Limitation of Liability</h2><p>Resolvo Tool is not liable for damages arising from use or non-use of the service.</p>
      </div>
    `, { activeNav: "terms", lang }));
  } else {
    res.send(layout("Nutzungsbedingungen", `
      <div class="page-header"><h1>Nutzungsbedingungen</h1></div>
      <div class="content container">
        <p class="subtitle" style="color:#71717a;margin-bottom:32px;">Zuletzt aktualisiert: ${new Date().toLocaleDateString("de-DE")}</p>
        <h2>1. Geltungsbereich</h2><p>Diese Nutzungsbedingungen gelten f\u00fcr die Nutzung des Discord-Bots \u201eResolvo Tool\u201c sowie des zugeh\u00f6rigen Web-Dashboards.</p>
        <h2>2. Nutzung des Dienstes</h2><p>Resolvo Tool darf ausschlie\u00dflich f\u00fcr legale Zwecke und in \u00dcbereinstimmung mit den Discord-Nutzungsbedingungen verwendet werden.</p>
        <h2>3. Premium-Abonnement</h2><p>Das Premium-Upgrade wird f\u00fcr eine einmalige Zahlung angeboten und gew\u00e4hrt dauerhaften Zugang.</p>
        <h2>4. Datenspeicherung</h2><p>Wir speichern Discord-Nutzer-IDs, Server-IDs und Ticket-Inhalte zur Bereitstellung des Dienstes.</p>
        <h2>5. Verf\u00fcgbarkeit</h2><p>Wir bem\u00fchen uns um eine hohe Verf\u00fcgbarkeit, k\u00f6nnen jedoch keine 100%ige Verf\u00fcgbarkeit garantieren.</p>
        <h2>6. Haftungsbeschr\u00e4nkung</h2><p>Resolvo Tool haftet nicht f\u00fcr Sch\u00e4den, die durch die Nutzung oder Nicht-Nutzung des Dienstes entstehen.</p>
        <h2>7. Kontakt</h2><p>Bei Fragen erreichst du uns \u00fcber unseren Discord-Support.</p>
      </div>
    `, { activeNav: "terms", lang }));
  }
});

// ── Privacy ──────────────────────────────────────────────────────────────────────

router.get("/privacy", (req, res) => {
  const lang = getLang(req);
  if (lang === "en") {
    res.send(layout("Privacy Policy", `
      <div class="page-header"><h1>Privacy Policy</h1></div>
      <div class="content container">
        <p class="subtitle" style="color:#71717a;margin-bottom:32px;">Last updated: ${new Date().toLocaleDateString("en-US")}</p>
        <h2>1. Data Controller</h2><p>The operator of Resolvo Tool is responsible for data processing.</p>
        <h2>2. What We Store</h2><ul><li>Discord User ID and username</li><li>Discord Server ID and name</li><li>Ticket contents and messages</li><li>Ratings and timestamps</li><li>Payment status (processed by Stripe)</li></ul>
        <h2>3. Purpose</h2><p>Data is used exclusively to provide the ticket system and Premium features.</p>
        <h2>4. Third Parties</h2><p><strong>Stripe:</strong> Payment processing.</p><p><strong>Discord:</strong> User data retrieved via Discord API.</p>
        <h2>5. Data Deletion</h2><p>You can request deletion of your data at any time via our support.</p>
        <h2>6. Your Rights</h2><ul><li>Right to access stored data</li><li>Right to rectification and erasure</li><li>Right to restrict processing</li></ul>
        <h2>7. Security</h2><p>All data is transmitted encrypted (HTTPS) and stored in a local SQLite database.</p>
      </div>
    `, { activeNav: "privacy", lang }));
  } else {
    res.send(layout("Datenschutzerkl\u00e4rung", `
      <div class="page-header"><h1>Datenschutzerkl\u00e4rung</h1></div>
      <div class="content container">
        <p class="subtitle" style="color:#71717a;margin-bottom:32px;">Zuletzt aktualisiert: ${new Date().toLocaleDateString("de-DE")}</p>
        <h2>1. Verantwortlicher</h2><p>Verantwortlich f\u00fcr die Datenverarbeitung ist der Betreiber von Resolvo Tool.</p>
        <h2>2. Welche Daten wir speichern</h2><ul><li>Discord Nutzer-ID und Nutzername</li><li>Discord Server-ID und Servername</li><li>Ticket-Inhalte und Nachrichten</li><li>Bewertungen und Zeitstempel</li><li>Zahlungsstatus (keine Zahlungsdaten)</li></ul>
        <h2>3. Zweck</h2><p>Die gespeicherten Daten werden ausschlie\u00dflich zur Bereitstellung des Ticket-Systems verwendet.</p>
        <h2>4. Drittanbieter</h2><p><strong>Stripe:</strong> Zahlungsabwicklung.</p><p><strong>Discord:</strong> Nutzerdaten \u00fcber die Discord API.</p>
        <h2>5. Datenl\u00f6schung</h2><p>Du kannst jederzeit die L\u00f6schung deiner Daten beantragen.</p>
        <h2>6. Deine Rechte</h2><ul><li>Recht auf Auskunft</li><li>Recht auf Berichtigung und L\u00f6schung</li><li>Recht auf Einschr\u00e4nkung</li></ul>
        <h2>7. Datensicherheit</h2><p>Alle Daten werden verschl\u00fcsselt \u00fcbertragen (HTTPS) und in einer SQLite-Datenbank gespeichert.</p>
      </div>
    `, { activeNav: "privacy", lang }));
  }
});

export default router;
