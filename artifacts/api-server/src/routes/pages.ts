import { Router } from "express";

const router = Router();

router.get("/terms", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nutzungsbedingungen – Resolvo Tool</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f13; color: #e0e0e0; line-height: 1.7; }
    .container { max-width: 800px; margin: 0 auto; padding: 60px 24px; }
    h1 { color: #fff; font-size: 2.2rem; margin-bottom: 8px; }
    .subtitle { color: #888; margin-bottom: 48px; font-size: 0.95rem; }
    h2 { color: #a78bfa; font-size: 1.1rem; margin: 36px 0 12px; text-transform: uppercase; letter-spacing: 0.05em; }
    p { color: #ccc; margin-bottom: 16px; }
    a { color: #a78bfa; text-decoration: none; }
    .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 48px; }
    .logo-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #a78bfa, #7c3aed); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    .logo-text { font-size: 1.3rem; font-weight: 700; color: #fff; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <div class="logo-icon">🎫</div>
      <div class="logo-text">Resolvo Tool</div>
    </div>
    <h1>Nutzungsbedingungen</h1>
    <p class="subtitle">Zuletzt aktualisiert: ${new Date().toLocaleDateString("de-DE")}</p>

    <h2>1. Geltungsbereich</h2>
    <p>Diese Nutzungsbedingungen gelten für die Nutzung des Discord-Bots „Resolvo Tool" sowie des zugehörigen Web-Dashboards. Mit der Installation des Bots oder der Nutzung des Dashboards stimmst du diesen Bedingungen zu.</p>

    <h2>2. Nutzung des Dienstes</h2>
    <p>Resolvo Tool darf ausschließlich für legale Zwecke und in Übereinstimmung mit den Discord-Nutzungsbedingungen verwendet werden. Jeglicher Missbrauch, insbesondere Spam, Belästigung oder das Umgehen von Sicherheitsmaßnahmen, ist untersagt.</p>

    <h2>3. Premium-Abonnement</h2>
    <p>Das Premium-Upgrade wird für eine einmalige Zahlung von 5,99€ angeboten und gewährt dauerhaften Zugang zu Premium-Funktionen. Es besteht kein Anspruch auf eine Rückerstattung nach erfolgter Aktivierung, es sei denn, dies ist gesetzlich vorgeschrieben.</p>

    <h2>4. Datenspeicherung</h2>
    <p>Wir speichern Discord-Nutzer-IDs, Server-IDs und Ticket-Inhalte zur Bereitstellung des Dienstes. Weitere Informationen findest du in unserer <a href="/privacy">Datenschutzerklärung</a>.</p>

    <h2>5. Verfügbarkeit</h2>
    <p>Wir bemühen uns um eine hohe Verfügbarkeit des Dienstes, können jedoch keine 100%ige Verfügbarkeit garantieren. Wartungsarbeiten und technische Probleme können zu vorübergehenden Ausfällen führen.</p>

    <h2>6. Haftungsbeschränkung</h2>
    <p>Resolvo Tool haftet nicht für Schäden, die durch die Nutzung oder Nicht-Nutzung des Dienstes entstehen, soweit dies gesetzlich zulässig ist.</p>

    <h2>7. Änderungen</h2>
    <p>Wir behalten uns vor, diese Nutzungsbedingungen jederzeit zu ändern. Änderungen werden auf dieser Seite bekannt gegeben.</p>

    <h2>8. Kontakt</h2>
    <p>Bei Fragen erreichst du uns über unseren <a href="https://discord.gg/resolvo">Support-Server</a>.</p>
  </div>
</body>
</html>`);
});

router.get("/privacy", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Datenschutzerklärung – Resolvo Tool</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f13; color: #e0e0e0; line-height: 1.7; }
    .container { max-width: 800px; margin: 0 auto; padding: 60px 24px; }
    h1 { color: #fff; font-size: 2.2rem; margin-bottom: 8px; }
    .subtitle { color: #888; margin-bottom: 48px; font-size: 0.95rem; }
    h2 { color: #a78bfa; font-size: 1.1rem; margin: 36px 0 12px; text-transform: uppercase; letter-spacing: 0.05em; }
    p { color: #ccc; margin-bottom: 16px; }
    ul { color: #ccc; margin: 0 0 16px 24px; }
    li { margin-bottom: 6px; }
    a { color: #a78bfa; text-decoration: none; }
    .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 48px; }
    .logo-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #a78bfa, #7c3aed); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    .logo-text { font-size: 1.3rem; font-weight: 700; color: #fff; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <div class="logo-icon">🎫</div>
      <div class="logo-text">Resolvo Tool</div>
    </div>
    <h1>Datenschutzerklärung</h1>
    <p class="subtitle">Zuletzt aktualisiert: ${new Date().toLocaleDateString("de-DE")}</p>

    <h2>1. Verantwortlicher</h2>
    <p>Verantwortlich für die Datenverarbeitung ist der Betreiber von Resolvo Tool. Bei Fragen wende dich an unseren <a href="https://discord.gg/resolvo">Support-Server</a>.</p>

    <h2>2. Welche Daten wir speichern</h2>
    <ul>
      <li>Discord Nutzer-ID und Nutzername</li>
      <li>Discord Server-ID und Servername</li>
      <li>Ticket-Inhalte und Nachrichten</li>
      <li>Bewertungen und Zeitstempel</li>
      <li>Zahlungsstatus (kein Speichern von Zahlungsdaten – diese werden von Stripe verarbeitet)</li>
    </ul>

    <h2>3. Zweck der Datenverarbeitung</h2>
    <p>Die gespeicherten Daten werden ausschließlich zur Bereitstellung des Ticket-Systems, des Web-Dashboards und der Premium-Funktionen verwendet.</p>

    <h2>4. Drittanbieter</h2>
    <p><strong>Stripe:</strong> Zahlungsabwicklung. Stripe verarbeitet Zahlungsdaten gemäß ihrer eigenen Datenschutzerklärung (<a href="https://stripe.com/de/privacy">stripe.com/de/privacy</a>).</p>
    <p><strong>Discord:</strong> Nutzerdaten werden über die Discord API abgerufen und gemäß Discords Datenschutzerklärung verarbeitet.</p>

    <h2>5. Datenlöschung</h2>
    <p>Du kannst jederzeit die Löschung deiner Daten beantragen. Kontaktiere uns dazu über unseren Support-Server. Ticket-Daten werden nach Schließung automatisch anonymisiert.</p>

    <h2>6. Deine Rechte</h2>
    <ul>
      <li>Recht auf Auskunft über gespeicherte Daten</li>
      <li>Recht auf Berichtigung unrichtiger Daten</li>
      <li>Recht auf Löschung deiner Daten</li>
      <li>Recht auf Einschränkung der Verarbeitung</li>
    </ul>

    <h2>7. Datensicherheit</h2>
    <p>Alle Daten werden verschlüsselt übertragen (HTTPS) und in einer gesicherten PostgreSQL-Datenbank gespeichert.</p>
  </div>
</body>
</html>`);
});

export default router;
