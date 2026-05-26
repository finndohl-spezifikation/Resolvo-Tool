import { Router } from "express";
  import { getSession } from "./auth.js";
  import { getClient } from "../gateway.js";
  import { getPanelConfig, getStats, upsertPanelConfig } from "../db.js";

  const router = Router();

  const INVITE_URL = "https://discord.com/oauth2/authorize?client_id=1508500695110647839&permissions=8&integration_type=0&scope=applications.commands+bot";
  const LOGO_URL = "/logo.jpg";

  const TRANSLATIONS = {
    de: {
      home: "Startseite", add: "Hinzufuegen", servers: "Meine Server", premium: "Premium",
      terms: "Nutzungsbedingungen", privacy: "Datenschutz", logout: "Abmelden", login: "Mit Discord anmelden",
      heroTitle: "Das modernste Ticket-System fuer Discord",
      heroDesc: "Resolvo Tool verwaltet deine Support-Anfragen elegant. Mit interaktivem Panel, automatischen Transkripten und KI-gestuetzter Ticket-Klassifizierung.",
      addBot: "Bot zu Discord hinzufuegen", discoverPremium: "Premium entdecken",
      serversTitle: "Meine Server", serversDesc: "Server, auf denen Resolvo Tool installiert ist.",
      noServers: "Keine Server gefunden", noServersDesc: "Der Bot ist noch auf keinem deiner Server installiert.",
      premiumTitle: "Resolvo Tool Premium", premiumDesc: "Schalte alle Features frei.",
      premiumPrice: "5,99 EUR", premiumOnce: "/ einmalig",
      premiumCmd: "Nutze /premium in einem Server mit Resolvo Tool.", toServers: "Zu meinen Servern",
      panelActive: "Panel aktiv", panelInactive: "Panel nicht konfiguriert",
      openTickets: "Offene Tickets", closedTickets: "Geschlossen",
      configure: "Konfigurieren", back: "Zurueck", save: "Speichern",
      configTitle: "Server-Konfiguration", configDesc: "Passe das Ticket-System fuer diesen Server an.",
      panelChannel: "Panel-Channel", ticketCategory: "Ticket-Kategorie",
      transcriptChannel: "Transkript-Channel", supportRole: "Support-Rolle",
      buttonText: "Button-Text", buttonColor: "Button-Farbe",
      embedColor: "Embed-Farbe", embedTitle: "Embed-Titel", embedDesc: "Embed-Beschreibung",
      ratingSystem: "Bewertungssystem", ratingEnabled: "Bewertungen nach Ticket-Schlieszen aktivieren",
      aiSystem: "KI-Ticket-Klassifizierung", aiEnabled: "Automatische KI-Priorisierung aktivieren",
      aiExplain: "Die KI analysiert eingehende Tickets und setzt automatisch die Prioritaet (Niedrig / Mittel / Hoch / Kritisch) basierend auf dem Inhalt.",
      lang: "Sprache", liveServers: "aktive Server", liveInstalls: "Installationen",
    },
    en: {
      home: "Home", add: "Add Bot", servers: "My Servers", premium: "Premium",
      terms: "Terms", privacy: "Privacy", logout: "Logout", login: "Login with Discord",
      heroTitle: "The Most Modern Ticket System for Discord",
      heroDesc: "Resolvo Tool manages your support requests elegantly. With interactive panel, automatic transcripts and AI-powered ticket classification.",
      addBot: "Add Bot to Discord", discoverPremium: "Discover Premium",
      serversTitle: "My Servers", serversDesc: "Servers where Resolvo Tool is installed.",
      noServers: "No servers found", noServersDesc: "The bot is not installed on any of your servers yet.",
      premiumTitle: "Resolvo Tool Premium", premiumDesc: "Unlock all features.",
      premiumPrice: "$5.99", premiumOnce: "/ one-time",
      premiumCmd: "Use /premium on a server with Resolvo Tool.", toServers: "To my servers",
      panelActive: "Panel active", panelInactive: "Panel not configured",
      openTickets: "Open tickets", closedTickets: "Closed",
      configure: "Configure", back: "Back", save: "Save",
      configTitle: "Server Configuration", configDesc: "Customize the ticket system for this server.",
      panelChannel: "Panel Channel", ticketCategory: "Ticket Category",
      transcriptChannel: "Transcript Channel", supportRole: "Support Role",
      buttonText: "Button Text", buttonColor: "Button Color",
      embedColor: "Embed Color", embedTitle: "Embed Title", embedDesc: "Embed Description",
      ratingSystem: "Rating System", ratingEnabled: "Enable ratings after ticket close",
      aiSystem: "AI Ticket Classification", aiEnabled: "Enable automatic AI prioritization",
      aiExplain: "The AI analyzes incoming tickets and automatically sets priority (Low / Medium / High / Critical) based on content.",
      lang: "Language", liveServers: "active servers", liveInstalls: "installs",
    }
  };

  function t(lang, key) {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.de[key] || key;
  }

  const COLORS = {
    bg: "#070a14", surface: "#0d1526", surfaceHover: "#121e36",
    border: "#1a2a4a", borderHover: "#2a4a7a",
    cyan: "#00e5ff", blue: "#2979ff", text: "#e6f1ff",
    textDim: "#8aa2c9", textMuted: "#5a7a9a",
    accentGrad: "linear-gradient(135deg, #00e5ff, #2979ff)",
    cardBg: "rgba(13,21,38,0.8)",
  };

  const GLOBAL_STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: ${COLORS.bg}; color: ${COLORS.text}; line-height: 1.6;
      min-height: 100vh; overflow-x: hidden;
    }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: ${COLORS.bg}; }
    ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 3px; }

    .bg-particles {
      position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden;
    }
    .bg-particles::before {
      content: ''; position: absolute; top: -50%; left: -50%;
      width: 200%; height: 200%;
      background: radial-gradient(circle at 30% 20%, rgba(0,229,255,0.03) 0%, transparent 40%),
                  radial-gradient(circle at 70% 80%, rgba(41,121,255,0.03) 0%, transparent 40%);
      animation: particleDrift 20s ease-in-out infinite;
    }
    @keyframes particleDrift {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      33% { transform: translate(-2%, 1%) rotate(1deg); }
      66% { transform: translate(1%, -1%) rotate(-1deg); }
    }

    .sidebar {
      position: fixed; left: 0; top: 0; width: 280px; height: 100vh;
      background: ${COLORS.surface}; border-right: 1px solid ${COLORS.border};
      z-index: 200; display: flex; flex-direction: column;
      backdrop-filter: blur(20px); transition: transform .35s cubic-bezier(.4,0,.2,1);
    }
    .sidebar-header { padding: 20px 18px; border-bottom: 1px solid ${COLORS.border}; }
    .sidebar-brand { display: flex; align-items: center; gap: 12px; text-decoration: none; }
    .sidebar-brand img { width: 42px; height: 42px; border-radius: 10px; object-fit: cover;
      box-shadow: 0 0 20px rgba(0,229,255,0.2);
    }
    .sidebar-brand span { font-weight: 800; font-size: 1.15rem; color: ${COLORS.text}; letter-spacing: -0.5px; }
    .sidebar-brand small { display: block; font-size: .65rem; color: ${COLORS.cyan}; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-top: 2px; }
    .lang-switch { display: flex; gap: 6px; margin-top: 14px; }
    .lang-switch button { flex: 1; background: ${COLORS.bg}; border: 1px solid ${COLORS.border}; color: ${COLORS.textDim};
      padding: 7px 0; border-radius: 8px; cursor: pointer; font-size: .78rem; font-weight: 700;
      transition: all .25s; text-transform: uppercase; letter-spacing: .5px;
    }
    .lang-switch button.active { background: ${COLORS.accentGrad}; color: #fff; border-color: transparent;
      box-shadow: 0 4px 15px rgba(0,229,255,0.25);
    }
    .lang-switch button:hover:not(.active) { border-color: ${COLORS.blue}; color: ${COLORS.text}; }
    .sidebar-nav { flex: 1; padding: 12px 10px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
    .sidebar-nav a { display: flex; align-items: center; gap: 14px; padding: 11px 14px; border-radius: 10px;
      color: ${COLORS.textDim}; text-decoration: none; font-size: .88rem; font-weight: 500;
      transition: all .25s; position: relative;
    }
    .sidebar-nav a::before { content: ''; position: absolute; left: 0; top: 50%;
      transform: translateY(-50%) scaleY(0); width: 3px; height: 20px;
      background: ${COLORS.accentGrad}; border-radius: 0 4px 4px 0; transition: transform .3s;
    }
    .sidebar-nav a:hover { background: ${COLORS.surfaceHover}; color: ${COLORS.text}; }
    .sidebar-nav a:hover::before { transform: translateY(-50%) scaleY(1); }
    .sidebar-nav a.active { background: rgba(0,229,255,0.06); color: ${COLORS.cyan}; border: 1px solid rgba(0,229,255,0.15); }
    .sidebar-nav a.active::before { transform: translateY(-50%) scaleY(1); }
    .sidebar-nav a .icon { font-size: 1.15rem; width: 22px; text-align: center; opacity: .8; }
    .sidebar-footer { padding: 14px 16px; border-top: 1px solid ${COLORS.border}; }
    .sidebar-user { display: flex; align-items: center; gap: 10px; }
    .sidebar-user img { width: 36px; height: 36px; border-radius: 50%; border: 2px solid ${COLORS.border}; }
    .sidebar-user div { line-height: 1.3; }
    .sidebar-user span { font-size: .82rem; font-weight: 600; color: ${COLORS.text}; }
    .sidebar-user a { font-size: .72rem; color: ${COLORS.textMuted}; text-decoration: none; }
    .sidebar-user a:hover { color: ${COLORS.cyan}; }

    .menu-toggle { display: none; position: fixed; top: 14px; left: 14px; z-index: 300;
      width: 44px; height: 44px; background: ${COLORS.surface}; border: 1px solid ${COLORS.border};
      border-radius: 12px; color: ${COLORS.cyan}; font-size: 1.3rem; cursor: pointer;
      align-items: center; justify-content: center; backdrop-filter: blur(10px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .menu-overlay { display: none; position: fixed; inset: 0;
      background: rgba(7,10,20,.7); backdrop-filter: blur(4px); z-index: 199;
    }
    .menu-overlay.active { display: block; }

    @media (max-width: 768px) {
      .menu-toggle { display: flex; }
      .sidebar { transform: translateX(-100%); }
      .sidebar.open { transform: translateX(0); }
      .main { margin-left: 0 !important; padding-top: 64px; }
    }

    .main { margin-left: 280px; min-height: 100vh; display: flex; flex-direction: column; position: relative; z-index: 1; }

    .btn { display: inline-flex; align-items: center; gap: 10px; padding: 12px 26px;
      border-radius: 12px; font-weight: 600; font-size: .92rem;
      text-decoration: none; border: none; cursor: pointer;
      transition: all .3s cubic-bezier(.4,0,.2,1); position: relative; overflow: hidden;
    }
    .btn::after { content: ''; position: absolute; inset: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
      transform: translateX(-100%); transition: transform .5s;
    }
    .btn:hover::after { transform: translateX(100%); }
    .btn-primary { background: ${COLORS.accentGrad}; color: #fff;
      box-shadow: 0 4px 25px rgba(0,229,255,0.25);
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 35px rgba(0,229,255,0.4); }
    .btn-secondary { background: ${COLORS.surface}; color: ${COLORS.text}; border: 1px solid ${COLORS.border}; }
    .btn-secondary:hover { border-color: ${COLORS.blue}; background: ${COLORS.surfaceHover}; transform: translateY(-1px); }
    .btn-success { background: linear-gradient(135deg, #00c853, #00a843); color: #fff;
      box-shadow: 0 4px 20px rgba(0,200,83,0.25);
    }
    .btn-success:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,200,83,0.35); }

    .container { max-width: 1100px; margin: 0 auto; padding: 0 28px; }

    .hero { padding: 100px 0 48px; text-align: center; position: relative; overflow: hidden; }
    .hero::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
      width: 60%; height: 1px; background: linear-gradient(90deg, transparent, rgba(0,229,255,0.3), transparent);
    }
    .hero-logo { width: 110px; height: 110px; margin: 0 auto 28px; border-radius: 22px;
      object-fit: cover; box-shadow: 0 0 60px rgba(0,229,255,0.15), 0 0 120px rgba(41,121,255,0.08);
      animation: logoPulse 4s ease-in-out infinite;
    }
    @keyframes logoPulse {
      0%, 100% { box-shadow: 0 0 60px rgba(0,229,255,0.15), 0 0 120px rgba(41,121,255,0.08); transform: scale(1); }
      50% { box-shadow: 0 0 80px rgba(0,229,255,0.25), 0 0 160px rgba(41,121,255,0.12); transform: scale(1.02); }
    }
    .hero h1 { font-size: 3rem; font-weight: 800; color: #fff; margin-bottom: 18px;
      line-height: 1.15; letter-spacing: -1px; animation: fadeInUp .8s ease-out;
    }
    .hero h1 span { background: ${COLORS.accentGrad}; -webkit-background-clip: text;
      -webkit-text-fill-color: transparent; background-clip: text;
    }
    .hero p { font-size: 1.1rem; color: ${COLORS.textDim}; max-width: 540px;
      margin: 0 auto 36px; animation: fadeInUp .8s .15s ease-out both;
    }
    .hero-btns { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;
      animation: fadeInUp .8s .3s ease-out both;
    }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }

    .stats-bar { display: flex; justify-content: center; gap: 80px; padding: 48px 0 36px;
      background: ${COLORS.surface}; border-top: 1px solid ${COLORS.border};
      border-bottom: 1px solid ${COLORS.border}; position: relative;
    }
    .stats-bar::before { content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
      width: 40%; height: 1px; background: linear-gradient(90deg, transparent, ${COLORS.cyan}, transparent); opacity: .4;
    }
    .stat { text-align: center; animation: fadeInUp .6s ease-out both; }
    .stat:nth-child(2) { animation-delay: .15s; }
    .stat-num { font-size: 3rem; font-weight: 900; background: ${COLORS.accentGrad};
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
      line-height: 1; min-width: 80px;
    }
    .stat-label { font-size: .75rem; color: ${COLORS.textMuted}; text-transform: uppercase;
      letter-spacing: 1.5px; margin-top: 10px; font-weight: 600;
    }
    .stat-desc { font-size: .8rem; color: ${COLORS.textDim}; margin-top: 4px; }
    @media (max-width: 768px) { .stats-bar { gap: 32px; flex-wrap: wrap; padding: 36px 20px; } .stat-num { font-size: 2.2rem; } }

    .page-header { padding: 56px 0 36px; text-align: center; position: relative; }
    .page-header::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
      width: 50%; height: 1px; background: linear-gradient(90deg, transparent, rgba(0,229,255,0.2), transparent);
    }
    .page-header h1 { font-size: 2.2rem; font-weight: 800; color: #fff; margin-bottom: 10px; letter-spacing: -0.5px; }
    .page-header p { color: ${COLORS.textDim}; font-size: .95rem; }
    .content { padding: 24px 0 56px; }
    .content h2 { color: #fff; font-size: 1.15rem; font-weight: 700; margin: 28px 0 10px; }
    .content p { color: ${COLORS.textDim}; margin-bottom: 14px; font-size: .88rem; }
    .content ul { color: ${COLORS.textDim}; margin: 0 0 14px 20px; font-size: .88rem; }
    .content li { margin-bottom: 6px; }
    .content a { color: ${COLORS.cyan}; text-decoration: none; }
    .content a:hover { text-decoration: underline; }

    .server-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px; }
    .server-card { background: ${COLORS.cardBg}; border: 1px solid ${COLORS.border}; border-radius: 16px;
      padding: 20px; display: flex; align-items: center; gap: 16px; transition: all .35s;
    }
    .server-card:hover { border-color: ${COLORS.blue}; transform: translateY(-3px);
      box-shadow: 0 12px 35px rgba(0,0,0,0.2);
    }
    .server-icon { width: 52px; height: 52px; border-radius: 14px; background: ${COLORS.accentGrad};
      display: flex; align-items: center; justify-content: center;
      font-size: 1.3rem; color: #fff; font-weight: 700; flex-shrink: 0;
      box-shadow: 0 4px 15px rgba(41,121,255,0.3);
    }
    .server-icon img { width: 52px; height: 52px; border-radius: 14px; object-fit: cover; }
    .server-info { flex: 1; min-width: 0; }
    .server-name { color: #fff; font-weight: 700; font-size: .95rem; margin-bottom: 4px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .server-meta { color: ${COLORS.textMuted}; font-size: .78rem; line-height: 1.5; }
    .server-actions { display: flex; gap: 8px; margin-top: 10px; }
    .server-actions a { font-size: .75rem; padding: 7px 14px; }

    .premium-card { max-width: 420px; margin: 0 auto; background: ${COLORS.cardBg};
      border: 1px solid ${COLORS.border}; border-radius: 20px; padding: 40px 36px;
      text-align: center; position: relative; overflow: hidden;
    }
    .premium-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: ${COLORS.accentGrad}; }
    .premium-card h2 { color: #fff; font-size: 1.5rem; font-weight: 800; margin-bottom: 8px; }
    .price { font-size: 3.2rem; font-weight: 900; color: #fff; margin: 12px 0; letter-spacing: -1px; }
    .price span { font-size: .95rem; color: ${COLORS.textMuted}; font-weight: 400; }
    .features-list { text-align: left; margin: 24px 0; }
    .features-list li { color: ${COLORS.textDim}; list-style: none; padding: 8px 0;
      padding-left: 28px; position: relative; font-size: .88rem;
    }
    .features-list li::before { content: ""; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
      width: 18px; height: 18px; background: ${COLORS.accentGrad}; border-radius: 50%; opacity: .6;
    }

    .footer { background: ${COLORS.surface}; border-top: 1px solid ${COLORS.border}; padding: 36px 0; margin-top: auto; }
    .footer-inner { max-width: 1100px; margin: 0 auto; padding: 0 28px;
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;
    }
    .footer-logo { display: flex; align-items: center; gap: 10px; }
    .footer-logo img { width: 28px; height: 28px; border-radius: 6px; }
    .footer-logo span { font-weight: 700; font-size: .9rem; color: ${COLORS.text}; }
    .footer-links { display: flex; gap: 24px; }
    .footer-links a { color: ${COLORS.textMuted}; text-decoration: none; font-size: .8rem; transition: color .2s; }
    .footer-links a:hover { color: ${COLORS.cyan}; }
    .copyright { color: ${COLORS.textMuted}; font-size: .78rem; }

    .empty { text-align: center; padding: 56px 20px; }
    .empty img { width: 80px; height: 80px; border-radius: 18px; margin-bottom: 20px; opacity: .5; filter: grayscale(.3); }
    .empty h3 { color: #fff; font-weight: 700; margin-bottom: 8px; }
    .empty p { color: ${COLORS.textMuted}; margin-bottom: 24px; font-size: .9rem; }

    .config-form { max-width: 580px; margin: 0 auto; }
    .form-group { margin-bottom: 22px; }
    .form-group label { display: block; color: ${COLORS.textDim}; font-size: .82rem;
      margin-bottom: 7px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px;
    }
    .form-group input, .form-group select, .form-group textarea {
      width: 100%; background: ${COLORS.bg}; border: 1px solid ${COLORS.border};
      border-radius: 10px; padding: 11px 16px; color: ${COLORS.text}; font-size: .9rem;
      font-family: inherit; transition: all .25s;
    }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
      outline: none; border-color: ${COLORS.blue}; box-shadow: 0 0 0 3px rgba(41,121,255,0.1);
    }
    .form-group textarea { min-height: 80px; resize: vertical; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    @media (max-width: 768px) { .form-row { grid-template-columns: 1fr; } }

    .toggle-row { display: flex; align-items: center; gap: 14px; margin-bottom: 8px; }
    .toggle-row label { margin-bottom: 0 !important; text-transform: none !important; letter-spacing: 0 !important; }
    .toggle-switch { appearance: none; -webkit-appearance: none; width: 48px; height: 26px;
      background: ${COLORS.border}; border-radius: 13px; position: relative; cursor: pointer;
      transition: background .3s; border: none; outline: none;
    }
    .toggle-switch::after { content: ''; position: absolute; width: 22px; height: 22px;
      background: ${COLORS.text}; border-radius: 50%; top: 2px; left: 2px;
      transition: transform .3s, background .3s; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    .toggle-switch:checked { background: linear-gradient(135deg, #00c853, #00a843); }
    .toggle-switch:checked::after { transform: translateX(22px); background: #fff; }

    .badge { display: inline-block; padding: 3px 10px; border-radius: 6px;
      font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .5px;
    }
    .badge-green { background: rgba(0,200,83,0.1); color: #00c853; border: 1px solid rgba(0,200,83,0.2); }
    .badge-red { background: rgba(255,82,82,0.1); color: #ff5252; border: 1px solid rgba(255,82,82,0.2); }
  `;

  function layout(title, content, { session = null, activeNav = "", lang = "de" } = {}) {
    const isLoggedIn = !!session;
    const txt = (k) => t(lang, k);

    const navItems = [
      { id: "home", href: "/", label: txt("home") },
      { id: "add", href: "/add", label: txt("add") },
      { id: "servers", href: "/servers", label: txt("servers") },
      { id: "premium", href: "/premium", label: txt("premium") },
      { id: "terms", href: "/terms", label: txt("terms") },
      { id: "privacy", href: "/privacy", label: txt("privacy") },
    ];

    const sidebarNav = navItems.map(item => {
      const isActive = activeNav === item.id;
      return `<a href="${item.href}" class="${isActive ? "active" : ""}">${item.label}</a>`;
    }).join("");

    const userSection = isLoggedIn
      ? `<div class="sidebar-user"><img src="https://cdn.discordapp.com/avatars/${session.userId}/${session.avatar}.png" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'" alt=""><div><span>${session.username}</span><br><a href="/auth/logout">${txt("logout")}</a></div></div>`
      : `<a href="/auth/login?redirect=/servers" class="btn btn-primary" style="width:100%;justify-content:center;font-size:.85rem;padding:10px;">${txt("login")}</a>`;

    return `<!DOCTYPE html>
  <html lang="${lang}">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Resolvo Tool</title>
    <style>${GLOBAL_STYLES}</style>
  </head>
  <body>
    <div class="bg-particles"></div>
    <button class="menu-toggle" onclick="document.querySelector('.sidebar').classList.toggle('open');document.querySelector('.menu-overlay').classList.toggle('active')">&#9776;</button>
    <div class="menu-overlay" onclick="document.querySelector('.sidebar').classList.remove('open');this.classList.remove('active')"></div>
    <aside class="sidebar">
      <div class="sidebar-header">
        <a href="/" class="sidebar-brand">
          <img src="${LOGO_URL}" alt="Resolvo Tool">
          <div><span>Resolvo Tool</span><small>Discord Ticket System</small></div>
        </a>
        <div class="lang-switch">
          <button class="${lang === "de" ? "active" : ""}" onclick="document.cookie='lang=de;path=/;max-age=31536000';location.reload()">DE</button>
          <button class="${lang === "en" ? "active" : ""}" onclick="document.cookie='lang=en;path=/;max-age=31536000';location.reload()">EN</button>
        </div>
      </div>
      <nav class="sidebar-nav">${sidebarNav}</nav>
      <div class="sidebar-footer">${userSection}</div>
    </aside>
    <main class="main">
      <div class="main-inner">${content}</div>
      <footer class="footer">
        <div class="footer-inner">
          <div class="footer-logo"><img src="${LOGO_URL}" alt=""><span>Resolvo Tool</span></div>
          <div class="footer-links"><a href="/terms">${txt("terms")}</a><a href="/privacy">${txt("privacy")}</a></div>
          <div class="copyright">&copy; ${new Date().getFullYear()} Resolvo Tool</div>
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

  function getBotStats() {
    const client = getClient();
    const servers = client ? client.guilds.cache.size : 0;
    const installs = servers * 3; // approximate install count
    return { servers, installs };
  }

  // --- Homepage ---

  router.get("/", (req, res) => {
    const lang = getLang(req);
    const txt = (k) => t(lang, k);
    const stats = getBotStats();

    res.send(layout(txt("home"), `
      <div class="hero">
        <img src="${LOGO_URL}" alt="Resolvo Tool" class="hero-logo">
        <h1>${txt("heroTitle")}</h1>
        <p>${txt("heroDesc")}</p>
        <div class="hero-btns">
          <a href="/add" class="btn btn-primary">${txt("addBot")}</a>
          <a href="/premium" class="btn btn-secondary">${txt("discoverPremium")}</a>
        </div>
      </div>
      <div class="stats-bar">
        <div class="stat">
          <div class="stat-num" data-target="${stats.servers}">0</div>
          <div class="stat-label">${txt("liveServers")}</div>
        </div>
        <div class="stat">
          <div class="stat-num" data-target="${stats.installs}">0</div>
          <div class="stat-label">${txt("liveInstalls")}</div>
        </div>
      </div>
      <script>
        (function() {
          const counters = document.querySelectorAll('.stat-num');
          counters.forEach(el => {
            const target = parseInt(el.dataset.target) || 0;
            const duration = 2000;
            const start = performance.now();
            function tick(now) {
              const elapsed = now - start;
              const progress = Math.min(elapsed / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              el.textContent = Math.floor(eased * target).toLocaleString();
              if (progress < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
          });
        })();
      </script>
    `, { activeNav: "home", lang }));
  });

  // --- Add Bot ---

  router.get("/add", (req, res) => {
    res.redirect(INVITE_URL);
  });

  // --- My Servers ---

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
          <img src="${LOGO_URL}" alt="">
          <h3>${txt("noServers")}</h3>
          <p>${txt("noServersDesc")}</p>
          <a href="/add" class="btn btn-primary">${txt("addBot")}</a>
        </div>
      `;
    } else {
      serversHtml = `<div class="server-grid">${matching.map(g => {
        const icon = g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null;
        const config = getPanelConfig(g.id);
        const stats = getStats(g.id);
        const statusBadge = config?.panel_channel_id
          ? `<span class="badge badge-green">${txt("panelActive")}</span>`
          : `<span class="badge badge-red">${txt("panelInactive")}</span>`;
        return `
          <div class="server-card">
            <div class="server-icon">${icon ? `<img src="${icon}" alt="">` : g.name.charAt(0)}</div>
            <div class="server-info">
              <div class="server-name">${g.name}</div>
              <div class="server-meta">${statusBadge} &middot; ${txt("openTickets")}: ${stats.open} &middot; ${txt("closedTickets")}: ${stats.closed}</div>
              <div class="server-actions"><a href="/server/${g.id}" class="btn btn-primary">${txt("configure")}</a></div>
            </div>
          </div>
        `;
      }).join("")}</div>`;
    }

    res.send(layout(txt("servers"), `
      <div class="page-header"><h1>${txt("serversTitle")}</h1><p>${txt("serversDesc")}</p></div>
      <div class="content container">${serversHtml}</div>
    `, { session, activeNav: "servers", lang }));
  });

  // --- Server Configuration ---

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
      res.status(404).send(layout("404", `
        <div class="content container" style="text-align:center;padding-top:80px;">
          <img src="${LOGO_URL}" style="width:64px;height:64px;border-radius:14px;opacity:.4;margin-bottom:20px;">
          <h2 style="color:#fff;margin-bottom:10px;">Server nicht gefunden</h2>
          <p style="color:${COLORS.textMuted};margin-bottom:24px;">Der Bot ist nicht auf diesem Server.</p>
          <a href="/servers" class="btn btn-primary">${txt("back")}</a>
        </div>
      `, { session, lang }));
      return;
    }

    const config = getPanelConfig(guildId) || {};
    const stats = getStats(guildId);

    const textChannels = guild.channels.cache.filter(c => c.type === 0).sort((a, b) => a.rawPosition - b.rawPosition).map(c => ({ id: c.id, name: c.name }));
    const categories = guild.channels.cache.filter(c => c.type === 4).sort((a, b) => a.rawPosition - b.rawPosition).map(c => ({ id: c.id, name: c.name }));
    const roles = guild.roles.cache.filter(r => !r.managed && r.name !== "@everyone").sort((a, b) => b.position - a.position).map(r => ({ id: r.id, name: r.name }));

    const sel = (val, items, placeholder) => `<option value="">${placeholder}</option>` + items.map(i => `<option value="${i.id}" ${i.id === val ? "selected" : ""}>${i.name}</option>`).join("");
    const icon = guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null;

    res.send(layout(txt("configTitle"), `
      <div class="page-header">
        <div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:12px;">
          <div style="width:56px;height:56px;border-radius:14px;background:${COLORS.accentGrad};display:flex;align-items:center;justify-content:center;font-size:1.4rem;color:#fff;font-weight:700;">
            ${icon ? `<img src="${icon}" style="width:56px;height:56px;border-radius:14px;object-fit:cover;">` : guild.name.charAt(0)}
          </div>
          <div style="text-align:left;">
            <h1 style="font-size:1.6rem;margin-bottom:2px;">${guild.name}</h1>
            <p style="font-size:.82rem;margin:0;">${txt("configDesc")}</p>
          </div>
        </div>
        <p style="color:${COLORS.textMuted};font-size:.82rem;margin-top:8px;">
          ${txt("openTickets")}: ${stats.open} &middot; ${txt("closedTickets")}: ${stats.closed} &middot; Total: ${stats.total} &middot; Avg: ${stats.avgRating || "N/A"}
        </p>
      </div>
      <div class="content container">
        <form method="POST" action="/server/${guildId}/save" class="config-form">
          <div class="form-group"><label>${txt("panelChannel")}</label><select name="panel_channel_id">${sel(config.panel_channel_id, textChannels, "-- waehlen --")}</select></div>
          <div class="form-group"><label>${txt("ticketCategory")}</label><select name="ticket_category_id">${sel(config.ticket_category_id, categories, "-- waehlen --")}</select></div>
          <div class="form-group"><label>${txt("transcriptChannel")}</label><select name="transcript_channel_id">${sel(config.transcript_channel_id, textChannels, "-- waehlen --")}</select></div>
          <div class="form-group"><label>${txt("supportRole")}</label><select name="support_role_id">${sel(config.support_role_id, roles, "-- waehlen --")}</select></div>
          <div class="form-row">
            <div class="form-group"><label>${txt("buttonText")}</label><input type="text" name="button_text" value="${config.button_text || 'Ticket erstellen'}" maxlength="80"></div>
            <div class="form-group"><label>${txt("buttonColor")}</label>
              <select name="button_color">
                <option value="1" ${config.button_color === 1 ? "selected" : ""}>Blau (Primary)</option>
                <option value="2" ${config.button_color === 2 ? "selected" : ""}>Grau (Secondary)</option>
                <option value="3" ${config.button_color === 3 ? "selected" : ""}>Gruen (Success)</option>
                <option value="4" ${config.button_color === 4 ? "selected" : ""}>Rot (Danger)</option>
              </select>
            </div>
          </div>
          <div class="form-group"><label>${txt("embedColor")} (Hex, z.B. 5865F2)</label><input type="text" name="embed_color" value="${config.embed_color || '3447003'}" pattern="[0-9a-fA-F]{1,8}"></div>
          <div class="form-group"><label>${txt("embedTitle")}</label><input type="text" name="embed_title" value="${config.embed_title || 'Support'}" maxlength="100"></div>
          <div class="form-group"><label>${txt("embedDesc")}</label><textarea name="embed_description" maxlength="400">${config.embed_description || 'Klicke auf den Button um ein Ticket zu erstellen.'}</textarea></div>
          <div style="border:1px solid ${COLORS.border};border-radius:12px;padding:20px;margin-bottom:24px;">
            <h3 style="color:#fff;font-size:1rem;margin-bottom:8px;">${txt("aiSystem")}</h3>
            <p style="font-size:.82rem;color:${COLORS.textMuted};margin-bottom:16px;">${txt("aiExplain")}</p>
            <div class="form-group toggle-row">
              <input type="checkbox" class="toggle-switch" name="ai_enabled" id="ai_enabled" ${config.ai_enabled ? "checked" : ""}>
              <label for="ai_enabled">${txt("aiEnabled")}</label>
            </div>
          </div>
          <div class="form-group toggle-row">
            <input type="checkbox" class="toggle-switch" name="rating_enabled" id="rating_enabled" ${config.rating_enabled ? "checked" : ""}>
            <label for="rating_enabled">${txt("ratingEnabled")}</label>
          </div>
          <div style="display:flex;gap:14px;margin-top:32px;">
            <a href="/servers" class="btn btn-secondary">${txt("back")}</a>
            <button type="submit" class="btn btn-success">${txt("save")}</button>
          </div>
        </form>
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
      ai_enabled: body.ai_enabled === "on" ? 1 : 0,
    });

    res.redirect("/server/" + guildId);
  });

  // --- Premium ---

  router.get("/premium", (req, res) => {
    const lang = getLang(req);
    const txt = (k) => t(lang, k);
    const price = lang === "en" ? "$5.99" : "5,99 EUR";

    res.send(layout(txt("premium"), `
      <div class="page-header"><h1>${txt("premiumTitle")}</h1><p>${txt("premiumDesc")}</p></div>
      <div class="content">
        <div class="premium-card">
          <img src="${LOGO_URL}" alt="" style="width:56px;height:56px;border-radius:14px;margin:0 auto 16px;opacity:.8;">
          <h2>Premium</h2>
          <p style="color:${COLORS.textMuted};margin-bottom:4px;font-size:.85rem;">${lang === "en" ? "One-time purchase" : "Einmaliger Kauf"}</p>
          <div class="price">${price} <span>${txt("premiumOnce")}</span></div>
          <ul class="features-list">
            <li>${lang === "en" ? "Extended server statistics" : "Erweiterte Server-Statistiken"}</li>
            <li>${lang === "en" ? "Unlimited ticket categories" : "Unbegrenzte Ticket-Kategorien"}</li>
            <li>${lang === "en" ? "AI-powered ticket classification" : "KI-Ticket-Klassifizierung"}</li>
            <li>${lang === "en" ? "Staff leaderboard & ratings" : "Staff-Leaderboard & Bewertungen"}</li>
            <li>${lang === "en" ? "Priority support" : "Priorisierte Unterstuetzung"}</li>
            <li>${lang === "en" ? "Early access to new features" : "Frueher Zugang zu neuen Features"}</li>
          </ul>
          <p style="color:${COLORS.textMuted};font-size:.8rem;margin:18px 0;">${txt("premiumCmd")}</p>
          <a href="/servers" class="btn btn-primary" style="width:100%;justify-content:center;">${txt("toServers")}</a>
        </div>
      </div>
    `, { activeNav: "premium", lang }));
  });

  router.get("/premium/success", (req, res) => {
    const lang = getLang(req);
    res.send(layout(lang === "en" ? "Premium activated" : "Premium aktiviert", `
      <div class="page-header"><h1>${lang === "en" ? "Premium activated!" : "Premium aktiviert!"}</h1></div>
      <div class="content container" style="text-align:center;">
        <p style="color:${COLORS.textDim};">${lang === "en" ? "Your server now has access to all Premium features." : "Dein Server hat jetzt Zugriff auf alle Premium-Features."}</p>
        <a href="/servers" class="btn btn-primary" style="margin-top:24px;">${lang === "en" ? "To my servers" : "Zu meinen Servern"}</a>
      </div>
    `, { lang }));
  });

  router.get("/premium/cancel", (req, res) => {
    const lang = getLang(req);
    res.send(layout(lang === "en" ? "Payment cancelled" : "Zahlung abgebrochen", `
      <div class="page-header"><h1>${lang === "en" ? "Payment cancelled" : "Zahlung abgebrochen"}</h1></div>
      <div class="content container" style="text-align:center;">
        <p style="color:${COLORS.textDim};">${lang === "en" ? "The payment was cancelled. Your server still has free access." : "Die Zahlung wurde abgebrochen. Dein Server hat weiterhin den kostenlosen Zugriff."}</p>
        <a href="/premium" class="btn btn-primary" style="margin-top:24px;">Premium</a>
      </div>
    `, { lang }));
  });

  // --- Terms ---

  router.get("/terms", (req, res) => {
    const lang = getLang(req);
    if (lang === "en") {
      res.send(layout("Terms of Service", `
        <div class="page-header"><h1>Terms of Service</h1></div>
        <div class="content container">
          <p class="subtitle" style="color:${COLORS.textMuted};margin-bottom:32px;font-size:.85rem;">Last updated: ${new Date().toLocaleDateString("en-US")}</p>
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
          <p class="subtitle" style="color:${COLORS.textMuted};margin-bottom:32px;font-size:.85rem;">Zuletzt aktualisiert: ${new Date().toLocaleDateString("de-DE")}</p>
          <h2>1. Geltungsbereich</h2><p>Diese Nutzungsbedingungen gelten fuer die Nutzung des Discord-Bots "Resolvo Tool" sowie des zugehoerigen Web-Dashboards.</p>
          <h2>2. Nutzung des Dienstes</h2><p>Resolvo Tool darf ausschliesslich fuer legale Zwecke und in Uebereinstimmung mit den Discord-Nutzungsbedingungen verwendet werden.</p>
          <h2>3. Premium-Abonnement</h2><p>Das Premium-Upgrade wird fuer eine einmalige Zahlung angeboten und gewaehrt dauerhaften Zugang.</p>
          <h2>4. Datenspeicherung</h2><p>Wir speichern Discord-Nutzer-IDs, Server-IDs und Ticket-Inhalte zur Bereitstellung des Dienstes.</p>
          <h2>5. Verfuegbarkeit</h2><p>Wir bemuehen uns um eine hohe Verfuegbarkeit, koennen jedoch keine 100%ige Verfuegbarkeit garantieren.</p>
          <h2>6. Haftungsbeschraenkung</h2><p>Resolvo Tool haftet nicht fuer Schaeden, die durch die Nutzung oder Nicht-Nutzung des Dienstes entstehen.</p>
          <h2>7. Kontakt</h2><p>Bei Fragen erreichst du uns ueber unseren Discord-Support.</p>
        </div>
      `, { activeNav: "terms", lang }));
    }
  });

  // --- Privacy ---

  router.get("/privacy", (req, res) => {
    const lang = getLang(req);
    if (lang === "en") {
      res.send(layout("Privacy Policy", `
        <div class="page-header"><h1>Privacy Policy</h1></div>
        <div class="content container">
          <p class="subtitle" style="color:${COLORS.textMuted};margin-bottom:32px;font-size:.85rem;">Last updated: ${new Date().toLocaleDateString("en-US")}</p>
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
      res.send(layout("Datenschutzerklaerung", `
        <div class="page-header"><h1>Datenschutzerklaerung</h1></div>
        <div class="content container">
          <p class="subtitle" style="color:${COLORS.textMuted};margin-bottom:32px;font-size:.85rem;">Zuletzt aktualisiert: ${new Date().toLocaleDateString("de-DE")}</p>
          <h2>1. Verantwortlicher</h2><p>Verantwortlich fuer die Datenverarbeitung ist der Betreiber von Resolvo Tool.</p>
          <h2>2. Welche Daten wir speichern</h2><ul><li>Discord Nutzer-ID und Nutzername</li><li>Discord Server-ID und Servername</li><li>Ticket-Inhalte und Nachrichten</li><li>Bewertungen und Zeitstempel</li><li>Zahlungsstatus (keine Zahlungsdaten)</li></ul>
          <h2>3. Zweck</h2><p>Die gespeicherten Daten werden ausschliesslich zur Bereitstellung des Ticket-Systems verwendet.</p>
          <h2>4. Drittanbieter</h2><p><strong>Stripe:</strong> Zahlungsabwicklung.</p><p><strong>Discord:</strong> Nutzerdaten ueber die Discord API.</p>
          <h2>5. Datenloeschung</h2><p>Du kannst jederzeit die Loeschung deiner Daten beantragen.</p>
          <h2>6. Deine Rechte</h2><ul><li>Recht auf Auskunft</li><li>Recht auf Berichtigung und Loeschung</li><li>Recht auf Einschraenkung</li></ul>
          <h2>7. Datensicherheit</h2><p>Alle Daten werden verschluesselt uebertragen (HTTPS) und in einer SQLite-Datenbank gespeichert.</p>
        </div>
      `, { activeNav: "privacy", lang }));
    }
  });

  export default router;
  