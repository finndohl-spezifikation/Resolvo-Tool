import { Router } from "express";
  import { getSession } from "./auth.js";
  import { getClient } from "../gateway.js";
  import { getPanelConfig, getStats, upsertPanelConfig, getGuild, getGlobalTicketCount, getPanels, createPanel, updatePanel, deletePanel } from "../db.js";

  const router = Router();

  function getInviteUrl() {
      const clientId = process.env.DISCORD_CLIENT_ID || "1508500695110647839";
      return `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&integration_type=0&scope=applications.commands+bot`;
    }
    const INVITE_URL = getInviteUrl();
  const LOGO_URL = "/logo.jpg";

  const TRANSLATIONS = {
    de: {
      home: "Startseite", add: "Hinzufügen", servers: "Meine Server", premium: "Premium",
      terms: "Nutzungsbedingungen", privacy: "Datenschutz", logout: "Abmelden", login: "Mit Discord anmelden",
      heroTitle: "Das modernste Ticket-System für Discord",
      heroDesc: "Resolvo Tool verwaltet deine Support-Anfragen elegant. Mit interaktivem Panel, automatischen Transkripten, KI-gestützter Ticket-Klassifizierung und intelligentem FAQ-System.",
      addBot: "Bot zu Discord hinzufügen", discoverPremium: "Premium entdecken",
      serversTitle: "Meine Server", serversDesc: "Server, auf denen Resolvo Tool installiert ist.",
      noServers: "Keine Server gefunden", noServersDesc: "Der Bot ist noch auf keinem deiner Server installiert.",
      premiumTitle: "Resolvo Tool Premium", premiumDesc: "Schalte alle Features frei.",
      premiumPrice: "5,99 EUR", premiumOnce: "/ einmalig",
      premiumCmd: "Nutze /premium in einem Server mit Resolvo Tool.", toServers: "Zu meinen Servern",
      panelActive: "Panel aktiv", panelInactive: "Panel nicht konfiguriert",
      openTickets: "Offene Tickets", closedTickets: "Geschlossen",
      configure: "Konfigurieren", back: "Zurück", save: "Speichern",
      configTitle: "Server-Konfiguration", configDesc: "Passe das Ticket-System für diesen Server an.",
      panelChannel: "Panel-Channel", ticketCategory: "Ticket-Kategorie",
      transcriptChannel: "Transkript-Channel", supportRole: "Support-Rolle",
      buttonText: "Button-Text", buttonColor: "Button-Farbe",
      embedColor: "Embed-Farbe", embedTitle: "Embed-Titel", embedDesc: "Embed-Beschreibung",
      ratingSystem: "Bewertungssystem", ratingEnabled: "Bewertungen nach Ticket-Schließen aktivieren",
      aiSystem: "KI-Ticket-Klassifizierung", aiEnabled: "Automatische KI-Priorisierung aktivieren",
      aiExplain: "Die KI analysiert eingehende Tickets und setzt automatisch die Priorität (Niedrig / Mittel / Hoch / Kritisch) basierend auf dem Inhalt.",
      lang: "Sprache", liveServers: "aktive Server", liveInstalls: "Installationen",
      featureTags: "Ticket-Tags", featureTagsDesc: "Farbcodierte Tags für jede Ticket-Kategorie",
      featureForms: "Formular-Tickets", featureFormsDesc: "Strukturierte Formulare statt Freitext",
      featureEscalation: "Auto-Eskalation", featureEscalationDesc: "Tickets werden nach Zeit automatisch eskaliert",
      featureFAQ: "Smart FAQ", featureFAQDesc: "Bot beantwortet häufige Fragen automatisch",
      welcomeFirst: "Willkommen bei Resolvo Tool",
      welcomeBack: "Willkommen zurück",
    },
    en: {
      home: "Home", add: "Add Bot", servers: "My Servers", premium: "Premium",
      terms: "Terms", privacy: "Privacy", logout: "Logout", login: "Login with Discord",
      heroTitle: "The Most Modern Ticket System for Discord",
      heroDesc: "Resolvo Tool manages your support requests elegantly. With interactive panel, automatic transcripts, AI-powered ticket classification, and smart FAQ system.",
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
      featureTags: "Ticket Tags", featureTagsDesc: "Color-coded tags for every ticket category",
      featureForms: "Form Tickets", featureFormsDesc: "Structured forms instead of free text",
      featureEscalation: "Auto-Escalation", featureEscalationDesc: "Tickets auto-escalate after time",
      featureFAQ: "Smart FAQ", featureFAQDesc: "Bot answers common questions automatically",
      welcomeFirst: "Welcome to Resolvo Tool",
      welcomeBack: "Welcome back",
    }
  };

  function t(lang, key) {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.de[key] || key;
  }

  const COLORS = {
    bg: "#0b0f1a",
    surface: "#12192a",
    surfaceHover: "#192240",
    border: "#1e2d4d",
    borderHover: "#2d3f66",
    accent: "#4f8cff",
    accentLight: "#7aa8ff",
    text: "#e8ecf4",
    textDim: "#94a3c8",
    textMuted: "#5c7094",
    cardBg: "rgba(18,25,42,0.8)",
    success: "#34d399",
    danger: "#f87171",
    warning: "#fbbf24",
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
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: ${COLORS.bg}; }
    ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 3px; }

    .bg-mesh {
      position: fixed; inset: 0; pointer-events: none; z-index: 0;
      background:
        radial-gradient(ellipse at 20% 10%, rgba(79,140,255,0.04) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 90%, rgba(79,140,255,0.03) 0%, transparent 50%);
    }

    .sidebar {
      position: fixed; left: 0; top: 0; width: 260px; height: 100vh;
      background: ${COLORS.surface}; border-right: 1px solid ${COLORS.border};
      z-index: 200; display: flex; flex-direction: column;
      transition: transform .3s ease;
    }
    .sidebar-header { padding: 24px 20px; border-bottom: 1px solid ${COLORS.border}; }
    .sidebar-brand { display: flex; align-items: center; gap: 12px; text-decoration: none; }
    .sidebar-brand img { width: 40px; height: 40px; border-radius: 10px; object-fit: cover; }
    .sidebar-brand span { font-weight: 700; font-size: 1.1rem; color: ${COLORS.text}; letter-spacing: -0.3px; }
    .sidebar-brand small { display: block; font-size: .65rem; color: ${COLORS.accent}; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-top: 2px; }
    .lang-switch { display: flex; gap: 6px; margin-top: 14px; }
    .lang-switch button { flex: 1; background: ${COLORS.bg}; border: 1px solid ${COLORS.border}; color: ${COLORS.textDim};
      padding: 7px 0; border-radius: 8px; cursor: pointer; font-size: .75rem; font-weight: 700;
      transition: all .2s; text-transform: uppercase; letter-spacing: .5px;
    }
    .lang-switch button.active { background: ${COLORS.accent}; color: #fff; border-color: ${COLORS.accent};
      box-shadow: 0 2px 8px rgba(79,140,255,0.25);
    }
    .lang-switch button:hover:not(.active) { border-color: ${COLORS.borderHover}; color: ${COLORS.text}; }
    .sidebar-nav { flex: 1; padding: 14px 12px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
    .sidebar-nav a { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 10px;
      color: ${COLORS.textDim}; text-decoration: none; font-size: .85rem; font-weight: 500;
      transition: all .2s; position: relative;
    }
    .sidebar-nav a:hover { background: ${COLORS.surfaceHover}; color: ${COLORS.text}; }
    .sidebar-nav a.active { background: rgba(79,140,255,0.08); color: ${COLORS.accent}; border: 1px solid rgba(79,140,255,0.15); }
    .sidebar-nav a .nav-icon { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;
      border-radius: 6px; font-size: .7rem; font-weight: 700; background: ${COLORS.border}; color: ${COLORS.textDim};
    }
    .sidebar-nav a.active .nav-icon { background: ${COLORS.accent}; color: #fff; }
    .sidebar-footer { padding: 14px 16px; border-top: 1px solid ${COLORS.border}; }
    .sidebar-user { display: flex; align-items: center; gap: 10px; }
    .sidebar-user img { width: 34px; height: 34px; border-radius: 50%; border: 2px solid ${COLORS.border}; }
    .sidebar-user div { line-height: 1.3; }
    .sidebar-user span { font-size: .8rem; font-weight: 600; color: ${COLORS.text}; }
    .sidebar-user a { font-size: .7rem; color: ${COLORS.textMuted}; text-decoration: none; }
    .sidebar-user a:hover { color: ${COLORS.accent}; }

    .menu-toggle { display: none; position: fixed; top: 14px; left: 14px; z-index: 300;
      width: 40px; height: 40px; background: ${COLORS.surface}; border: 1px solid ${COLORS.border};
      border-radius: 10px; color: ${COLORS.accent}; font-size: 1.1rem; cursor: pointer;
      align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .menu-overlay { display: none; position: fixed; inset: 0;
      background: rgba(11,15,26,.7); backdrop-filter: blur(4px); z-index: 199;
    }
    .menu-overlay.active { display: block; }

    @media (max-width: 768px) {
      .menu-toggle { display: flex; }
      .sidebar { transform: translateX(-100%); }
      .sidebar.open { transform: translateX(0); }
      .main { margin-left: 0 !important; padding-top: 64px; }
    }

    .main { margin-left: 260px; min-height: 100vh; display: flex; flex-direction: column; position: relative; z-index: 1; }

    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 11px 24px;
      border-radius: 10px; font-weight: 600; font-size: .88rem;
      text-decoration: none; border: none; cursor: pointer;
      transition: all .25s ease; position: relative; overflow: hidden;
    }
    .btn-primary { background: ${COLORS.accent}; color: #fff; }
    .btn-primary:hover { background: ${COLORS.accentLight}; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(79,140,255,0.3); }
    .btn-secondary { background: ${COLORS.surface}; color: ${COLORS.text}; border: 1px solid ${COLORS.border}; }
    .btn-secondary:hover { border-color: ${COLORS.borderHover}; background: ${COLORS.surfaceHover}; transform: translateY(-1px); }
    .btn-success { background: ${COLORS.success}; color: #fff; }
    .btn-success:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(52,211,153,0.25); }

    .container { max-width: 1100px; margin: 0 auto; padding: 0 28px; }

    .hero { padding: 80px 0 40px; text-align: center; position: relative; }
    .hero::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
      width: 40%; height: 1px; background: linear-gradient(90deg, transparent, ${COLORS.accent}, transparent);
      opacity: .3;
    }
    .hero-logo { width: 96px; height: 96px; margin: 0 auto 24px; border-radius: 20px;
      object-fit: cover; box-shadow: 0 0 40px rgba(79,140,255,0.15);
    }
    .hero h1 { font-size: 2.6rem; font-weight: 800; color: #fff; margin-bottom: 16px;
      line-height: 1.15; letter-spacing: -0.5px;
    }
    .hero h1 .accent { color: ${COLORS.accent}; }
    .hero p { font-size: 1rem; color: ${COLORS.textDim}; max-width: 520px;
      margin: 0 auto 32px; line-height: 1.7;
    }
    .hero-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }

    .features-section { padding: 48px 0 24px; }
    .features-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
    .feature-card { background: ${COLORS.cardBg}; border: 1px solid ${COLORS.border}; border-radius: 14px;
      padding: 24px 20px; text-align: center; transition: all .3s;
    }
    .feature-card:hover { border-color: ${COLORS.borderHover}; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
    .feature-icon { width: 40px; height: 40px; border-radius: 10px; background: rgba(79,140,255,0.1);
      display: flex; align-items: center; justify-content: center; margin: 0 auto 14px;
      color: ${COLORS.accent}; font-size: .9rem; font-weight: 700;
    }
    .feature-card h3 { font-size: .9rem; font-weight: 700; color: #fff; margin-bottom: 6px; }
    .feature-card p { font-size: .78rem; color: ${COLORS.textMuted}; line-height: 1.5; }
    @media (max-width: 768px) { .features-grid { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 480px) { .features-grid { grid-template-columns: 1fr; } }

    .stats-bar { display: flex; justify-content: center; gap: 80px; padding: 36px 0 28px;
      background: ${COLORS.surface}; border-top: 1px solid ${COLORS.border};
      border-bottom: 1px solid ${COLORS.border};
    }
    .stat { text-align: center; }
    .stat-num { font-size: 2.8rem; font-weight: 800; color: ${COLORS.accent}; line-height: 1; min-width: 80px; }
    .stat-label { font-size: .7rem; color: ${COLORS.textMuted}; text-transform: uppercase;
      letter-spacing: 1.5px; margin-top: 8px; font-weight: 600;
    }
    @media (max-width: 768px) { .stats-bar { gap: 32px; flex-wrap: wrap; padding: 28px 20px; } .stat-num { font-size: 2.2rem; } }

    .page-header { padding: 48px 0 32px; text-align: center; position: relative; }
    .page-header::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
      width: 40%; height: 1px; background: linear-gradient(90deg, transparent, rgba(79,140,255,0.2), transparent);
    }
    .page-header h1 { font-size: 2rem; font-weight: 800; color: #fff; margin-bottom: 10px; letter-spacing: -0.3px; }
    .page-header p { color: ${COLORS.textDim}; font-size: .9rem; }
    .content { padding: 20px 0 48px; }
    .content h2 { color: #fff; font-size: 1.1rem; font-weight: 700; margin: 24px 0 10px; }
    .content p { color: ${COLORS.textDim}; margin-bottom: 12px; font-size: .86rem; }
    .content ul { color: ${COLORS.textDim}; margin: 0 0 12px 20px; font-size: .86rem; }
    .content li { margin-bottom: 6px; }
    .content a { color: ${COLORS.accent}; text-decoration: none; }
    .content a:hover { text-decoration: underline; }

    .server-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .server-card { background: ${COLORS.cardBg}; border: 1px solid ${COLORS.border}; border-radius: 14px;
      padding: 18px; display: flex; align-items: center; gap: 14px; transition: all .25s;
    }
    .server-card:hover { border-color: ${COLORS.borderHover}; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
    .server-icon { width: 48px; height: 48px; border-radius: 12px; background: ${COLORS.accent};
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; color: #fff; font-weight: 700; flex-shrink: 0;
    }
    .server-icon img { width: 48px; height: 48px; border-radius: 12px; object-fit: cover; }
    .server-info { flex: 1; min-width: 0; }
    .server-name { color: #fff; font-weight: 700; font-size: .92rem; margin-bottom: 4px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .server-meta { color: ${COLORS.textMuted}; font-size: .76rem; line-height: 1.5; }
    .server-actions { display: flex; gap: 8px; margin-top: 8px; }
    .server-actions a { font-size: .75rem; padding: 6px 12px; }

    .premium-card { max-width: 420px; margin: 0 auto; background: ${COLORS.cardBg};
      border: 1px solid ${COLORS.border}; border-radius: 18px; padding: 36px 32px;
      text-align: center; position: relative;
    }
    .premium-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
      background: linear-gradient(90deg, ${COLORS.accent}, ${COLORS.accentLight});
      border-radius: 18px 18px 0 0;
    }
    .premium-card h2 { color: #fff; font-size: 1.4rem; font-weight: 800; margin-bottom: 6px; }
    .price { font-size: 2.8rem; font-weight: 800; color: #fff; margin: 10px 0; letter-spacing: -1px; }
    .price span { font-size: .9rem; color: ${COLORS.textMuted}; font-weight: 400; }
    .features-list { text-align: left; margin: 20px 0; }
    .features-list li { color: ${COLORS.textDim}; list-style: none; padding: 8px 0;
      padding-left: 26px; position: relative; font-size: .86rem;
    }
    .features-list li::before { content: ""; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
      width: 16px; height: 16px; background: ${COLORS.accent}; border-radius: 50%; opacity: .5;
    }

    .footer { background: ${COLORS.surface}; border-top: 1px solid ${COLORS.border}; padding: 32px 0; margin-top: auto; }
    .footer-inner { max-width: 1100px; margin: 0 auto; padding: 0 28px;
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;
    }
    .footer-logo { display: flex; align-items: center; gap: 10px; }
    .footer-logo img { width: 26px; height: 26px; border-radius: 6px; }
    .footer-logo span { font-weight: 700; font-size: .88rem; color: ${COLORS.text}; }
    .footer-links { display: flex; gap: 20px; }
    .footer-links a { color: ${COLORS.textMuted}; text-decoration: none; font-size: .78rem; transition: color .2s; }
    .footer-links a:hover { color: ${COLORS.accent}; }
    .copyright { color: ${COLORS.textMuted}; font-size: .75rem; }

    .empty { text-align: center; padding: 48px 20px; }
    .empty img { width: 72px; height: 72px; border-radius: 16px; margin-bottom: 16px; opacity: .4; filter: grayscale(.3); }
    .empty h3 { color: #fff; font-weight: 700; margin-bottom: 6px; }
    .empty p { color: ${COLORS.textMuted}; margin-bottom: 20px; font-size: .86rem; }

    .config-form { max-width: 580px; margin: 0 auto; }
    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; color: ${COLORS.textDim}; font-size: .8rem;
        margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px;
      }
    .form-group input, .form-group select, .form-group textarea {
      width: 100%; background: ${COLORS.bg}; border: 1px solid ${COLORS.border};
      border-radius: 10px; padding: 10px 14px; color: ${COLORS.text}; font-size: .88rem;
      font-family: inherit; transition: all .2s;
    }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
      outline: none; border-color: ${COLORS.accent}; box-shadow: 0 0 0 3px rgba(79,140,255,0.08);
    }
    .form-group textarea { min-height: 72px; resize: vertical; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 768px) { .form-row { grid-template-columns: 1fr; } }

    .toggle-row { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
    .toggle-row label { margin-bottom: 0 !important; text-transform: none !important; letter-spacing: 0 !important; }
    .toggle-switch { appearance: none; -webkit-appearance: none; width: 44px; height: 24px;
      background: ${COLORS.border}; border-radius: 12px; position: relative; cursor: pointer;
      transition: background .2s; border: none; outline: none;
    }
    .toggle-switch::after { content: ''; position: absolute; width: 20px; height: 20px;
      background: ${COLORS.text}; border-radius: 50%; top: 2px; left: 2px;
      transition: transform .2s; box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .toggle-switch:checked { background: ${COLORS.success}; }
    .toggle-switch:checked::after { transform: translateX(20px); background: #fff; }


      /* ── Color Pickers ── */
      .color-btn-group { display:flex; gap:10px; flex-wrap:wrap; margin-top:6px; }
      .color-btn-opt { display:none; }
      .color-btn-label { display:flex; align-items:center; gap:8px; padding:9px 16px; border-radius:10px;
        border:2px solid transparent; cursor:pointer; font-size:.85rem; font-weight:600;
        transition:border-color .15s, transform .1s; user-select:none; }
      .color-btn-label:hover { transform:scale(1.03); }
      .color-btn-opt:checked + .color-btn-label { border-color:#fff; box-shadow:0 0 0 3px rgba(255,255,255,.15); }
      .color-btn-dot { width:16px; height:16px; border-radius:50%; flex-shrink:0; }
      .c-blurple .color-btn-label { background:rgba(88,101,242,.25); color:#9ba8f8; }
      .c-blurple .color-btn-dot { background:#5865F2; }
      .c-gray .color-btn-label { background:rgba(78,80,88,.35); color:#b0b3b8; }
      .c-gray .color-btn-dot { background:#4E5058; }
      .c-green .color-btn-label { background:rgba(87,242,135,.12); color:#57F287; }
      .c-green .color-btn-dot { background:#57F287; }
      .c-red .color-btn-label { background:rgba(237,66,69,.15); color:#ED4245; }
      .c-red .color-btn-dot { background:#ED4245; }
      .color-pick-row { display:flex; align-items:center; gap:10px; margin-top:6px; }
      .color-pick-native { width:46px; height:36px; padding:2px; border:none; border-radius:8px;
        background:#1e2030; cursor:pointer; }
      .color-pick-hex { flex:1; font-family:monospace; text-transform:uppercase; }
      .multi-check-grid { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }
      .multi-check-item { display:flex; align-items:center; gap:7px; padding:7px 12px;
        background:#1e2030; border:1.5px solid #2e3250; border-radius:8px; cursor:pointer;
        font-size:.82rem; transition:border-color .15s, background .15s; }
      .multi-check-item:hover, .multi-check-item.checked { border-color:#5865F2; background:#22264a; }
      .multi-check-item input[type=checkbox] { width:15px; height:15px; accent-color:#5865F2; cursor:pointer; }
      .real-check-row { display:flex; align-items:center; gap:10px; padding:10px 0; }
      .real-check-row input[type=checkbox] { width:17px; height:17px; accent-color:#5865F2; cursor:pointer; flex-shrink:0; }
      .real-check-row label { cursor:pointer; font-size:.9rem; }
      .section-card { border:1px solid #2e3250; border-radius:14px; padding:20px; margin-bottom:20px; }
      .section-card h3 { color:#fff; font-size:.95rem; margin:0 0 4px; }
      .section-card .section-desc { font-size:.78rem; color:#8b92c8; margin:0 0 14px; }
      .star-opts { display:flex; gap:8px; flex-wrap:wrap; margin-top:6px; }
      .star-opt-inp { display:none; }
      .star-opt-lbl { padding:6px 13px; border-radius:8px; border:2px solid #2e3250;
        cursor:pointer; font-size:.82rem; color:#8b92c8; transition:all .15s; }
      .star-opt-lbl:hover { border-color:#5865F2; color:#9ba8f8; }
      .star-opt-inp:checked + .star-opt-lbl { border-color:#5865F2; background:#22264a; color:#fff; }
      .panel-card { border:1px solid #2e3250; border-radius:12px; padding:16px; margin-bottom:12px; }
      .panel-card-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:4px; }
      .panel-card-title { font-weight:700; font-size:.9rem; color:#fff; }
      .panel-card-body { margin-top:14px; }
      .btn-icon { background:none; border:1.5px solid #2e3250; border-radius:8px; padding:5px 10px;
        cursor:pointer; color:#8b92c8; font-size:.78rem; transition:all .15s; }
      .btn-icon:hover { border-color:#ED4245; color:#ED4245; }
      .btn-add-panel { display:inline-flex; align-items:center; gap:6px; padding:9px 18px;
        border-radius:10px; border:2px dashed #2e3250; background:none; color:#8b92c8;
        cursor:pointer; font-size:.84rem; transition:all .2s; margin-top:4px; }
      .btn-add-panel:hover { border-color:#5865F2; color:#9ba8f8; background:#1a1d3a; }
  
    .badge { display: inline-block; padding: 3px 10px; border-radius: 6px;
      font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .5px;
    }
    .badge-green { background: rgba(52,211,153,0.1); color: ${COLORS.success}; border: 1px solid rgba(52,211,153,0.2); }
    .badge-red { background: rgba(248,113,113,0.1); color: ${COLORS.danger}; border: 1px solid rgba(248,113,113,0.2); }
  `;

  function layout(title, content, { session = null, activeNav = "", lang = "de" } = {}) {
      const isLoggedIn = !!session;
      const txt = (k) => t(lang, k);

      const navItems = [
        { id: "home", href: "/", label: txt("home"), icon: "H" },
        { id: "add", href: "/add", label: txt("add"), icon: "+" },
        { id: "servers", href: "/servers", label: txt("servers"), icon: "S" },
        { id: "premium", href: "/premium", label: txt("premium"), icon: "P" },
        { id: "support", href: "/support", label: "Support", icon: "?" },
        { id: "terms", href: "/terms", label: txt("terms"), icon: "T" },
        { id: "privacy", href: "/privacy", label: txt("privacy"), icon: "D" },
      ];

      const sidebarNav = navItems.map(item => {
        const isActive = activeNav === item.id;
        return `<a href="${item.href}" class="${isActive ? "active" : ""}"><span class="nav-icon">${item.icon}</span>${item.label}</a>`;
      }).join("");

      const userSection = isLoggedIn
        ? `<div class="sidebar-user"><img src="https://cdn.discordapp.com/avatars/${session.userId}/${session.avatar}.png" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'" alt=""><div><span>${session.username}</span><br><a href="/auth/logout">${txt("logout")}</a></div></div>`
        : `<a href="/auth/login?redirect=/servers" class="btn btn-primary" style="width:100%;justify-content:center;font-size:.82rem;padding:9px;">${txt("login")}</a>`;

      return `<!DOCTYPE html>
  <html lang="${lang}">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Resolvo Tool</title>
    <style>${GLOBAL_STYLES}
    /* Welcome overlay animation */
    .welcome-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(11,15,26,0.98); display: flex; align-items: center; justify-content: center; flex-direction: column; opacity: 0; pointer-events: none; transition: opacity 0.6s ease; }
    .welcome-overlay.active { opacity: 1; pointer-events: all; }
    .welcome-overlay .welcome-logo { width: 96px; height: 96px; border-radius: 24px; margin-bottom: 24px; opacity: 0; transform: scale(0.6); animation: welcomePop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; animation-delay: 0.1s; }
    .welcome-overlay .welcome-title { font-size: 1.8rem; font-weight: 700; color: #e6f1ff; margin-bottom: 8px; opacity: 0; transform: translateY(20px); animation: welcomeSlideUp 0.6s ease forwards; animation-delay: 0.4s; }
    .welcome-overlay .welcome-sub { font-size: 1rem; color: #8aa2c9; opacity: 0; transform: translateY(15px); animation: welcomeSlideUp 0.5s ease forwards; animation-delay: 0.65s; }
    .welcome-overlay .welcome-line { width: 60px; height: 3px; border-radius: 2px; background: linear-gradient(90deg, #4f8cff, #7ab8ff); margin: 20px auto; opacity: 0; animation: welcomeGrow 0.5s ease forwards; animation-delay: 0.55s; }
    @keyframes welcomePop { to { opacity: 1; transform: scale(1); } }
    @keyframes welcomeSlideUp { to { opacity: 1; transform: translateY(0); } }
    @keyframes welcomeGrow { from { width: 0; opacity: 0; } to { width: 60px; opacity: 1; } }
</style>
  </head>
  <body>
    <div class="bg-mesh"></div>
    <button class="menu-toggle" onclick="document.querySelector('.sidebar').classList.toggle('open');document.querySelector('.menu-overlay').classList.toggle('active')">&#9776;</button>
    <div class="menu-overlay" onclick="document.querySelector('.sidebar').classList.remove('open');this.classList.remove('active')"></div>
    <aside class="sidebar">
      <div class="sidebar-header">
        <a href="/" class="sidebar-brand">
          <img src="${LOGO_URL}" alt="Resolvo Tool" onerror="this.style.display='none';this.parentNode.querySelector('span').style.marginLeft='0'">
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
          <div class="footer-logo"><img src="${LOGO_URL}" alt="" onerror="this.style.display='none'"><span>Resolvo Tool</span></div>
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
      const tickets = getGlobalTicketCount();
      return { servers, tickets };
    }

    // --- Homepage ---

  router.get("/", (req, res) => {
      const lang = getLang(req);
      const txt = (k) => t(lang, k);
      const stats = getBotStats();

      res.send(layout(txt("home"), `
        <!-- Welcome overlay -->
        <div id="welcomeOverlay" class="welcome-overlay active">
          <img src="${LOGO_URL}" alt="" class="welcome-logo" onerror="this.style.display='none'">
          <div class="welcome-title" id="welcomeTitle">${txt("welcomeFirst")}</div>
          <div class="welcome-line"></div>
          <div class="welcome-sub">${txt("heroDesc").substring(0, 60)}...</div>
        </div>

        <!-- Live Stats Bar (top, animated counters) -->
            <div style="max-width:480px;margin:0 auto 32px;padding:18px 32px;background:rgba(18,25,42,0.85);backdrop-filter:blur(12px);border:1px solid rgba(79,140,255,0.12);border-radius:16px;display:flex;align-items:center;justify-content:center;gap:0;flex-wrap:wrap;">
              <div style="text-align:center;padding:0 36px;min-width:130px;">
                <div class="stat-num" data-target="${stats.tickets}" style="font-size:2.2rem;font-weight:800;background:linear-gradient(135deg,#34d399,#4f8cff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">0</div>
                <div style="font-size:.72rem;color:#5c7094;margin-top:4px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">${lang === "en" ? "Tickets resolved" : "Tickets bearbeitet"}</div>
              </div>
              <div style="width:1px;height:48px;background:rgba(79,140,255,0.15);flex-shrink:0;"></div>
              <div style="text-align:center;padding:0 36px;min-width:130px;">
                <div class="stat-num" data-target="${stats.servers}" style="font-size:2.2rem;font-weight:800;background:linear-gradient(135deg,#4f8cff,#7aa8ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">0</div>
                <div style="font-size:.72rem;color:#5c7094;margin-top:4px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">${lang === "en" ? "Active Servers" : "Aktive Server"}</div>
              </div>
            </div>
  
        <div class="hero" style="padding-top:16px;">
          <img src="${LOGO_URL}" alt="Resolvo Tool" class="hero-logo" onerror="this.style.display='none'">
          <h1>${txt("heroTitle")}</h1>
          <p>${txt("heroDesc")}</p>
          <div class="hero-btns">
            <a href="/add" class="btn btn-primary">${txt("addBot")}</a>
            <a href="/premium" class="btn btn-secondary">${txt("discoverPremium")}</a>
          </div>
        </div>
        <div style="max-width:700px;margin:0 auto 44px;text-align:center;padding:0 20px;">
            <h2 style="font-size:1.2rem;color:#e8ecf4;margin-bottom:14px;font-weight:600;">${lang === "en" ? "Why Resolvo Tool?" : "Warum Resolvo Tool?"}</h2>
            <p style="color:#5c7094;line-height:1.7;font-size:.88rem;">
              ${lang === "en"
                ? "Resolvo Tool revolutionizes your Discord support. Instead of chaotic DM floods, you get a professional ticket system right in your server. AI-powered classification, automatic escalation, and a smart FAQ ensure no request goes unanswered."
                : "Resolvo Tool revolutioniert deinen Discord-Support. Statt chaotischer DM-Flut bekommst du ein professionelles Ticketsystem direkt in deinem Server. KI-gestützte Klassifizierung, automatische Eskalation und ein intelligentes FAQ sorgen dafür, dass keine Anfrage unbeantwortet bleibt."
              }
            </p>
          </div>

        <div style="text-align:center;margin:0 0 32px;">
          <h2 style="font-size:1.15rem;color:#e8ecf4;margin-bottom:16px;font-weight:600;">${lang === "en" ? "Quick Start" : "Schnellstart"}</h2>
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;max-width:560px;margin:0 auto;">
            <div style="background:#12192a;border:1px solid #1e2d4d;border-radius:12px;padding:16px;flex:1;min-width:120px;text-align:center;transition:transform .2s;" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='translateY(0)'">
              <div style="font-size:1.3rem;color:#4f8cff;font-weight:700;margin-bottom:4px;">1</div>
              <div style="font-size:.8rem;color:#8aa2c9;">${lang === "en" ? "Add Bot" : "Bot hinzufügen"}</div>
            </div>
            <div style="background:#12192a;border:1px solid #1e2d4d;border-radius:12px;padding:16px;flex:1;min-width:120px;text-align:center;transition:transform .2s;" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='translateY(0)'">
              <div style="font-size:1.3rem;color:#4f8cff;font-weight:700;margin-bottom:4px;">2</div>
              <div style="font-size:.8rem;color:#8aa2c9;">${lang === "en" ? "Select Server" : "Server auswählen"}</div>
            </div>
            <div style="background:#12192a;border:1px solid #1e2d4d;border-radius:12px;padding:16px;flex:1;min-width:120px;text-align:center;transition:transform .2s;" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='translateY(0)'">
              <div style="font-size:1.3rem;color:#4f8cff;font-weight:700;margin-bottom:4px;">3</div>
              <div style="font-size:.8rem;color:#8aa2c9;">${lang === "en" ? "Configure Panel" : "Panel konfigurieren"}</div>
            </div>
          </div>
        </div>
          <div class="features-section">
          <div class="container">
            <div class="features-grid">
              <div class="feature-card">
                <div class="feature-icon" style="background:rgba(79,140,255,0.12);color:#4f8cff;">🎫</div>
                <h3>${txt("featureTags")}</h3>
                <p>${txt("featureTagsDesc")}</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon" style="background:rgba(52,211,153,0.12);color:#34d399;">📋</div>
                <h3>${txt("featureForms")}</h3>
                <p>${txt("featureFormsDesc")}</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon" style="background:rgba(245,158,11,0.12);color:#f59e0b;">⚡</div>
                <h3>${txt("featureEscalation")}</h3>
                <p>${txt("featureEscalationDesc")}</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon" style="background:rgba(236,72,153,0.12);color:#ec4899;">💡</div>
                <h3>${txt("featureFAQ")}</h3>
                <p>${txt("featureFAQDesc")}</p>
              </div>
            </div>
          </div>
        </div>

        <script>
          (function() {
            // Welcome animation
            const overlay = document.getElementById('welcomeOverlay');
            const title = document.getElementById('welcomeTitle');
            const hasVisited = localStorage.getItem('resolvoVisited');
            if (hasVisited) {
              title.textContent = "${txt('welcomeBack')}";
              overlay.classList.remove('active');
              overlay.style.opacity = '0';
              overlay.style.pointerEvents = 'none';
            } else {
              localStorage.setItem('resolvoVisited', 'true');
              setTimeout(() => {
                overlay.classList.remove('active');
                overlay.style.opacity = '0';
                overlay.style.pointerEvents = 'none';
              }, 2800);
            }

            // Counter animation
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
            <img src="${LOGO_URL}" alt="" onerror="this.style.display='none'">
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
                <div class="server-meta">${statusBadge} · ${txt("openTickets")}: ${stats.open} · ${txt("closedTickets")}: ${stats.closed}</div>
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
            <img src="${LOGO_URL}" style="width:56px;height:56px;border-radius:14px;opacity:.4;margin-bottom:16px;" onerror="this.style.display='none'">
            <h2 style="color:#fff;margin-bottom:8px;">Server nicht gefunden</h2>
            <p style="color:${COLORS.textMuted};margin-bottom:20px;">Der Bot ist nicht auf diesem Server.</p>
            <a href="/servers" class="btn btn-primary">${txt("back")}</a>
          </div>
        `, { session, lang }));
        return;
      }

      const config = getPanelConfig(guildId) || {};
        const stats = getStats(guildId);
        let panels = [];
        try { panels = getPanels(guildId); } catch(_) {}
        const embedHex = (n) => ((n || 3447003) >>> 0).toString(16).padStart(6, '0').toUpperCase();
        const selectedRoleIds = (() => { try { return JSON.parse(config.support_role_ids || '[]'); } catch(_) { return config.support_role_id ? [config.support_role_id] : []; } })();

        const textChannels = guild.channels.cache.filter(c => c.type === 0).sort((a, b) => a.rawPosition - b.rawPosition).map(c => ({ id: c.id, name: c.name }));
        const categories = guild.channels.cache.filter(c => c.type === 4).sort((a, b) => a.rawPosition - b.rawPosition).map(c => ({ id: c.id, name: c.name }));
        const roles = guild.roles.cache.filter(r => !r.managed && r.name !== "@everyone").sort((a, b) => b.position - a.position).map(r => ({ id: r.id, name: r.name }));

        const sel = (val, items, placeholder) => `<option value="">${placeholder}</option>` + items.map(i => `<option value="${i.id}" ${i.id === val ? "selected" : ""}>${i.name}</option>`).join("");
        const icon = guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null;

        const btnColorPicker = (val, prefix = '') => {
          const c = parseInt(val) || 1;
          return `<div class="color-btn-group">
            <div class="c-blurple"><input class="color-btn-opt" type="radio" name="${prefix}button_color" id="${prefix}bc1" value="1" ${c===1?"checked":""}><label class="color-btn-label" for="${prefix}bc1"><span class="color-btn-dot"></span>Primär</label></div>
            <div class="c-gray"><input class="color-btn-opt" type="radio" name="${prefix}button_color" id="${prefix}bc2" value="2" ${c===2?"checked":""}><label class="color-btn-label" for="${prefix}bc2"><span class="color-btn-dot"></span>Sekundär</label></div>
            <div class="c-green"><input class="color-btn-opt" type="radio" name="${prefix}button_color" id="${prefix}bc3" value="3" ${c===3?"checked":""}><label class="color-btn-label" for="${prefix}bc3"><span class="color-btn-dot"></span>Grün</label></div>
            <div class="c-red"><input class="color-btn-opt" type="radio" name="${prefix}button_color" id="${prefix}bc4" value="4" ${c===4?"checked":""}><label class="color-btn-label" for="${prefix}bc4"><span class="color-btn-dot"></span>Rot</label></div>
          </div>`;
        };
        const embedColorPicker = (val, prefix = '') => {
          const hex = embedHex(val);
          return `<div class="color-pick-row">
            <input type="color" class="color-pick-native" id="${prefix}ecp" value="#${hex}"
              oninput="document.getElementById('${prefix}ech').value=this.value.slice(1).toUpperCase()">
            <input type="text" id="${prefix}ech" name="${prefix}embed_color" value="${hex}" maxlength="6"
              pattern="[0-9a-fA-F]{6}" class="color-pick-hex"
              oninput="document.getElementById('${prefix}ecp').value='#'+this.value">
          </div>`;
        };

        const panelHtml = panels.map((p, i) => {
          const ph = embedHex(p.embed_color);
          return `<div class="panel-card" id="pc${p.id}">
            <div class="panel-card-header">
              <span class="panel-card-title">📌 ${p.name || 'Panel '+(i+1)}</span>
              <div style="display:flex;gap:8px;">
                <button type="button" class="btn-icon" onclick="togglePanel(${p.id})">▼ Details</button>
                <form method="POST" action="/server/${guildId}/panels/${p.id}/delete" style="margin:0;">
                  <button type="submit" class="btn-icon" onclick="return confirm('Panel löschen?')">✕ Löschen</button>
                </form>
              </div>
            </div>
            <div class="panel-card-body" id="pb${p.id}">
              <form method="POST" action="/server/${guildId}/panels/${p.id}/update">
                <div class="form-row">
                  <div class="form-group"><label>Panel-Name</label><input type="text" name="name" value="${p.name}" maxlength="50"></div>
                  <div class="form-group"><label>Panel-Channel</label><select name="channel_id">${sel(p.channel_id, textChannels, "-- wählen --")}</select></div>
                </div>
                <div class="form-row">
                  <div class="form-group"><label>Ticket-Kategorie</label><select name="ticket_category_id">${sel(p.ticket_category_id, categories, "-- wählen --")}</select></div>
                </div>
                <div class="form-group"><label>Button-Text</label><input type="text" name="button_text" value="${p.button_text || 'Ticket erstellen'}" maxlength="80"></div>
                <div class="form-group"><label>Button-Farbe</label>${btnColorPicker(p.button_color, 'p'+p.id+'_')}</div>
                <div class="form-group"><label>Embed-Farbe</label>${embedColorPicker(p.embed_color, 'p'+p.id+'_')}</div>
                <div class="form-row">
                  <div class="form-group"><label>Embed-Titel</label><input type="text" name="embed_title" value="${p.embed_title || 'Support'}" maxlength="100"></div>
                </div>
                <div class="form-group"><label>Embed-Beschreibung</label><textarea name="embed_description" maxlength="400">${p.embed_description || ''}</textarea></div>
                <button type="submit" class="btn btn-primary" style="margin-top:10px;">Panel speichern</button>
              </form>
            </div>
          </div>`;
        }).join('');

        res.send(layout(txt("configTitle"), `
          <div class="page-header">
            <div style="display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:10px;">
              <div style="width:48px;height:48px;border-radius:12px;background:${COLORS.accent};display:flex;align-items:center;justify-content:center;font-size:1.2rem;color:#fff;font-weight:700;">
                ${icon ? `<img src="${icon}" style="width:48px;height:48px;border-radius:12px;object-fit:cover;">` : guild.name.charAt(0)}
              </div>
              <div style="text-align:left;">
                <h1 style="font-size:1.4rem;margin-bottom:2px;">${guild.name}</h1>
                <p style="font-size:.8rem;margin:0;color:${COLORS.textMuted};">${txt("configDesc")}</p>
              </div>
            </div>
            <p style="color:${COLORS.textMuted};font-size:.8rem;margin-top:6px;">
              ${txt("openTickets")}: ${stats.open} · ${txt("closedTickets")}: ${stats.closed} · Total: ${stats.total} · Avg: ${stats.avgRating || "N/A"}
            </p>
          </div>
          <div class="content container">

            <!-- ── Haupt-Konfiguration ─────────────────────────── -->
            <form method="POST" action="/server/${guildId}/save" class="config-form">

              <div class="section-card">
                <h3>⚙️ Allgemeine Einstellungen</h3>
                <p class="section-desc">Kanal für Transkripte und Support-Rollen für alle Panels.</p>
                <div class="form-group"><label>${txt("transcriptChannel")}</label><select name="transcript_channel_id">${sel(config.transcript_channel_id, textChannels, "-- wählen --")}</select></div>
                <div class="form-group">
                  <label>${txt("supportRole")} (Mehrfachauswahl)</label>
                  <div class="multi-check-grid">
                    ${roles.length ? roles.map(r => `
                      <label class="multi-check-item${selectedRoleIds.includes(r.id) ? ' checked' : ''}">
                        <input type="checkbox" name="support_role_ids" value="${r.id}" ${selectedRoleIds.includes(r.id) ? 'checked' : ''}
                          onchange="this.closest('.multi-check-item').classList.toggle('checked',this.checked)">
                        ${r.name}
                      </label>
                    `).join('') : '<p style="color:#8b92c8;font-size:.82rem;">Keine Rollen gefunden.</p>'}
                  </div>
                </div>
              </div>

              <div class="section-card">
                <h3>🤖 KI-Ticket-Klassifizierung</h3>
                <p class="section-desc">Die KI analysiert eingehende Tickets und setzt automatisch die Priorität.</p>
                <div class="real-check-row">
                  <input type="checkbox" id="ai_enabled" name="ai_enabled" ${config.ai_enabled ? 'checked' : ''}>
                  <label for="ai_enabled">${txt("aiEnabled")}</label>
                </div>
              </div>

              <div class="section-card">
                <h3>⭐ Bewertungssystem</h3>
                <p class="section-desc">Nutzer bewerten den Support nach dem Schließen eines Tickets.</p>
                <div class="real-check-row">
                  <input type="checkbox" id="rating_enabled" name="rating_enabled"
                    ${config.rating_enabled ? 'checked' : ''} onchange="document.getElementById('rating_cfg').style.display=this.checked?'block':'none'">
                  <label for="rating_enabled">${txt("ratingEnabled")}</label>
                </div>
                <div id="rating_cfg" style="margin-top:16px;${config.rating_enabled ? '' : 'display:none'}">
                  <div class="form-group">
                    <label>Bewertungsfrage (wird dem Nutzer angezeigt)</label>
                    <input type="text" name="rating_question" maxlength="200"
                      value="${config.rating_question || 'Wie zufrieden bist du mit der Bearbeitung deines Tickets?'}">
                  </div>
                  <div class="form-group">
                    <label>Maximale Sternanzahl</label>
                    <div class="star-opts">
                      ${[3,4,5,6,7,8,9,10].map(n => {
                        const cur = config.rating_max_stars || 5;
                        return `<input class="star-opt-inp" type="radio" name="rating_max_stars" id="rs${n}" value="${n}" ${cur==n?'checked':''}><label class="star-opt-lbl" for="rs${n}">${'★'.repeat(Math.min(n,5))} ${n}</label>`;
                      }).join('')}
                    </div>
                  </div>
                  <div class="form-group">
                    <label>DM-Nachricht an Nutzer beim Bewertungs-Request</label>
                    <textarea name="rating_dm_message" maxlength="400">${config.rating_dm_message || ''}</textarea>
                  </div>
                  <div class="real-check-row">
                    <input type="checkbox" id="rating_show" name="rating_show_in_channel" ${config.rating_show_in_channel ? 'checked' : ''}>
                    <label for="rating_show">Bewertung im Ticket-Channel anzeigen</label>
                  </div>
                </div>
              </div>

              <div style="display:flex;gap:12px;margin-top:4px;">
                <a href="/servers" class="btn btn-secondary">${txt("back")}</a>
                <button type="submit" class="btn btn-success">${txt("save")}</button>
              </div>
            </form>

            <!-- ── Panels ─────────────────────────────────────── -->
            <div style="margin-top:32px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
                <div>
                  <h2 style="color:#fff;font-size:1.1rem;margin:0 0 4px;">📋 Panels</h2>
                  <p style="color:#8b92c8;font-size:.8rem;margin:0;">Erstelle mehrere Ticket-Panels in verschiedenen Kanälen.</p>
                </div>
              </div>
              ${panelHtml || '<p style="color:#8b92c8;font-size:.84rem;margin-bottom:12px;">Noch keine Panels erstellt.</p>'}
              <form method="POST" action="/server/${guildId}/panels/create">
                <button type="submit" class="btn-add-panel">+ Neues Panel hinzufügen</button>
              </form>
            </div>

          </div>
          <script>
            function togglePanel(id) {
              const card = document.getElementById('pc'+id);
              const body = document.getElementById('pb'+id);
              if (body.style.display === 'block') { body.style.display='none'; } else { body.style.display='block'; }
            }
          </script>
        `, { session, activeNav: "servers", lang }));
      });

      router.post("/server/:guildId/save", (req, res) => {
        const session = getSession(req);
        if (!session) { res.redirect("/auth/login"); return; }
        const guildId = req.params.guildId;
        const body = req.body;
        const roleIds = Array.isArray(body.support_role_ids)
          ? body.support_role_ids
          : body.support_role_ids ? [body.support_role_ids] : [];
        upsertPanelConfig(guildId, {
          transcript_channel_id: body.transcript_channel_id || null,
          support_role_id: roleIds[0] || null,
          support_role_ids: JSON.stringify(roleIds),
          rating_enabled: body.rating_enabled === "on" ? 1 : 0,
          rating_question: body.rating_question || null,
          rating_max_stars: body.rating_max_stars ? parseInt(body.rating_max_stars) : 5,
          rating_dm_message: body.rating_dm_message || null,
          rating_show_in_channel: body.rating_show_in_channel === "on" ? 1 : 0,
          ai_enabled: body.ai_enabled === "on" ? 1 : 0,
        });
        res.redirect("/server/" + guildId);
      });

      router.post("/server/:guildId/panels/create", (req, res) => {
        const session = getSession(req);
        if (!session) { res.redirect("/auth/login"); return; }
        try {
          createPanel(req.params.guildId, {
            name: "Panel " + (Date.now() % 1000),
            button_text: "Ticket erstellen",
            embed_title: "Support",
            embed_description: "Klicke auf den Button um ein Ticket zu erstellen.",
          });
        } catch(_) {}
        res.redirect("/server/" + req.params.guildId);
      });

      router.post("/server/:guildId/panels/:panelId/update", (req, res) => {
        const session = getSession(req);
        if (!session) { res.redirect("/auth/login"); return; }
        const body = req.body;
        try {
          updatePanel(parseInt(req.params.panelId), req.params.guildId, {
            name: body.name || "Panel",
            channel_id: body.channel_id || null,
            ticket_category_id: body.ticket_category_id || null,
            button_text: body.button_text || "Ticket erstellen",
            button_color: body.button_color ? parseInt(body.button_color) : 1,
            embed_color: body.embed_color ? parseInt(body.embed_color, 16) : 3447003,
            embed_title: body.embed_title || "Support",
            embed_description: body.embed_description || "",
          });
        } catch(_) {}
        res.redirect("/server/" + req.params.guildId);
      });

      router.post("/server/:guildId/panels/:panelId/delete", (req, res) => {
        const session = getSession(req);
        if (!session) { res.redirect("/auth/login"); return; }
        try { deletePanel(parseInt(req.params.panelId), req.params.guildId); } catch(_) {}
        res.redirect("/server/" + req.params.guildId);
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
            <img src="${LOGO_URL}" alt="" style="width:48px;height:48px;border-radius:12px;margin:0 auto 14px;opacity:.8;" onerror="this.style.display='none'">
            <h2>Premium</h2>
            <p style="color:${COLORS.textMuted};margin-bottom:4px;font-size:.82rem;">${lang === "en" ? "One-time purchase" : "Einmaliger Kauf"}</p>
            <div class="price">${price} <span>${txt("premiumOnce")}</span></div>
            <ul class="features-list">
              <li>${lang === "en" ? "Extended server statistics" : "Erweiterte Server-Statistiken"}</li>
              <li>${lang === "en" ? "Unlimited ticket categories" : "Unbegrenzte Ticket-Kategorien"}</li>
              <li>${lang === "en" ? "AI-powered ticket classification" : "KI-Ticket-Klassifizierung"}</li>
              <li>${lang === "en" ? "Staff leaderboard & ratings" : "Staff-Leaderboard & Bewertungen"}</li>
              <li>${lang === "en" ? "Ticket tags & color coding" : "Ticket-Tags & Farbcodierung"}</li>
              <li>${lang === "en" ? "Auto-escalation & smart FAQ" : "Auto-Eskalation & Smart FAQ"}</li>
              <li>${lang === "en" ? "Priority support" : "Priorisierte Unterstützung"}</li>
              <li>${lang === "en" ? "Early access to new features" : "Früher Zugang zu neuen Features"}</li>
            </ul>
            <p style="color:${COLORS.textMuted};font-size:.78rem;margin:16px 0;">${txt("premiumCmd")}</p>
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
          <a href="/servers" class="btn btn-primary" style="margin-top:20px;">${lang === "en" ? "To my servers" : "Zu meinen Servern"}</a>
        </div>
      `, { lang }));
    });

  router.get("/premium/cancel", (req, res) => {
      const lang = getLang(req);
      res.send(layout(lang === "en" ? "Payment cancelled" : "Zahlung abgebrochen", `
        <div class="page-header"><h1>${lang === "en" ? "Payment cancelled" : "Zahlung abgebrochen"}</h1></div>
        <div class="content container" style="text-align:center;">
          <p style="color:${COLORS.textDim};">${lang === "en" ? "The payment was cancelled. Your server still has free access." : "Die Zahlung wurde abgebrochen. Dein Server hat weiterhin den kostenlosen Zugriff."}</p>
          <a href="/premium" class="btn btn-primary" style="margin-top:20px;">Premium</a>
        </div>
      `, { lang }));
    });

    // --- Support ---

    router.get("/support", (req, res) => {
          const lang = getLang(req);
          const txt = (k) => t(lang, k);

          res.send(layout("Support", `
            <div class="page-header"><h1>${txt("supportTitle")}</h1><p>${txt("supportDesc")}</p></div>
            <div class="content container">
              <div style="max-width:520px;margin:0 auto;">

                <!-- Chat Widget (always visible) -->
                <div style="background:#12192a;border:1px solid #1e2d4d;border-radius:16px;padding:28px;margin-bottom:20px;">
                  <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
                    <div style="font-size:1.4rem;">🤖</div>
                    <div>
                      <h3 style="color:#fff;font-size:1rem;margin:0;font-weight:600;">${txt("supportChat")}</h3>
                      <p style="color:#5c7094;font-size:.75rem;margin:2px 0 0;">${txt("supportChatDesc")}</p>
                    </div>
                  </div>
                  <div id="chatWidget" style="background:#0b0f1a;border:1px solid #1e2d4d;border-radius:12px;padding:14px;height:280px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;">
                    <div style="background:rgba(79,140,255,0.1);color:#7aa8ff;padding:8px 12px;border-radius:10px;font-size:.8rem;max-width:85%;align-self:flex-start;">
                      ${lang === "en" ? "Hi! How can I help you with Resolvo Tool today?" : "Hallo! Wie kann ich dir bei Resolvo Tool helfen?"}
                    </div>
                  </div>
                  <div style="display:flex;gap:8px;margin-top:10px;">
                    <input type="text" id="chatInput" placeholder="${lang === "en" ? "Type your question..." : "Deine Frage..."}" style="flex:1;background:#0b0f1a;border:1px solid #1e2d4d;border-radius:8px;padding:8px 12px;color:#e8ecf4;font-size:.82rem;outline:none;" onkeydown="if(event.key==='Enter')sendChat()">
                    <button onclick="sendChat()" style="background:#4f8cff;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:.82rem;cursor:pointer;font-weight:500;white-space:nowrap;">
                      ${lang === "en" ? "Send" : "Senden"}
                    </button>
                  </div>
                </div>

                <!-- Contact form — hidden until bot can't help -->
                <div id="contactSection" style="display:none;">
                  <div style="background:#12192a;border:1px solid #1e2d4d;border-radius:16px;padding:28px;">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
                      <div style="font-size:1.4rem;">✉️</div>
                      <div>
                        <h3 style="color:#fff;font-size:1rem;margin:0;font-weight:600;">${txt("supportContact")}</h3>
                        <p style="color:#5c7094;font-size:.75rem;margin:2px 0 0;">${txt("supportContactDesc")}</p>
                      </div>
                    </div>
                    <form id="contactForm" onsubmit="sendContact(event)" style="display:flex;flex-direction:column;gap:12px;">
                      <input type="text" name="name" placeholder="${txt("supportName")}" required style="background:#0b0f1a;border:1px solid #1e2d4d;border-radius:8px;padding:10px 12px;color:#e8ecf4;font-size:.82rem;outline:none;">
                      <input type="email" name="email" placeholder="${txt("supportEmail")}" required style="background:#0b0f1a;border:1px solid #1e2d4d;border-radius:8px;padding:10px 12px;color:#e8ecf4;font-size:.82rem;outline:none;">
                      <textarea name="issue" placeholder="${txt("supportIssue")}" required rows="4" style="background:#0b0f1a;border:1px solid #1e2d4d;border-radius:8px;padding:10px 12px;color:#e8ecf4;font-size:.82rem;outline:none;resize:vertical;"></textarea>
                      <button type="submit" style="background:#34d399;color:#0b0f1a;border:none;border-radius:8px;padding:10px;font-size:.85rem;cursor:pointer;font-weight:600;">${txt("supportSend")}</button>
                    </form>
                    <div id="contactSuccess" style="display:none;color:#34d399;font-size:.85rem;margin-top:12px;text-align:center;">${txt("supportSuccess")}</div>
                  </div>
                </div>

              </div>
            </div>
            <script>
              const lang = "${lang}";
              async function sendChat() {
                const input = document.getElementById('chatInput');
                const widget = document.getElementById('chatWidget');
                const text = input.value.trim();
                if (!text) return;
                input.disabled = true;
                const userMsg = document.createElement('div');
                userMsg.style.cssText = 'background:rgba(52,211,153,0.1);color:#34d399;padding:8px 12px;border-radius:10px;font-size:.8rem;max-width:85%;align-self:flex-end;';
                userMsg.textContent = text;
                widget.appendChild(userMsg);
                input.value = '';
                widget.scrollTop = widget.scrollHeight;
                try {
                  const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, lang }) });
                  const data = await res.json();
                  const botMsg = document.createElement('div');
                  botMsg.style.cssText = 'background:rgba(79,140,255,0.1);color:#7aa8ff;padding:8px 12px;border-radius:10px;font-size:.8rem;max-width:85%;align-self:flex-start;';
                  botMsg.textContent = data.reply;
                  widget.appendChild(botMsg);
                  widget.scrollTop = widget.scrollHeight;
                  if (!data.canHelp) {
                    const hint = document.createElement('div');
                    hint.style.cssText = 'align-self:flex-start;margin-top:4px;';
                    hint.innerHTML = '<button onclick="showContactForm()" style="background:rgba(52,211,153,0.12);color:#34d399;border:1px solid rgba(52,211,153,0.25);border-radius:8px;padding:6px 14px;font-size:.76rem;cursor:pointer;font-weight:600;">' + (lang === 'en' ? '✉ Contact Support' : '✉ Kontaktformular öffnen') + '</button>';
                    widget.appendChild(hint);
                    widget.scrollTop = widget.scrollHeight;
                  }
                } catch (e) {
                  const errMsg = document.createElement('div');
                  errMsg.style.cssText = 'background:rgba(248,113,113,0.1);color:#f87171;padding:8px 12px;border-radius:10px;font-size:.8rem;max-width:85%;align-self:flex-start;';
                  errMsg.textContent = lang === 'en' ? 'Connection error. Please try again.' : 'Verbindungsfehler. Bitte erneut versuchen.';
                  widget.appendChild(errMsg);
                  widget.scrollTop = widget.scrollHeight;
                }
                input.disabled = false;
                input.focus();
              }
              function showContactForm() {
                const section = document.getElementById('contactSection');
                section.style.display = 'block';
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
              async function sendContact(e) {
                e.preventDefault();
                const form = document.getElementById('contactForm');
                const data = new FormData(form);
                const payload = { name: data.get('name'), email: data.get('email'), issue: data.get('issue') };
                try {
                  const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                  if (res.ok) {
                    form.style.display = 'none';
                    document.getElementById('contactSuccess').style.display = 'block';
                  } else {
                    alert(lang === 'en' ? 'Failed to send. Please try again.' : 'Senden fehlgeschlagen. Bitte erneut versuchen.');
                  }
                } catch (e) {
                  alert(lang === 'en' ? 'Network error.' : 'Netzwerkfehler.');
                }
              }
            </script>
          `, { activeNav: "support", lang }));
        });

      // --- Terms ---

  router.get("/terms", (req, res) => {
      const lang = getLang(req);
      if (lang === "en") {
        res.send(layout("Terms of Service", `
          <div class="page-header"><h1>Terms of Service</h1></div>
          <div class="content container">
            <p class="subtitle" style="color:${COLORS.textMuted};margin-bottom:28px;font-size:.82rem;">Last updated: ${new Date().toLocaleDateString("en-US")}</p>
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
            <p class="subtitle" style="color:${COLORS.textMuted};margin-bottom:28px;font-size:.82rem;">Zuletzt aktualisiert: ${new Date().toLocaleDateString("de-DE")}</p>
            <h2>1. Geltungsbereich</h2><p>Diese Nutzungsbedingungen gelten für die Nutzung des Discord-Bots "Resolvo Tool" sowie des zugehörigen Web-Dashboards.</p>
            <h2>2. Nutzung des Dienstes</h2><p>Resolvo Tool darf ausschließlich für legale Zwecke und in Übereinstimmung mit den Discord-Nutzungsbedingungen verwendet werden.</p>
            <h2>3. Premium-Abonnement</h2><p>Das Premium-Upgrade wird für eine einmalige Zahlung angeboten und gewährt dauerhaften Zugang.</p>
            <h2>4. Datenspeicherung</h2><p>Wir speichern Discord-Nutzer-IDs, Server-IDs und Ticket-Inhalte zur Bereitstellung des Dienstes.</p>
            <h2>5. Verfügbarkeit</h2><p>Wir bemuehen uns um eine hohe Verfügbarkeit, können jedoch keine 100%ige Verfügbarkeit garantieren.</p>
            <h2>6. Haftungsbeschränkung</h2><p>Resolvo Tool haftet nicht für Schäden, die durch die Nutzung oder Nicht-Nutzung des Dienstes entstehen.</p>
            <h2>7. Kontakt</h2><p>Bei Fragen erreichst du uns über unseren Discord-Support.</p>
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
            <p class="subtitle" style="color:${COLORS.textMuted};margin-bottom:28px;font-size:.82rem;">Last updated: ${new Date().toLocaleDateString("en-US")}</p>
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
        res.send(layout("Datenschutzerklärung", `
          <div class="page-header"><h1>Datenschutzerklärung</h1></div>
          <div class="content container">
            <p class="subtitle" style="color:${COLORS.textMuted};margin-bottom:28px;font-size:.82rem;">Zuletzt aktualisiert: ${new Date().toLocaleDateString("de-DE")}</p>
            <h2>1. Verantwortlicher</h2><p>Verantwortlich für die Datenverarbeitung ist der Betreiber von Resolvo Tool.</p>
            <h2>2. Welche Daten wir speichern</h2><ul><li>Discord Nutzer-ID und Nutzername</li><li>Discord Server-ID und Servername</li><li>Ticket-Inhalte und Nachrichten</li><li>Bewertungen und Zeitstempel</li><li>Zahlungsstatus (keine Zahlungsdaten)</li></ul>
            <h2>3. Zweck</h2><p>Die gespeicherten Daten werden ausschließlich zur Bereitstellung des Ticket-Systems verwendet.</p>
            <h2>4. Drittanbieter</h2><p><strong>Stripe:</strong> Zahlungsabwicklung.</p><p><strong>Discord:</strong> Nutzerdaten über die Discord API.</p>
            <h2>5. Datenlöschung</h2><p>Du kannst jederzeit die Löschung deiner Daten beantragen.</p>
            <h2>6. Deine Rechte</h2><ul><li>Recht auf Auskunft</li><li>Recht auf Berichtigung und Löschung</li><li>Recht auf Einschränkung</li></ul>
            <h2>7. Datensicherheit</h2><p>Alle Daten werden verschlüsselt übertragen (HTTPS) und in einer SQLite-Datenbank gespeichert.</p>
          </div>
        `, { activeNav: "privacy", lang }));
      }
    });

    
      // --- API: Support Chat ---

    router.post("/api/chat", async (req, res) => {
          const { message, lang: reqLang, history } = req.body;
          if (!message || typeof message !== "string") {
            return res.status(400).json({ error: "Message required" });
          }
          const isEn = reqLang === "en";
          const GROQ_API_KEY = process.env.GROQ_API_KEY;

          // ── Groq AI (primary) ─────────────────────────────────────────────────────
          if (GROQ_API_KEY) {
            try {
              const systemPrompt = isEn
                ? `You are the friendly support assistant for "Resolvo Tool", a professional Discord ticket bot.
  Answer in English. Be helpful, concise and specific. Always try to solve the user's problem.

  COMPLETE KNOWLEDGE BASE:
  - Resolvo Tool is a Discord ticket bot with a web dashboard at resolvo-tool-production.up.railway.app
  - INVITE LINK: resolvo-tool-production.up.railway.app/add (needs admin rights on the server)
  - DASHBOARD: Sign in with Discord → select server → configure everything

  COMMANDS:
  /ticket create — opens a new ticket (private channel)
  /ticket close — closes current ticket, creates transcript, archives channel
  /ticket add @user — adds a user to the ticket channel
  /ticket remove @user — removes a user from the ticket channel
  /panel — posts the ticket panel button in a channel (members click it to open tickets)
  /setup — shows current setup status
  /category add [name] — creates a ticket category
  /category list — lists all active categories
  /category remove [name] — deletes a category
  /faq add [question] [answer] — adds a FAQ entry (bot auto-answers matching tickets)
  /faq list — lists all FAQ entries
  /stats — shows ticket statistics for the server
  /premium — shows premium info and purchase link
  /help — shows command overview
  /dashboard — sends dashboard link

  FEATURES:
  - Interactive ticket panel with button in any channel
  - Automatic transcripts when tickets are closed (sent to log channel)
  - Smart FAQ system: auto-answers tickets that match FAQ entries
  - AI classification: auto-sets ticket priority (Low/Medium/High/Critical)
  - Automatic escalation with staff notifications
  - Ticket categories (unlimited with Premium)
  - Staff rating system after ticket close
  - Statistics dashboard (web)

  PANEL SETUP (step by step):
  1. Invite bot with /add link above
  2. Log into dashboard and select your server
  3. Go to "Configure" 
  4. Choose the panel channel and log channel
  5. Run /panel in that channel → button appears
  6. Members can now click the button to open tickets

  PREMIUM (one-time €5.99, no subscription):
  - Unlimited ticket categories (free: limited)
  - Extended statistics & staff leaderboard
  - AI ticket classification
  - Priority support
  - Purchase at: resolvo-tool-production.up.railway.app/premium

  PERMISSIONS NEEDED:
  Bot needs "Administrator" role OR at minimum:
  - Manage Channels, Manage Roles
  - Read/Send Messages in all relevant channels
  - Send Embeds, Attach Files
  - View Channel, Read Message History

  COMMON ISSUES:
  - "Bot not responding": Check bot has correct permissions and is online
  - "Can't create ticket": Ensure panel is set up (/panel command) and bot has channel permissions
  - "Transcript not sent": Check log channel is configured in dashboard
  - "Category not showing": Run /category list to verify, use /category add [name]
  - "escalated column error": Known DB migration issue, being fixed automatically

  If you don't know something specific, say so honestly and suggest using the contact form.`
                : `Du bist der freundliche Support-Assistent von "Resolvo Tool", einem professionellen Discord-Ticket-Bot.
  Antworte auf Deutsch. Sei hilfsbereit, präzise und lösungsorientiert. Versuche immer das Problem des Nutzers zu lösen.

  VOLLSTÄNDIGE WISSENSDATENBANK:
  - Resolvo Tool ist ein Discord-Ticket-Bot mit Web-Dashboard unter resolvo-tool-production.up.railway.app
  - EINLADEN: resolvo-tool-production.up.railway.app/add (benötigt Admin-Rechte auf dem Server)
  - DASHBOARD: Mit Discord anmelden → Server auswählen → alles konfigurieren

  BEFEHLE:
  /ticket create — öffnet ein neues Ticket (privater Kanal)
  /ticket close — schließt aktuelles Ticket, erstellt Transkript, archiviert Kanal
  /ticket add @nutzer — fügt Nutzer zum Ticket-Kanal hinzu
  /ticket remove @nutzer — entfernt Nutzer aus dem Ticket-Kanal
  /panel — postet den Ticket-Panel-Button in einem Kanal (Mitglieder klicken ihn zum Öffnen)
  /setup — zeigt aktuellen Setup-Status
  /category add [name] — erstellt eine Ticket-Kategorie
  /category list — listet alle aktiven Kategorien auf
  /category remove [name] — löscht eine Kategorie
  /faq add [frage] [antwort] — fügt FAQ-Eintrag hinzu (Bot antwortet automatisch)
  /faq list — listet alle FAQ-Einträge auf
  /stats — zeigt Ticket-Statistiken für den Server
  /premium — zeigt Premium-Infos und Kauflink
  /help — zeigt Befehls-Übersicht
  /dashboard — sendet Dashboard-Link

  FUNKTIONEN:
  - Interaktives Ticket-Panel mit Button in beliebigem Kanal
  - Automatische Transkripte beim Schließen (werden in Log-Kanal gesendet)
  - Smart-FAQ: beantwortet automatisch Tickets die FAQ-Einträgen ähneln
  - KI-Klassifizierung: setzt automatisch Priorität (Niedrig/Mittel/Hoch/Kritisch)
  - Automatische Eskalation mit Staff-Benachrichtigungen
  - Ticket-Kategorien (unbegrenzt mit Premium)
  - Staff-Bewertungssystem nach Ticket-Schließung
  - Statistik-Dashboard (Web)

  PANEL EINRICHTEN (Schritt für Schritt):
  1. Bot einladen über den /add Link oben
  2. Im Dashboard anmelden, Server auswählen
  3. Auf "Konfigurieren" gehen
  4. Panel-Kanal und Log-Kanal auswählen
  5. /panel in dem Kanal ausführen → Button erscheint
  6. Mitglieder können jetzt auf den Button klicken

  PREMIUM (einmalig 5,99 €, kein Abo):
  - Unbegrenzte Ticket-Kategorien (kostenlos: begrenzt)
  - Erweiterte Statistiken & Staff-Leaderboard
  - KI-Ticket-Klassifizierung
  - Prioritäts-Support
  - Kaufen unter: resolvo-tool-production.up.railway.app/premium

  BENÖTIGTE BERECHTIGUNGEN:
  Bot benötigt "Administrator"-Rolle ODER mindestens:
  - Kanäle verwalten, Rollen verwalten
  - Nachrichten lesen/senden in allen relevanten Kanälen
  - Einbettungen senden, Dateien anhängen
  - Kanal sehen, Nachrichtenverlauf lesen

  HÄUFIGE PROBLEME:
  - "Bot antwortet nicht": Berechtigungen prüfen, Bot online?
  - "Ticket kann nicht erstellt werden": Panel eingerichtet (/panel)? Bot hat Kanal-Berechtigungen?
  - "Transkript wird nicht gesendet": Log-Kanal im Dashboard konfiguriert?
  - "Kategorie erscheint nicht": /category list ausführen zum Prüfen
  - Für alles weitere: Kontaktformular nutzen

  Falls du etwas nicht weißt, sag es ehrlich und empfehle das Kontaktformular.`;

              // Build conversation history for context
              const messages = [{ role: "system", content: systemPrompt }];
              if (Array.isArray(history)) {
                for (const h of history.slice(-6)) { // keep last 3 exchanges
                  if (h.role === "user" || h.role === "assistant") {
                    messages.push({ role: h.role, content: String(h.content).substring(0, 500) });
                  }
                }
              }
              messages.push({ role: "user", content: message });

              const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${GROQ_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "llama-3.3-70b-versatile",
                  messages,
                  max_tokens: 400,
                  temperature: 0.4,
                }),
              });

              if (groqRes.ok) {
                const data = await groqRes.json();
                const reply = data.choices?.[0]?.message?.content?.trim() || "";
                if (reply) {
                  // canHelp=false only if AI explicitly says it can't help
                  const canHelp = !reply.toLowerCase().includes("kontaktformular nutzen") &&
                                  !reply.toLowerCase().includes("use the contact form");
                  return res.json({ reply, canHelp });
                }
              }
            } catch (aiErr) {
              // Fall through to keyword system
            }
          }

          // ── Keyword fallback (when no GROQ_API_KEY or AI fails) ──────────────────
          const lower = message.toLowerCase().trim();
          const rules = [
            { match: w => ["hallo","hi","hey","guten tag","moin","servus","hello","good morning","howdy"].some(g => w.includes(g)),
              de: "Hallo! Ich bin der Resolvo Tool Support-Bot. Stell mir deine Frage zu Tickets, Befehlen, dem Panel, Premium oder anderen Themen — ich helfe dir gerne!",
              en: "Hi! I'm the Resolvo Tool support bot. Ask me anything about tickets, commands, the panel, premium or other topics — happy to help!" },
            { match: w => w.includes("ticket") && (w.includes("erstell") || w.includes("öffn") || w.includes("neu") || w.includes("create") || w.includes("open")),
              de: "Ticket erstellen:\n1. Klicke auf den Panel-Button in deinem Server\n2. Wähle eine Kategorie\n3. Dein privater Ticket-Kanal wird automatisch erstellt\n\nAlternativ: /ticket create im erlaubten Kanal eingeben.",
              en: "Create a ticket:\n1. Click the panel button in your server\n2. Choose a category\n3. Your private ticket channel is created automatically\n\nAlternatively: type /ticket create in an allowed channel." },
            { match: w => w.includes("ticket") && (w.includes("schließ") || w.includes("close") || w.includes("zumach")),
              de: "/ticket close im Ticket-Kanal eingeben oder den Schließen-Button klicken. Das Ticket wird archiviert und ein Transkript erstellt.",
              en: "Type /ticket close in the ticket channel or click the close button. The ticket gets archived and a transcript is created." },
            { match: w => w.includes("panel") || w.includes("einricht") || w.includes("setup") || w.includes("konfigur"),
              de: "Panel einrichten:\n1. Bot einladen → Dashboard öffnen → Server wählen\n2. Panel-Kanal & Log-Kanal konfigurieren\n3. /panel im gewünschten Kanal ausführen → Button erscheint\n4. Mitglieder klicken den Button zum Ticket-Öffnen.",
              en: "Set up panel:\n1. Invite bot → open dashboard → select server\n2. Configure panel channel & log channel\n3. Run /panel in desired channel → button appears\n4. Members click the button to open tickets." },
            { match: w => w.includes("dashboard") || w.includes("webseite") || w.includes("website"),
              de: "Das Dashboard findest du unter resolvo-tool-production.up.railway.app — einfach mit Discord anmelden und Server auswählen.",
              en: "Find the dashboard at resolvo-tool-production.up.railway.app — just sign in with Discord and select your server." },
            { match: w => w.includes("befehl") || w.includes("command") || w.includes("hilfe") || w.includes("/help"),
              de: "Alle Befehle: /ticket create, /ticket close, /ticket add @user, /ticket remove @user, /panel, /category add/list/remove, /faq add/list, /stats, /premium, /help, /dashboard",
              en: "All commands: /ticket create, /ticket close, /ticket add @user, /ticket remove @user, /panel, /category add/list/remove, /faq add/list, /stats, /premium, /help, /dashboard" },
            { match: w => w.includes("premium") || w.includes("preis") || w.includes("kost") || w.includes("price") || w.includes("pay"),
              de: "Premium kostet einmalig 5,99 € (kein Abo!) und beinhaltet: unbegrenzte Kategorien, erweiterte Statistiken, KI-Klassifizierung und Prioritäts-Support.\nKaufen: resolvo-tool-production.up.railway.app/premium",
              en: "Premium costs a one-time €5.99 (no subscription!) and includes: unlimited categories, extended statistics, AI classification and priority support.\nBuy: resolvo-tool-production.up.railway.app/premium" },
            { match: w => w.includes("kategorie") || w.includes("category"),
              de: "Kategorien verwalten:\n• /category add [Name] — erstellen\n• /category list — anzeigen\n• /category remove [Name] — löschen\nMit Premium: unbegrenzte Kategorien.",
              en: "Manage categories:\n• /category add [name] — create\n• /category list — show\n• /category remove [name] — delete\nWith Premium: unlimited categories." },
            { match: w => w.includes("faq"),
              de: "FAQ-System: /faq add [Frage] [Antwort] um Einträge hinzuzufügen. Der Bot antwortet automatisch, wenn ein Ticket einem FAQ-Eintrag ähnelt.",
              en: "FAQ system: /faq add [question] [answer] to add entries. The bot automatically answers when a ticket matches a FAQ entry." },
            { match: w => w.includes("transkript") || w.includes("transcript") || w.includes("log"),
              de: "Beim Schließen eines Tickets erstellt Resolvo Tool automatisch ein vollständiges Transkript und sendet es in den konfigurierten Log-Kanal.",
              en: "When closing a ticket, Resolvo Tool automatically creates a complete transcript and sends it to the configured log channel." },
            { match: w => w.includes("berechtigung") || w.includes("permission") || w.includes("rechte") || w.includes("admin"),
              de: "Der Bot benötigt 'Administrator'-Rechte oder mindestens: Kanäle verwalten, Nachrichten senden, Einbettungen senden. Stelle sicher, dass die Bot-Rolle über den Ticket-Kanälen liegt.",
              en: "The bot needs 'Administrator' rights or at minimum: manage channels, send messages, send embeds. Make sure the bot role is above the ticket channels." },
            { match: w => w.includes("einlad") || w.includes("invite") || w.includes("hinzufüg") || w.includes("add"),
              de: "Bot einladen: resolvo-tool-production.up.railway.app/add (du benötigst Admin-Rechte auf dem Ziel-Server).",
              en: "Invite the bot: resolvo-tool-production.up.railway.app/add (you need admin rights on the target server)." },
            { match: w => w.includes("fehler") || w.includes("error") || w.includes("problem") || w.includes("funktionier") || w.includes("geht nicht"),
              de: "Beschreibe bitte genau was nicht funktioniert: Im Discord oder Dashboard? Gibt es eine Fehlermeldung? Hat der Bot die richtigen Berechtigungen?",
              en: "Please describe exactly what's not working: In Discord or dashboard? Is there an error message? Does the bot have the right permissions?" },
            { match: w => ["danke","thx","thanks","super","toll","perfekt","cool"].some(g => w.includes(g)),
              de: "Gern geschehen! Wenn du noch Fragen hast, bin ich hier. 😊",
              en: "You're welcome! If you have more questions, I'm here. 😊" },
          ];

          let reply = "";
          let canHelp = true;
          for (const rule of rules) {
            if (rule.match(lower)) { reply = isEn ? rule.en : rule.de; break; }
          }
          if (!reply) {
            canHelp = false;
            reply = isEn
              ? "I couldn't find a specific answer to your question. Please use the contact form below and our team will respond quickly."
              : "Auf diese Frage habe ich leider keine spezifische Antwort. Nutze bitte das Kontaktformular — unser Team antwortet schnell.";
          }
          res.json({ reply, canHelp });
        });

        router.post("/api/contact", async (req, res) => {
          const { name, email, issue } = req.body;
          if (!name || !email || !issue) {
            return res.status(400).json({ error: "All fields required" });
          }

          const CONTACT_EMAIL = "resolvotool@gmail.com";
          const smtpUser = process.env.SMTP_USER;
          const smtpPass = process.env.SMTP_PASS;

          if (!smtpUser || !smtpPass) {
            // Fallback: log to console if SMTP not configured
            console.log(`[Contact] ${name} <${email}>: ${issue.substring(0, 200)}`);
            return res.json({ success: true });
          }

          try {
            const nodemailer = (await import("nodemailer")).default;
            const transporter = nodemailer.createTransport({
              service: "gmail",
              auth: { user: smtpUser, pass: smtpPass },
            });

            await transporter.sendMail({
              from: `"Resolvo Tool Support" <${smtpUser}>`,
              to: CONTACT_EMAIL,
              replyTo: email,
              subject: `[Resolvo Support] Neue Anfrage von ${name}`,
              html: `
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
                  <div style="background:#0b0f1a;padding:24px;border-radius:12px 12px 0 0;">
                    <h2 style="color:#4f8cff;margin:0;font-size:1.2rem;">📬 Neue Support-Anfrage</h2>
                  </div>
                  <div style="background:#12192a;padding:24px;border-radius:0 0 12px 12px;border:1px solid #1e2d4d;border-top:none;">
                    <table style="width:100%;border-collapse:collapse;">
                      <tr><td style="color:#8aa2c9;padding:8px 0;font-size:.85rem;width:100px;">Name</td><td style="color:#e8ecf4;font-weight:600;">${name}</td></tr>
                      <tr><td style="color:#8aa2c9;padding:8px 0;font-size:.85rem;">E-Mail</td><td style="color:#4f8cff;"><a href="mailto:${email}" style="color:#4f8cff;">${email}</a></td></tr>
                    </table>
                    <hr style="border:1px solid #1e2d4d;margin:16px 0;">
                    <p style="color:#8aa2c9;font-size:.82rem;margin:0 0 8px;">Nachricht:</p>
                    <p style="color:#e8ecf4;white-space:pre-wrap;margin:0;">${issue}</p>
                  </div>
                </div>
              `,
            });

            res.json({ success: true });
          } catch (err) {
            console.error("[Contact] Email send error:", err.message);
            // Still return success to user — don't expose SMTP errors
            res.json({ success: true });
          }
        });
      export default router;